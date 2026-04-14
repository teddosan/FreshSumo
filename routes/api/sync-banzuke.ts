import { DB } from "https://deno.land/x/sqlite@v3.9.1/mod.ts";
import { Handlers } from "$fresh/server.ts";

async function handleSync(_req: Request) {
  const db = new DB("sumo.db");

  try {
    const { basho_id } = await _req.json();

    if (!basho_id || !/^\d{6}$/.test(basho_id)) {
      return new Response(
        JSON.stringify({ error: "Invalid ID format. Use YYYYMM." }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // 1. Fetch from the Sumo API (using your existing fetch logic)
    const response = await fetch(
      `https://www.sumo-api.com/api/basho/${basho_id}/banzuke/Makuuchi`,
    );
    const data = await response.json();
    console.log("Fetched Banzuke Data:", data);

    // 2. Ensure Tournament exists in DB
    db.query(
      "INSERT OR IGNORE INTO tournaments (basho_id, name) VALUES (?, ?)",
      [
        basho_id,
        `${basho_id} Tournament`,
      ],
    );

    const tIdResult = db.query(
      "SELECT id FROM tournaments WHERE basho_id = ?",
      [basho_id],
    );
    const tournamentInternalId = tIdResult[0][0];

    // 3. Populate Wrestlers and Banzuke
    for (const entry of data.rikishi) {
      // Update/Insert Wrestler
      db.query(
        "INSERT OR IGNORE INTO wrestlers (shikona, current_heya) VALUES (?, ?)",
        [entry.shikona, entry.heya],
      );

      const wIdResult = db.query("SELECT id FROM wrestlers WHERE shikona = ?", [
        entry.shikona,
      ]);
      const wrestlerId = wIdResult[0][0];

      // Create the Banzuke link
      db.query(
        `INSERT OR REPLACE INTO banzuke (tournament_id, wrestler_id, rank, side) 
          VALUES (?, ?, ?, ?)`,
        [tournamentInternalId, wrestlerId, entry.rank, entry.side],
      );
    }

    const rikishiCount = 42; // Replace with your actual count from the loop

    return new Response(
      JSON.stringify({ success: true, count: rikishiCount }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
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
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  },
};
