import { Handlers, PageProps } from "$fresh/server.ts";
import { pool } from "../utils/db.ts";

interface Matchup {
  east_name: string;
  east_rank: string;
  west_name: string;
  west_rank: string;
  day: number;
}

interface Data {
  matches: Matchup[];
  targetDay: number;
}

export const handler: Handlers<Data> = {
  async GET(_req, ctx) {
    const targetDay = ctx.state.watchedDay + 1; // Get the next day after the last watched day

    // 1. Get the Current Basho Metadata
    const bashoId = await pool.query(`
      SELECT value 
      FROM site_settings 
      WHERE key = 'current_basho'`);

    // 2. Fetch matches from the results table for that specific day
    // We join the banzuke table twice to get names and ranks for both IDs
    const matchQuery = await pool.query(
      `
      SELECT 
        r.id,
        r.west_id,
        r.east_id,
        r.day,
        we.shikona_en AS east_name,
        be.rank AS east_rank,
        ww.shikona_en AS west_name,
        bw.rank AS west_rank
      FROM results r
      JOIN banzuke be ON (r.east_id = be.rikishi_id AND r.basho_id = be.basho_id)
      JOIN banzuke bw ON (r.west_id = bw.rikishi_id AND r.basho_id = bw.basho_id)
      JOIN wrestlers we ON r.east_id = we.rikishi_id
      JOIN wrestlers ww ON r.west_id = ww.rikishi_id
      WHERE r.basho_id = (
        SELECT value::INTEGER 
        FROM site_settings 
        WHERE key = 'current_basho'
        )
        AND r.day = $1
      ORDER BY r.id ASC;
    `,
      [targetDay],
    );

    console.log("Fetched matches for Day", targetDay, ":", matchQuery.rows);
    return ctx.render({
      matches: matchQuery.rows,
      targetDay,
    });
  },
};

export default function UpcomingPage({ data }: PageProps<Data>) {
  return (
    <div class="min-h-screen bg-slate-50 font-sans text-slate-900">
      <header class="bg-indigo-900 text-white py-10 px-8 shadow-md border-b-4 border-amber-400">
        <div class="max-w-3xl mx-auto flex flex-col items-center">
          <h1 class="text-2xl font-black tracking-widest uppercase mb-1 opacity-80 text-center">
            Match Results
          </h1>
          <div class="flex items-center gap-3">
            <span class="text-4xl">⛩️</span>
            <h2 class="text-3xl font-bold italic text-center">
              {data.bashoName}
            </h2>
          </div>
          <p class="mt-4 bg-amber-400 text-indigo-900 px-4 py-1 rounded-full font-black uppercase text-sm">
            Day {data.targetDay} Bouts
          </p>
        </div>
      </header>

      <main class="max-w-2xl mx-auto py-10 px-6">
        {data.matches.length > 0
          ? (
            <div class="space-y-4">
              {data.matches.map((match, i) => (
                <div
                  key={i}
                  class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col sm:flex-row items-stretch transition-all hover:shadow-md"
                >
                  <div class="flex-1 p-5 text-center sm:text-right bg-gradient-to-l from-white to-slate-50">
                    <span class="inline-block px-2 py-0.5 rounded bg-red-50 text-red-700 text-[10px] font-bold uppercase mb-1">
                      {match.east_rank}
                    </span>
                    <h3 class="text-xl font-black text-slate-800">
                      {match.east_name}
                    </h3>
                  </div>

                  <div class="bg-slate-100 px-4 py-2 sm:py-0 border-y sm:border-y-0 sm:border-x border-slate-200 flex items-center justify-center">
                    <span class="text-xs font-black text-slate-400 italic">
                      VS
                    </span>
                  </div>

                  <div class="flex-1 p-5 text-center sm:text-left">
                    <span class="inline-block px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-bold uppercase mb-1">
                      {match.west_rank}
                    </span>
                    <h3 class="text-xl font-black text-slate-800">
                      {match.west_name}
                    </h3>
                  </div>
                </div>
              ))}
            </div>
          )
          : (
            <div class="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200">
              <p class="text-slate-400 font-medium">
                No matches found for Day {data.targetDay}.
              </p>
            </div>
          )}

        <footer class="mt-16 text-center">
          <a href="/" class="text-indigo-600 font-bold hover:underline">
            ← Return to Standings
          </a>
        </footer>
      </main>
    </div>
  );
}
