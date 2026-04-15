import { DB } from "https://deno.land/x/sqlite@v3.9.1/mod.ts";
import { Handlers } from "$fresh/server.ts";

async function handleSync(_req: Request) {
  const db = new DB("sumo.db");

  try {
    const { bashoId } = await _req.json();

    // 1. Fetch from the Sumo API (using your existing fetch logic)
    const response = await fetch(
      `https://www.sumo-api.com/api/basho/${bashoId}/banzuke/Makuuchi`,
    );
    const data = await response.json();
    console.log("Fetched Banzuke Data");

    // 2. Ensure Tournament exists in DB
    db.query(
      "INSERT OR IGNORE INTO tournaments (basho_id, name) VALUES (?, ?)",
      [
        bashoId,
        `${bashoId} Tournament`,
      ],
    );

    const tIdResult = db.query(
      "SELECT id FROM tournaments WHERE basho_id = ?",
      [bashoId],
    );
    const tournamentInternalId = tIdResult.length > 0 ? tIdResult[0][0] : null;
    // 3. Populate Wrestlers and Banzuke
    // 3. Combine East and West rikishi into one list to process
    const allRikishi = [...(data.east || []), ...(data.west || [])];

    if (allRikishi.length === 0) {
      throw new Error("No rikishi data found for this Basho ID.");
    }

    for (const entry of allRikishi) {
      // Insert/Update Wrestler (using shikonaEn as the name)
      db.query(
        "INSERT OR IGNORE INTO wrestlers (shikonaEn, shikonaJp) VALUES (?, ?)",
        [entry.shikonaEn, entry.shikonaJp],
      );

      const wIdResult = db.query(
        "SELECT id FROM wrestlers WHERE shikonaEn = ?",
        [
          entry.shikonaEn,
        ],
      );
      const wrestlerId = wIdResult[0][0];

      // Create the Banzuke link
      db.query(
        `INSERT OR REPLACE INTO banzuke (tournament_id, wrestler_id, rank, side) 
     VALUES (?, ?, ?, ?)`,
        [tournamentInternalId, wrestlerId, entry.rank, entry.side],
      );
    }

    return { count: allRikishi.length };

    const rikishiCount = data.rikishi.length;

    return { count: rikishiCount };
  } finally {
    db.close();
  }
}

async function handleTestHook(_req: Request) {
  // This is just a placeholder to show how you can add more admin actions
  console.log("Test Hook Triggered!");
  return new Response("", {
    status: 303,
    headers: { "Location": "/admin" },
  });
}

// ✅ Explicitly handle POST
export const handler: Handlers = {
  async POST(req) {
    console.log("Received POST request to /api/sync-banzuke");

    try {
      // Execute the sync logic
      // Assuming handleSync(req) handles the db inserts and returns a summary
      const result = await handleSync(req);

      return new Response(
        JSON.stringify({
          success: true,
          count: result.count,
          message: "Banzuke updated successfully",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    } catch (err) {
      console.error("Sync Error:", err);

      return new Response(
        JSON.stringify({
          success: false,
          error: err.message || "Internal Server Error",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
  },
};
