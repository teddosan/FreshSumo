import { DB } from "https://deno.land/x/sqlite@v3.9.1/mod.ts";
import { Handlers } from "$fresh/server.ts";

async function handleSync(_req: Request) {
  const db = new DB("sumo.db");

  try {
    const { bashoId } = await _req.json();

    // 1. Fetch Makuuchi Banzuke
    const mResponse = await fetch(
      `https://www.sumo-api.com/api/basho/${bashoId}/banzuke/Makuuchi`,
    );
    const mData = await mResponse.json();

    // 2. Fetch Juryo Banzuke
    const jResponse = await fetch(
      `https://www.sumo-api.com/api/basho/${bashoId}/banzuke/Juryo`,
    );
    const jData = await jResponse.json();
    console.log("Fetched Makuuchi and Juryo Data");

    // 3. Fetch Basho Dates
    const bResponse = await fetch(
      `https://www.sumo-api.com/api/basho/${bashoId}`,
    );
    const bData = await bResponse.json();

    // 4. Ensure Tournament exists
    db.query(
      "INSERT OR IGNORE INTO tournaments (basho_id, start_date, end_date) VALUES (?, ?, ?)",
      [bashoId, bData.startDate, bData.endDate],
    );

    // 5. Combine all rikishi from both divisions and both sides (East/West)
    const allRikishi = [
      ...(mData.east || []),
      ...(mData.west || []),
      ...(jData.east || []),
      ...(jData.west || []),
    ];

    if (allRikishi.length === 0) {
      throw new Error("No rikishi data found for this Basho ID.");
    }

    // 6. Process the combined list
    for (const entry of allRikishi) {
      // Use INSERT OR REPLACE so shikona updates if they change their name
      db.query(
        "INSERT OR REPLACE INTO wrestlers (rikishi_id, shikonaEn, shikonaJp) VALUES (?, ?, ?)",
        [entry.rikishiID, entry.shikonaEn, entry.shikonaJp],
      );

      db.query(
        `INSERT OR REPLACE INTO banzuke (basho_id, rikishi_id, rank) 
         VALUES (?, ?, ?)`,
        [bashoId, entry.rikishiID, entry.rank],
      );
    }

    return { count: allRikishi.length };
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
