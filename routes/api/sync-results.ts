import { pool } from "../../utils/db.ts";
import { Handlers } from "$fresh/server.ts";

async function handleSync(_req: Request) {
  try {
    const { bashoId, day } = await _req.json();
    const dayString = day.toString();

    const response = await fetch(
      `https://www.sumo-api.com/api/basho/${bashoId}/torikumi/makuuchi/${dayString}`,
    );
    const data = await response.json();
    console.log(`Fetched Day ${day} Data`);

    const matches = data.torikumi || [];

    if (matches.length === 0) {
      throw new Error("No match data found for this Basho ID and day.");
    }

    // Use a try-catch specifically for the DB operations
    try {
      for (const entry of matches) {
        console.log(
          `Processing Match: ID ${entry.id} | East ${entry.eastId} vs West ${entry.westId}`,
        );

        // Postgres Upsert: ON CONFLICT (id) DO UPDATE
        await pool.query(
          `
          INSERT INTO results (id, basho_id, day, east_id, west_id, winner_id, kimarite)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (id) 
          DO UPDATE SET 
            winner_id = EXCLUDED.winner_id,
            kimarite = EXCLUDED.kimarite
          `,
          [
            entry.id,
            bashoId,
            day,
            entry.eastId,
            entry.westId,
            entry.winnerId,
            entry.kimarite,
          ],
        );
      }
    } catch (err) {
      // Postgres Foreign Key Error handling
      // Error code 23503 is the standard for FK violations
      if (err.code === "23503") {
        console.error("❌ Foreign Key Violation:", err.detail);
        console.error(
          "Hint: Ensure all rikishi and the tournament exist in the DB before syncing results.",
        );
      }
      throw err;
    }

    return { count: matches.length };
  } catch (err) {
    console.error("Error in handleSync:", err);
    throw err;
  }
}

export const handler: Handlers = {
  async POST(req) {
    console.log("Received POST request to /api/sync-results");

    try {
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
