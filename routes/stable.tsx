import { Handlers, PageProps } from "$fresh/server.ts";
import { DB } from "https://deno.land/x/sqlite@v3.9.1/mod.ts";
import ReleaseButton from "../islands/ReleaseButton.tsx";

interface Wrestler {
  shikonaEn: string;
  shikonaJp: string;
  owner: string;
}

interface DraftData {
  myWrestlers: Wrestler[];
  watchedDay: number;
}

export const handler: Handlers<DraftData> = {
  GET(_req: Request, ctx) {
    const db = new DB("sumo.db");

    const rows = db.query(
      `
      SELECT 
        w.shikonaEn, 
        w.shikonaJp, 
        b.owner 
      FROM 
        wrestlers w
      JOIN banzuke b ON w.rikishi_id = b.rikishi_id
      WHERE b.owner = ?
`,
      [ctx.state.user?.username],
    );

    const myWrestlers = rows.map(([shikonaEn, shikonaJp, owner]: any) => ({
      shikonaEn,
      shikonaJp,
      owner,
    }));

    db.close();
    const watchedDay = ctx.state.watchedDay;
    return ctx.render({ myWrestlers, watchedDay });
  },
};

export default function StablePage({ data }: PageProps<DraftData>) {
  return (
    <div class="min-h-screen bg-slate-50 p-4 md:p-8">
      <div class="max-w-xl mx-auto">
        <header class="mb-8">
          <h1 class="text-3xl font-black text-slate-900 mt-2">
            Rikishi Stable
          </h1>
          <p class="text-slate-500">
            Record for May basho up to day {data.watchedDay}
          </p>
        </header>

        <div class="space-y-6">
          <section>
            <h3 class="font-bold text-slate-700 mb-3 px-1">
              Your Current Stable
            </h3>
            <div class="space-y-2">
              {data.myWrestlers.length > 0
                ? (
                  data.myWrestlers.map((w) => (
                    <div class="flex justify-between items-center p-4 bg-white rounded-xl shadow-sm border border-slate-100">
                      <div>
                        <span class="font-bold text-indigo-900 block">
                          {w.shikonaEn} ({w.shikonaJp})
                        </span>
                      </div>
                      <ReleaseButton name={w.name} />
                    </div>
                  ))
                )
                : (
                  <div class="text-center py-10 border-2 border-dashed border-slate-200 rounded-xl">
                    <p class="text-slate-400">No wrestlers drafted yet.</p>
                  </div>
                )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
