import { Handlers, PageProps } from "$fresh/server.ts";
import { DB } from "https://deno.land/x/sqlite@v3.9.1/mod.ts";
import SyncButton from "../islands/SyncButton.tsx";

interface Data {
  isAllowed: boolean;
  userEmail: string | null;
  standings: Standings[];
}

interface Standings {
  owner: string;
  wins: number;
  totalMatches: number;
  winRate: string;
}

export const handler: Handlers<Data> = {
  GET(_req, ctx) {
    const db = new DB("sumo.db");

    const user = ctx.state.user as { email?: string } | null;
    const isAllowed = !!user;
    const userEmail = user?.email ?? null;

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

    // SQLite returns loosely typed rows; we know this query returns:
    // [owner:string, wins:number, total:number]
    const standingsRows = rows as unknown as Array<[string, number, number]>;

    const standings: Standings[] = standingsRows.map((
      [owner, wins, total],
    ) => ({
      owner,
      wins,
      totalMatches: total,
      winRate: ((wins / total) * 100).toFixed(1) + "%",
    }));

    db.close();

    return ctx.render({ standings, isAllowed, userEmail });
  },
};

export default function Home({ data }: PageProps<Data>) {
  return (
    <div class="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Header Section */}
      <header class="bg-indigo-900 text-white py-10 px-4 text-center shadow-lg">
        <h1 class="text-4xl font-black tracking-tighter uppercase mb-2">
          🎏 Columbus Fantasy Sumo League
        </h1>
        <p class="text-indigo-200 font-medium">
          March 2026 Basho • Standings
        </p>
      </header>

      <aside class="hidden md:flex flex-col w-64 bg-indigo-900 border-r border-gray-600 p-6">
        <h1 class="text-2xl font-bold text-white mb-8">SumoFantasy</h1>
        <nav class="space-y-4">
          <a href="#" class="block hover:text-white">
            Tournament Standings
          </a>
          <a href="#" class="block hover:text-white">My Stable</a>
          <a href="#" class="block hover:text-white">Wrestler Database</a>
        </nav>
      </aside>

      <main class="max-w-xl mx-auto -mt-8 p-4 pb-20">
        {/* Leaderboard Section */}
        <div class="space-y-4">
          {data.standings.map((player: Standings, index: number) => (
            <div
              class={`bg-white rounded-2xl p-6 shadow-sm border-2 flex items-center justify-between ${
                index === 0
                  ? "border-amber-400 ring-4 ring-amber-100"
                  : "border-transparent"
              }`}
            >
              <div class="flex items-center gap-4">
                <span
                  class={`text-2xl font-black w-10 h-10 flex items-center justify-center rounded-full ${
                    index === 0
                      ? "bg-amber-400 text-white"
                      : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {index + 1}
                </span>
                <div>
                  <h2 class="text-xl font-bold">{player.owner}</h2>
                  <p class="text-sm text-slate-500 font-medium">
                    {player.winRate} Win Rate
                  </p>
                </div>
              </div>
              <div class="text-right">
                <span class="text-3xl font-black text-indigo-900">
                  {player.wins}
                </span>
                <p class="text-[10px] uppercase tracking-widest font-bold text-slate-400">
                  Wins
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Action Center */}
        <div class="mt-10 space-y-3">
          {data.isAllowed
            ? (
              <section class="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <div class="flex items-center justify-between gap-4">
                  <div>
                    <h3 class="text-sm font-bold uppercase tracking-widest text-slate-400">
                      Dashboard
                    </h3>
                    <p class="mt-2 text-slate-900 font-bold">
                      Signed in as{" "}
                      <span class="text-indigo-700">{data.userEmail}</span>
                    </p>
                  </div>
                  <form method="POST" action="/api/logout">
                    <button
                      type="submit"
                      class="px-4 py-2 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700 active:scale-95"
                    >
                      Logout
                    </button>
                  </form>
                </div>
              </section>
            )
            : (
              <section class="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <h3 class="text-sm font-bold uppercase tracking-widest text-slate-400">
                  Login
                </h3>
                <p class="mt-2 text-slate-700 font-medium">
                  Sign in to manage your draft.
                </p>
                <div class="mt-4 grid grid-cols-2 gap-3">
                  <a
                    href="/login"
                    class="bg-white border border-slate-200 py-3 rounded-xl text-center font-bold text-slate-600 hover:bg-slate-50"
                  >
                    Login
                  </a>
                  <a
                    href="/register"
                    class="bg-indigo-600 border border-indigo-600 py-3 rounded-xl text-center font-bold text-white hover:bg-indigo-700"
                  >
                    Register
                  </a>
                </div>
              </section>
            )}

          <h3 class="text-xs font-bold uppercase tracking-widest text-slate-400 px-2">
            Controls
          </h3>
          <SyncButton />

          <div class="grid grid-cols-2 gap-3">
            <a
              href="/results"
              class="bg-white border border-slate-200 py-3 rounded-xl text-center font-bold text-slate-600 hover:bg-slate-50"
            >
              📊 All Bouts
            </a>
            {data.isAllowed
              ? (
                <a
                  href="/draft"
                  class="bg-white border border-slate-200 py-3 rounded-xl text-center font-bold text-slate-600 hover:bg-slate-50"
                >
                  🎏 May Draft
                </a>
              )
              : (
                <a
                  href="/login"
                  class="bg-white border border-slate-200 py-3 rounded-xl text-center font-bold text-slate-600 hover:bg-slate-50"
                >
                  🔒 Login for Draft
                </a>
              )}
          </div>
        </div>
      </main>

      <footer class="text-center py-6 text-slate-400 text-xs">
        {data.isAllowed
          ? <>Signed in as {data.userEmail}</>
          : <>You are not logged in.</>}
      </footer>
    </div>
  );
}
