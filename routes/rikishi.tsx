import { Handlers, PageProps } from "$fresh/server.ts";
import { DB } from "https://deno.land/x/sqlite@v3.9.1/mod.ts";
import DraftButton from "../islands/DraftButton.tsx";
import { context } from "https://deno.land/x/esbuild@v0.20.2/mod.d.ts";

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
  GET(_req, ctx) {
    const db = new DB("sumo.db");
    const username = ctx.state.user?.username || null;
    const rows = db.query(`
  SELECT 
    w.shikonaEn, 
    -- 1. Replace wide spaces with standard spaces
    -- 2. Find the index of that space
    -- 3. Slice the string up to that index
    CASE 
      WHEN INSTR(REPLACE(w.shikonaJp, '　', ' '), ' ') > 0 
      THEN SUBSTR(
             w.shikonaJp, 
             1, 
             INSTR(REPLACE(w.shikonaJp, '　', ' '), ' ') - 1
           )
      ELSE w.shikonaJp 
    END AS shikonaJp_last,
    b.rank, 
    b.owner,
    b.rikishi_id
  FROM wrestlers w
  JOIN banzuke b ON w.rikishi_id = b.rikishi_id
  WHERE b.basho_id = 202603
  AND b.rank NOT LIKE 'J%' -- Exclude Juryo wrestlers
  ORDER BY 
    CASE 
      WHEN b.rank LIKE 'Y%' THEN 1
      WHEN b.rank LIKE 'O%' THEN 2
      WHEN b.rank LIKE 'S%' THEN 3
      WHEN b.rank LIKE 'K%' THEN 4
      WHEN b.rank LIKE 'M%' THEN 5
      ELSE 6
    END,
    CAST(SUBSTR(b.rank, 2) AS INTEGER) ASC,
    b.rank ASC
`);

    const roster: Rikishi[] = rows.map((
      [name, kanji, rank, owner, rikishi_id],
    ) => ({
      name: name as string,
      rank: rank as string,
      kanji: kanji as string,
      owner: owner as string,
      rikishi_id: rikishi_id as number,
    }));

    db.close();
    return ctx.render({ roster, username });
  },
};

export default function RikishiPage({ data }: PageProps<Data>) {
  return (
    <div class="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* HERO HEADER SECTION */}
      <header class="bg-indigo-900 text-white py-12 px-8 shadow-lg">
        <h1 class="text-4xl font-black tracking-tighter uppercase mb-2 text-center">
          Rikishi 👺
        </h1>
        <p class="text-indigo-200 font-medium text-center">
          March 2026 Official Banzuke
        </p>
      </header>

      {/* MAIN CONTENT AREA */}
      <main class="max-w-6xl mx-auto -mt-8 p-6 pb-20">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.roster.length > 0
            ? (
              data.roster.map((r) => (
                <div class="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:border-indigo-200 transition-all hover:shadow-md">
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
                    <span class="text-xs font-bold text-slate-400 uppercase">
                      <DraftButton
                        rikishiId={r.rikishi_id}
                        initialOwner={r.owner}
                        currentUser={data.username}
                      />
                    </span>
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
