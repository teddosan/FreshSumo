import { Pool } from "npm:pg";
import { Handlers } from "$fresh/server.ts";

async function handleSync(_req: Request) {
  const db = new Pool();

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

    try {
      for (const entry of matches) {
        console.log(
          `Processing Match: East ${entry.eastId} vs West ${entry.westId}, Winner: ${entry.winnerId}, Kimarite: ${entry.kimarite}`,
        );
        db.query(
          `
          INSERT OR REPLACE INTO results (id, basho_id, day, east_id, west_id, winner_id, kimarite)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
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
      if (err.message.includes("FOREIGN KEY constraint failed")) {
        // This looks for current violations in the whole DB
        const violations = db.query("PRAGMA foreign_key_check(results)");
        console.error("FK Violations found:", violations);

        // Result format: [table_name, rowid, referenced_table, foreign_key_index]
        violations.forEach((v) => {
          console.log(
            `Row ${v[1]} in results points to a missing record in ${v[2]}`,
          );
        });
      }
      throw err;
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
