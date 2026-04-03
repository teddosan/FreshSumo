import { Handlers, PageProps } from "$fresh/server.ts";
import { DB } from "https://deno.land/x/sqlite@v3.9.1/mod.ts";

interface Rikishi {
  name: string;
  rank: string;
  stable: string;
  owner: string;
}

interface Data {
  roster: Rikishi[];
}

export const handler: Handlers<Data> = {
  GET(_req, ctx) {
    const db = new DB("sumo.db");

    // 1. CRITICAL: Ensure the table exists BEFORE we query it
    db.execute(`
      CREATE TABLE IF NOT EXISTS wrestlers (
        name TEXT PRIMARY KEY,
        rank TEXT,
        stable TEXT,
        owner TEXT DEFAULT 'Unassigned'
      )
    `);

    // 2. Now the query will never fail with "no such table"
    const rows = db.query(`
      SELECT name, rank, stable, owner 
      FROM wrestlers 
      ORDER BY 
        CASE 
          WHEN rank LIKE 'Y%' THEN 1
          WHEN rank LIKE 'O%' THEN 2
          WHEN rank LIKE 'S%' THEN 3
          WHEN rank LIKE 'K%' THEN 4
          WHEN rank LIKE 'M%' THEN 5
          ELSE 6
        END, rank ASC
    `);

    const roster: Rikishi[] = rows.map(([name, rank, stable, owner]) => ({
      name: name as string,
      rank: rank as string,
      stable: stable as string,
      owner: owner as string,
    }));

    db.close();
    return ctx.render({ roster });
  },

  async POST(req, ctx) {
    const db = new DB("sumo.db");
    try {
      const resp = await fetch(
        "https://www.sumo-api.com/api/basho/202603/banzuke/Makuuchi",
      );
      const apiData = await resp.json();

      // 1. Combine the two sides of the Banzuke
      const east = apiData.east || [];
      const west = apiData.west || [];
      const allRikishi = [...east, ...west];

      if (allRikishi.length === 0) {
        throw new Error("No rikishi found in the east or west arrays.");
      }

      db.transaction(() => {
        for (const item of allRikishi) {
          // Map the API fields to your DB columns
          const name = item.shikonaEn; // e.g., "Hoshoryu"
          const rank = item.rank; // e.g., "Yokozuna 1 East"
          // Note: The snippet doesn't show 'stable', so we use a placeholder
          // or check if 'heya' exists elsewhere in your full API response.
          const stable = item.heya || "Unknown";

          db.query(
            `
          INSERT INTO wrestlers (name, rank, stable, owner)
          VALUES (?, ?, ?, 'Unassigned')
          ON CONFLICT(name) DO UPDATE SET
            rank = excluded.rank
        `,
            [name, rank, stable],
          );
        }
      });

      db.close();
      return new Response("", {
        status: 303,
        headers: { "Location": "/rikishi" },
      });
    } catch (err) {
      console.error("Detailed Sync Failure:", err);
      db.close();
      return new Response(`Sync Failed: ${err.message}`, { status: 500 });
    }
  },
};

export default function RikishiPage({ data }: PageProps<Data>) {
  return (
    <div class="p-8 max-w-6xl mx-auto">
      <div class="flex justify-between items-center mb-10">
        <div>
          <h1 class="text-4xl font-black text-indigo-900 tracking-tight">
            RIKISHI
          </h1>
          <p class="text-slate-500 font-medium text-sm">
            March 2026 Official Banzuke
          </p>
        </div>

        <form method="POST">
          <button class="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-xl font-bold shadow-md transition-all active:scale-95 flex items-center gap-2">
            <span>🔄</span> Sync Banzuke
          </button>
        </form>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data.roster.length > 0
          ? (
            data.roster.map((r) => (
              <div class="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:border-indigo-200 transition-colors">
                <div class="flex justify-between items-start">
                  <span class="text-[10px] font-black bg-slate-100 text-slate-500 px-2 py-1 rounded">
                    {r.rank}
                  </span>
                  <span class="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">
                    {r.stable}
                  </span>
                </div>
                <h2 class="text-2xl font-bold text-slate-800 mt-2">{r.name}</h2>
                <div class="mt-4 pt-4 border-t border-dashed border-slate-100 flex justify-between items-center">
                  <span class="text-xs font-bold text-slate-400 uppercase">
                    Owner
                  </span>
                  <span class="text-sm font-black text-indigo-600">
                    {r.owner}
                  </span>
                </div>
              </div>
            ))
          )
          : (
            <div class="col-span-full py-20 text-center bg-slate-100 rounded-3xl border-2 border-dashed border-slate-200">
              <p class="text-slate-400 font-bold">
                No wrestlers found. Click "Sync" to populate the list!
              </p>
            </div>
          )}
      </div>
    </div>
  );
}
