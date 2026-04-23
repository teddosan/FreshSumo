import { Handlers, PageProps } from "$fresh/server.ts";
// Import your pool from your db utility file
import { pool } from "../utils/db.ts";

interface Standings {
  owner: string;
  wins: number;
  totalMatches: number;
  winRate: string;
}

interface Data {
  isAllowed: boolean;
  username: string | null;
  standings: Standings[];
  isAdmin: boolean;
}

export const handler: Handlers<Data> = {
  // 1. MUST be async
  async GET(_req, ctx) {
    const user = ctx.state.user as
      | { username?: string; isAdmin?: boolean }
      | null;
    const isAllowed = !!user;
    const watchedDay = ctx.state.watchedDay || 15;

    // 2. Use $1 for parameters. Using template literals (${}) in SQL is dangerous!
    const query = `
      SELECT 
        b.owner, 
        COUNT(CASE WHEN r.winner_id = b.rikishi_id THEN 1 END)::INT as wins,
        COUNT(*)::INT as total,
        ROUND(
          (COUNT(CASE WHEN r.winner_id = b.rikishi_id THEN 1 END)::DECIMAL / 
          NULLIF(COUNT(*), 0)) * 100, 
          1
        ) as win_rate_num
      FROM results r
      JOIN banzuke b ON (r.east_id = b.rikishi_id OR r.west_id = b.rikishi_id)
      WHERE r.basho_id = 202603
        AND r.day <= $1
        AND b.owner IS NOT NULL
      GROUP BY b.owner
      ORDER BY wins DESC;
    `;

    // 3. Await the pool query
    const result = await pool.query(query, [watchedDay]);

    // 4. Map the rows (Postgres returns objects, not arrays)
    const standings: Standings[] = result.rows.map((row: any) => ({
      owner: row.owner,
      wins: row.wins,
      totalMatches: row.total,
      winRate: (row.win_rate_num || 0) + "%",
    }));

    return ctx.render({
      standings,
      isAllowed,
      username: user?.username || null,
      isAdmin: user?.isAdmin || false,
    });
  },
};

export default function Home({ data }: PageProps<Data>) {
  // Component remains exactly the same as your draft
  return (
    <div class="flex min-h-screen bg-slate-50 font-sans text-slate-900">
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
                key={player.owner}
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
            {data.isAllowed ? `User: ${data.username}` : "Guest Access"}
            {data.isAdmin ? " • Admin Privileges" : " • Peasant"}
          </footer>
        </main>
      </div>
    </div>
  );
}
