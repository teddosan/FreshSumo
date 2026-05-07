import { Handlers, PageProps } from "$fresh/server.ts";
import { pool } from "../utils/db.ts";
import DraftButton from "../islands/DraftButton.tsx";

interface Rikishi {
  name: string;
  rank: string;
  kanji: string;
  owner: string | null;
  rikishi_id: number;
}

interface Data {
  roster: Rikishi[];
  username: string | null;
  bashoName: string;
}

export const handler: Handlers<Data> = {
  async GET(_req, ctx) {
    const username = ctx.state.user?.username || null;

    const query = `
      SELECT 
        w.shikona_en, 
        CASE 
          WHEN STRPOS(REPLACE(w.shikona_jp, '　', ' '), ' ') > 0 
          THEN SUBSTRING(
                 REPLACE(w.shikona_jp, '　', ' ') 
                 FROM 1 
                 FOR STRPOS(REPLACE(w.shikona_jp, '　', ' '), ' ') - 1
               )
          ELSE w.shikona_jp 
        END AS shikona_jp_last,
        b.rank, 
        b.owner,
        b.rikishi_id
      FROM wrestlers w
      JOIN banzuke b ON w.rikishi_id = b.rikishi_id
      WHERE b.basho_id = (
        SELECT value::INTEGER 
        FROM site_settings 
        WHERE key = 'current_basho'
        )
        AND b.rank NOT LIKE 'J%'
ORDER BY 
  -- 1. Tier Weight (Yokozuna is highest)
  CASE 
    WHEN b.rank LIKE 'Y%' THEN 1000
    WHEN b.rank LIKE 'O%' THEN 2000
    WHEN b.rank LIKE 'S%' THEN 3000
    WHEN b.rank LIKE 'K%' THEN 4000
    WHEN b.rank LIKE 'M%' THEN 5000
    ELSE 9000
  END +
  -- 2. Numerical Weight (Extracts number without regex)
  -- This replaces all non-digits with empty space, then casts to INT
  CAST(
    NULLIF(
      REGEXP_REPLACE(b.rank, '[^0-9]', '', 'g'), 
      ''
    ) AS INTEGER
  ) * 10 +
  -- 3. Side Weight (East = 1, West = 2)
  CASE 
    WHEN b.rank LIKE '%East' THEN 1
    WHEN b.rank LIKE '%West' THEN 2
    ELSE 5
  END ASC;
    `;

    const result = await pool.query(query);

    const roster: Rikishi[] = result.rows.map((row: any) => ({
      name: row.shikona_en,
      kanji: row.shikona_jp_last,
      rank: row.rank,
      owner: row.owner,
      rikishi_id: row.rikishi_id,
    }));

    console.log(roster);

    const nameRes = await pool.query(`
      SELECT TO_CHAR(TO_DATE(value, 'YYYYMM'), 'FMMonth YYYY') as name 
      FROM site_settings 
      WHERE key = 'current_basho'`);

    const bashoName = nameRes.rows.length > 0
      ? nameRes.rows[0].name
      : "Unknown Basho";

    return ctx.render({ roster, username, bashoName });
  },
};

export default function RikishiPage({ data }: PageProps<Data>) {
  return (
    <div class="min-h-screen bg-slate-50 font-sans text-slate-900">
      <header class="bg-indigo-900 text-white py-12 px-8 shadow-lg">
        <h1 class="text-4xl font-black tracking-tighter uppercase mb-2 text-center">
          Rikishi 👺
        </h1>
        <p class="text-indigo-200 font-medium text-center">
          {data.bashoName} Official Banzuke
        </p>
      </header>

      <main class="max-w-6xl mx-auto -mt-8 p-6 pb-20">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.roster.length > 0
            ? (
              data.roster.map((r) => (
                <div
                  key={r.rikishi_id}
                  class="bg-white p-6 rounded-3xl shadow-lg border border-slate-100 hover:border-indigo-200 transition-all hover:shadow-md"
                >
                  <div class="flex justify-between items-start">
                    <span class="text-[10px] font-black bg-slate-100 text-slate-500 px-2 py-1 rounded">
                      {r.rank}
                    </span>
                    <span class="text-[25px] font-bold text-indigo-600 uppercase tracking-widest">
                      {r.kanji}
                    </span>
                  </div>
                  <h2 class="text-2xl font-bold text-slate-800 mt-2">
                    {r.name}
                  </h2>
                  <div class="mt-4 pt-4 border-t border-dashed border-slate-100 flex justify-between items-center">
                    <DraftButton
                      rikishiId={r.rikishi_id}
                      initialOwner={r.owner}
                      currentUser={data.username}
                    />
                  </div>
                </div>
              ))
            )
            : (
              <div class="col-span-full py-20 text-center bg-slate-100 rounded-3xl border-2 border-dashed border-slate-200">
                <p class="text-slate-400 font-bold">
                  No wrestlers found.
                </p>
              </div>
            )}
        </div>
      </main>
    </div>
  );
}
