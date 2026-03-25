import { Handlers, PageProps } from "$fresh/server.ts";
import { DB } from "https://deno.land/x/sqlite@v3.9.1/mod.ts";
import SyncButton from "../islands/SyncButton.tsx";

interface Standings {
  owner: string;
  wins: number;
  totalMatches: number;
  winRate: string;
}

export const handler: Handlers = {
  GET(_req, ctx) {
    const db = new DB("sumo.db");
    
    // 1. Fetch detailed standings
    const rows = db.query(`
      SELECT 
        w.owner, 
        COUNT(CASE WHEN r.result = 'win' THEN 1 END) as wins,
        COUNT(r.result) as total
      FROM daily_results r
      JOIN wrestlers w ON r.rikishi_name = w.name
      WHERE r.basho_id = '202603'
      GROUP BY w.owner
      ORDER BY wins DESC
    `);

    const standings: Standings[] = rows.map(([owner, wins, total]: any) => ({
      owner,
      wins,
      totalMatches: total,
      winRate: ((wins / total) * 100).toFixed(1) + "%"
    }));

    db.close();
    return ctx.render({ standings });
  },
};

export default function Home({ data }: PageProps) {
  return (
    <div class="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Header Section */}
      <header class="bg-indigo-900 text-white py-10 px-4 text-center shadow-lg">
        <h1 class="text-4xl font-black tracking-tighter uppercase mb-2">
          🎏 Columbus Fantasy Sumo League
        </h1>
        <p class="text-indigo-200 font-medium">March 2026 Basho • Final Standings</p>
      </header>

      <main class="max-w-xl mx-auto -mt-8 p-4 pb-20">
        {/* Leaderboard Section */}
        <div class="space-y-4">
          {data.standings.map((player: Standings, index: number) => (
            <div class={`bg-white rounded-2xl p-6 shadow-sm border-2 flex items-center justify-between ${
              index === 0 ? "border-amber-400 ring-4 ring-amber-100" : "border-transparent"
            }`}>
              <div class="flex items-center gap-4">
                <span class={`text-2xl font-black w-10 h-10 flex items-center justify-center rounded-full ${
                  index === 0 ? "bg-amber-400 text-white" : "bg-slate-100 text-slate-400"
                }`}>
                  {index + 1}
                </span>
                <div>
                  <h2 class="text-xl font-bold">{player.owner}</h2>
                  <p class="text-sm text-slate-500 font-medium">{player.winRate} Win Rate</p>
                </div>
              </div>
              <div class="text-right">
                <span class="text-3xl font-black text-indigo-900">{player.wins}</span>
                <p class="text-[10px] uppercase tracking-widest font-bold text-slate-400">Wins</p>
              </div>
            </div>
          ))}
        </div>

        {/* Action Center */}
        <div class="mt-10 space-y-3">
          <h3 class="text-xs font-bold uppercase tracking-widest text-slate-400 px-2">Controls</h3>
          <SyncButton />
          
          <div class="grid grid-cols-2 gap-3">
            <a href="/results" class="bg-white border border-slate-200 py-3 rounded-xl text-center font-bold text-slate-600 hover:bg-slate-50">
              📊 All Bouts
            </a>
            <a href="/draft" class="bg-white border border-slate-200 py-3 rounded-xl text-center font-bold text-slate-600 hover:bg-slate-50">
              🎏 May Draft
            </a>
          </div>
        </div>
      </main>
      
      <footer class="text-center py-6 text-slate-400 text-xs">
        Dublin, Ohio Sumo Tech • v1.0
      </footer>
    </div>
  );
}