import { pool } from "../../utils/db.ts";
import { Handlers } from "$fresh/server.ts";

async function handleSync(_req: Request) {
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
    console.log(`Fetched data for Basho ${bashoId}`);

    // 3. Fetch Basho Dates
    const bResponse = await fetch(
      `https://www.sumo-api.com/api/basho/${bashoId}`,
    );
    const bData = await bResponse.json();

    // 4. Postgres Upsert: ON CONFLICT DO NOTHING (Replaces INSERT OR IGNORE)
    await pool.query(
      `INSERT INTO tournaments (basho_id, start_date, end_date) 
       VALUES ($1, $2, $3) 
       ON CONFLICT (basho_id) DO NOTHING`,
      [bashoId, bData.startDate, bData.endDate],
    );

    // 5. Combine all rikishi
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
      // Postgres Upsert: ON CONFLICT DO UPDATE (Replaces INSERT OR REPLACE)
      // This ensures if a wrestler changes their Shikona, we update it.
      await pool.query(
        `INSERT INTO wrestlers (rikishi_id, shikona_en, shikona_jp) 
         VALUES ($1, $2, $3) 
         ON CONFLICT (rikishi_id) 
         DO UPDATE SET shikona_en = EXCLUDED.shikona_en, shikona_jp = EXCLUDED.shikona_jp`,
        [entry.rikishiID, entry.shikonaEn, entry.shikonaJp],
      );

      // Banzuke update: Typically unique by basho + rikishi
      await pool.query(
        `INSERT INTO banzuke (basho_id, rikishi_id, rank) 
         VALUES ($1, $2, $3) 
         ON CONFLICT (basho_id, rikishi_id) 
         DO UPDATE SET rank = EXCLUDED.rank`,
        [bashoId, entry.rikishiID, entry.rank],
      );
    }

    return { count: allRikishi.length };
  } catch (err) {
    console.error("Error in handleSync:", err);
    throw err;
  }
}

// Handler remains mostly the same, ensuring it's async
export const handler: Handlers = {
  async POST(req) {
    console.log("Starting Banzuke Sync...");

    try {
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
      return new Response(
        JSON.stringify({
          success: false,
          error: err instanceof Error ? err.message : "Internal Server Error",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
  },
};
