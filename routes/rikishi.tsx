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
}

export const handler: Handlers<Data> = {
  async GET(_req, ctx) {
    const username = ctx.state.user?.username || null;

    // Postgres SQL Refactor:
    // 1. REPLACE(shikona_jp, '　', ' ') works same in PG
    // 2. STRPOS(string, ' ') replaces INSTR
    // 3. SUBSTRING(string FROM 1 FOR length) replaces SUBSTR
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
      WHERE b.basho_id = 202603
        AND b.rank NOT LIKE 'J%'
      ORDER BY 
      CASE 
        WHEN b.rank LIKE 'Y%' THEN 1
        WHEN b.rank LIKE 'O%' THEN 2
        WHEN b.rank LIKE 'S%' THEN 3
        WHEN b.rank LIKE 'K%' THEN 4
        WHEN b.rank LIKE 'M%' THEN 5
        ELSE 6
      END,
      -- Extract only the digits (\d+) from the rank string to sort by number
      NULLIF(substring(b.rank from '\d+'), '')::INTEGER ASC,
      -- Finally sort by the full string to handle East vs West
      b.rank ASC;
    `;

    const result = await pool.query(query);

    const roster: Rikishi[] = result.rows.map((row: any) => ({
      name: row.shikona_en,
      kanji: row.shikona_jp_last,
      rank: row.rank,
      owner: row.owner,
      rikishi_id: row.rikishi_id,
    }));

    return ctx.render({ roster, username });
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
          March 2026 Official Banzuke
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
