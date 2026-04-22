import { DB } from "https://deno.land/x/sqlite@v3.9.1/mod.ts";
import { Handlers } from "$fresh/server.ts";

async function handleSync(_req: Request) {
  const db = new DB("sumo.db");

  try {
    const { bashoId, day } = await _req.json();
    const dayString = day.toString();

    const response = await fetch(
      `https://www.sumo-api.com/api/basho/${bashoId}/torikumi/makuuchi/${dayString}`,
    );
    const data = await response.json();
    console.log("Fetched Day ${day} Data");

    const matches = data.torikumi || [];

    if (matches.length === 0) {
      throw new Error("No match data found for this Basho ID and day.");
    }

    for (const entry of matches) {
      db.query(
        `
        INSERT OR REPLACE INTO results (basho_id, day, east_id, west_id, winner_id, kimarite)
        VALUES (?, ?, ?, ?, ?, ?)
        `,
        [
          bashoId,
          day,
          entry.eastId,
          entry.westId,
          entry.winnerId,
          entry.kimarite,
        ],
      );
    }

    return { count: matches.length };
  } finally {
    db.close();
  }
}

// ✅ Explicitly handle POST
export const handler: Handlers = {
  async POST(req) {
    console.log("Received POST request to /api/sync-results");

    try {
      // Execute the sync logic
      // Assuming handleSync(req) handles the db inserts and returns a summary
      const result = await handleSync(req);

      return new Response(
        JSON.stringify({
          success: true,
          count: result.count,
          message: "Results updated successfully",
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
