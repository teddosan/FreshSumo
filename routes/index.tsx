import { Handlers, PageProps } from "$fresh/server.ts";
import { DB } from "https://deno.land/x/sqlite@v3.9.1/mod.ts";
import SyncButton from "../islands/SyncButton.tsx";

interface DashboardData {
  leaderboard: [string, number][];
  mvp: [string, number, string] | null;
}

export const handler: Handlers<DashboardData> = {
  GET(_req, ctx) {
    const db = new DB("sumo.db");

    // 1. Calculate Leaderboard
    const leaderboard = db.query(`
      SELECT w.owner, COUNT(r.result) as wins
      FROM daily_results r
      JOIN wrestlers w ON r.rikishi_name = w.name
      WHERE r.result = 'win' AND r.basho_id = '202603'
      GROUP BY w.owner
      ORDER BY wins DESC
    `) as [string, number][];

    // 2. Find Tournament MVP
    const mvpResult = db.query(`
      SELECT r.rikishi_name, COUNT(*) as wins, w.owner
      FROM daily_results r
      JOIN wrestlers w ON r.rikishi_name = w.name
      WHERE r.result = 'win' AND r.basho_id = '202603'
      GROUP BY r.rikishi_name
      ORDER BY wins DESC
      LIMIT 1
    `);

    const mvp = mvpResult.length > 0
      ? (mvpResult[0] as [string, number, string])
      : null;

    db.close();
    return ctx.render({ leaderboard, mvp });
  },
};

export default function Home({ data }: PageProps<DashboardData>) {
  return (
    <div class="min-h-screen bg-gray-100 p-4 md:p-8">
      <div class="max-w-2xl mx-auto">
        <header class="text-center mb-10">
          <h1 class="text-5xl font-black text-indigo-900 mb-2">🎏 SUMO BASH</h1>
          <p class="text-lg text-gray-600 font-medium">
            Dublin, OH League • March 2026
          </p>
        </header>

        {/* --- LEADERBOARD SECTION --- */}
        <section class="space-y-4 mb-10">
          <h2 class="text-xl font-bold text-gray-700 ml-2 italic">Standings</h2>
          {data.leaderboard.map(([owner, wins], index) => (
            <div
              class={`relative overflow-hidden p-6 rounded-2xl shadow-sm border-2 ${
                index === 0
                  ? "bg-amber-50 border-amber-400"
                  : "bg-white border-transparent"
              }`}
            >
              <div class="flex justify-between items-center relative z-10">
                <div>
                  <p class="text-xs font-bold text-amber-600 uppercase mb-1">
                    {index === 0 ? "👑 Basho Champion" : `Rank #${index + 1}`}
                  </p>
                  <h3 class="text-2xl font-black text-gray-900">{owner}</h3>
                </div>
                <div class="text-right">
                  <span class="text-4xl font-black text-indigo-900">
                    {wins}
                  </span>
                  <p class="text-xs font-bold text-gray-400 uppercase">Wins</p>
                </div>
              </div>
            </div>
          ))}
        </section>

        {/* --- MVP HIGHLIGHT --- */}
        {data.mvp && (
          <div class="bg-indigo-900 text-white p-6 rounded-2xl shadow-xl mb-10 flex items-center justify-between">
            <div>
              <p class="text-indigo-300 text-xs font-bold uppercase mb-1">
                Tournament MVP
              </p>
              <h3 class="text-2xl font-bold">{data.mvp[0]}</h3>
              <p class="text-sm opacity-80">Drafted by {data.mvp[2]}</p>
            </div>
            <div class="bg-white/10 p-4 rounded-full">
              <span class="text-2xl font-black">{data.mvp[1]} 🏆</span>
            </div>
          </div>
        )}

        {/* --- COMMAND CENTER --- */}
        <div class="grid grid-cols-1 gap-4">
          <SyncButton />

          <div class="grid grid-cols-2 gap-4">
            <a
              href="/draft"
              class="flex items-center justify-center bg-white border-2 border-indigo-100 p-4 rounded-xl font-bold text-indigo-600 hover:bg-indigo-50 transition"
            >
              🎏 Draft Room
            </a>
            <a
              href="/results"
              class="flex items-center justify-center bg-white border-2 border-indigo-100 p-4 rounded-xl font-bold text-indigo-600 hover:bg-indigo-50 transition"
            >
              📊 All Results
            </a>
          </div>
        </div>

        <footer class="mt-12 text-center text-gray-400 text-sm">
          Next Tournament: May 2026 • Osaka, Japan
        </footer>
      </div>
    </div>
  );
}
