import { Handlers, PageProps } from "$fresh/server.ts";
import { DB } from "https://deno.land/x/sqlite@v3.9.1/mod.ts";

interface Data {
  isAllowed: boolean;
  username: string | null;
  standings: Standings[];
  isAdmin: boolean;
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
    const user = ctx.state.user as
      | { username?: string; isAdmin?: boolean }
      | null;
    const isAllowed = !!user;

    const rows = db.query(`
      SELECT 
        b.owner, 
      COUNT(CASE WHEN r.winner_id = b.wrestler_id THEN 1 END) as wins,
      COUNT(*) as total,
      ROUND(
        CAST(COUNT(CASE WHEN r.winner_id = b.wrestler_id THEN 1 END) AS FLOAT) / COUNT(*) * 100, 
        2
      ) || '%' as win_rate
      FROM results r
      -- We join banzuke on either side of the match
      JOIN banzuke b ON (r.east_id = b.wrestler_id OR r.west_id = b.wrestler_id)
      WHERE r.basho_id = '202603'
        AND b.owner IS NOT NULL
      GROUP BY b.owner
      ORDER BY wins DESC;
    `);
    // ----------------------------------------------------------------
    // New database code below
    /*
    SELECT
      b.owner,
      SUM(CASE WHEN r.result = 'win' THEN 1 ELSE 0 END) as wins,
      -- Logic to calculate win rate based on matches played
      CAST(SUM(CASE WHEN r.result = 'win' THEN 1 ELSE 0 END) AS FLOAT) / COUNT(r.id) as winRate
    FROM banzuke b
    JOIN results r ON b.rikishi_id = r.rikishi_id AND b.tournament_id = r.tournament_id
    WHERE b.tournament_id = ? -- e.g., March 2026 ID
    GROUP BY b.owner
    ORDER BY wins DESC;
    */

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

    return ctx.render({
      standings,
      isAllowed,
      username: user?.username || null,
      isAdmin: user?.isAdmin || false,
    });
  },
};

export default function Home({ data }: PageProps<Data>) {
  return (
    // 1. Flex container to hold Sidebar and Content side-by-side
    <div class="flex min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* MAIN CONTENT AREA */}
      <div class="flex-grow">
        <header class="bg-indigo-900 text-white py-12 px-8 shadow-lg">
          <h1 class="text-4xl font-black tracking-tighter uppercase mb-2 text-center">
            Columbus Fantasy Sumo League
          </h1>
          <p class="text-indigo-200 font-medium text-center">
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
            {data.isAllowed ? `Session: ${data.username}` : "Guest Access"}
            {data.isAdmin ? " • Admin Privileges" : " • Peasant"}
          </footer>
        </main>
      </div>
    </div>
  );
}
