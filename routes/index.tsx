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
    // 1. Flex container to hold Sidebar and Content side-by-side
    <div class="flex min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* SIDEBAR: Fixed width, full height, sticky */}
      <aside class="hidden md:flex flex-col w-80 bg-indigo-950 text-indigo-100 h-screen sticky top-0 p-6 border-r border-indigo-800 shrink-0">
        <h1 class="text-2xl font-black text-white mb-8 tracking-tighter uppercase">
          🎏 Fantasy Sumo
        </h1>

        <nav class="space-y-2 flex-grow">
          <p class="text-[10px] uppercase tracking-widest font-bold text-indigo-400 mb-2">
            Navigation
          </p>
          <a
            href="#"
            class="block p-2 rounded-lg bg-indigo-900 text-white font-bold"
          >
            Tournament Standings
          </a>
          <a
            href="#"
            class="block p-2 rounded-lg hover:bg-indigo-900 hover:text-white transition"
          >
            My Stable
          </a>
          <a
            href="#"
            class="block p-2 rounded-lg hover:bg-indigo-900 hover:text-white transition"
          >
            Wrestler Database
          </a>

          <div class="pt-6">
            <p class="text-[10px] uppercase tracking-widest font-bold text-indigo-400 mb-2">
              Current Tournament
            </p>
            <a
              href="/results"
              class="block p-2 rounded-lg hover:bg-indigo-900 transition"
            >
              📊 All Bouts
            </a>
            <SyncButton />
          </div>
        </nav>

        {/* 2. ACTION CENTER: Now pinned to the bottom of the sidebar */}
        <div class="mt-auto pt-6 border-t border-indigo-800">
          {data.isAllowed
            ? (
              <div class="space-y-4">
                <div>
                  <p class="text-[10px] uppercase font-bold text-indigo-400">
                    Authenticated
                  </p>
                  <p class="text-sm font-bold truncate">{data.userEmail}</p>
                </div>
                <form method="POST" action="/api/logout">
                  <button
                    type="submit"
                    class="w-full py-2 rounded-xl font-bold text-sm bg-indigo-800 hover:bg-red-600 transition duration-200"
                  >
                    Logout
                  </button>
                </form>
              </div>
            )
            : (
              <div class="space-y-3">
                <p class="text-xs text-indigo-300">
                  Sign in to manage your stable.
                </p>
                <div class="flex flex-col gap-2">
                  <a
                    href="/login"
                    class="w-full py-2 rounded-xl text-center font-bold text-sm bg-white text-indigo-950 hover:bg-indigo-50"
                  >
                    Login
                  </a>
                  <a
                    href="/register"
                    class="w-full py-2 rounded-xl text-center font-bold text-sm border border-indigo-400 hover:bg-indigo-900"
                  >
                    Register
                  </a>
                </div>
              </div>
            )}
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div class="flex-grow">
        <header class="bg-indigo-900 text-white py-12 px-8 shadow-lg">
          <h1 class="text-4xl font-black tracking-tighter uppercase mb-2">
            Columbus Fantasy Sumo League
          </h1>
          <p class="text-indigo-200 font-medium">
            March 2026 Basho • Standings
          </p>
        </header>

        <main class="max-w-2xl mx-auto -mt-8 p-6 pb-20">
          <div class="space-y-4">
            {data.standings.map((player: Standings, index: number) => (
              <div
                class={`bg-white rounded-2xl p-6 shadow-sm border-2 flex items-center justify-between transition-transform hover:scale-[1.01] ${
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

          <footer class="mt-12 text-center text-slate-400 text-xs">
            © 2026 Columbus Sumo League •{" "}
            {data.isAllowed ? `Session: ${data.userEmail}` : "Guest Access"}
          </footer>
        </main>
      </div>
    </div>
  );
}
