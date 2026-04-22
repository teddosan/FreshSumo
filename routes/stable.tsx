import { Handlers, PageProps } from "$fresh/server.ts";
import { DB } from "https://deno.land/x/sqlite@v3.9.1/mod.ts";
import ReleaseButton from "../islands/ReleaseButton.tsx";
import MatchHistory from "../islands/MatchHistory.tsx";

interface Match {
  day: number;
  opponent: string;
  isWin: boolean;
  kimarite: string;
}

interface Wrestler {
  rikishi_id: number; // Needed to find matches
  shikonaEn: string;
  shikonaJp: string;
  owner: string;
  matches: Match[];
}

interface DraftData {
  myWrestlers: Wrestler[];
  watchedDay: number;
}

export const handler: Handlers<DraftData> = {
  GET(_req: Request, ctx) {
    const db = new DB("sumo.db");
    const username = ctx.state.user?.username;
    const watchedDay = ctx.state.watchedDay || 0;
    const currentBasho = 202603; // Or dynamic

    const wrestlerRows = db.query(
      `
      SELECT w.shikonaEn, w.shikonaJp, b.owner, w.rikishi_id
      FROM wrestlers w
      JOIN banzuke b ON w.rikishi_id = b.rikishi_id
      WHERE b.owner = ? AND b.basho_id = ?
    `,
      [username, currentBasho],
    );

    const myWrestlers = wrestlerRows.map(
      ([shikonaEn, shikonaJp, owner, rid]: any) => {
        // Fetch matches for this specific rikishi
        const matchRows = db.query(
          `
        SELECT 
          r.day,
          opp.shikonaEn as opponent,
          (r.winner_id = ?) as isWin,
          r.kimarite
        FROM results r
        JOIN wrestlers opp ON (
          (r.east_id = opp.rikishi_id AND r.west_id = ?) OR 
          (r.west_id = opp.rikishi_id AND r.east_id = ?)
        )
        WHERE (r.east_id = ? OR r.west_id = ?)
          AND r.basho_id = ?
          AND r.day <= ?
        ORDER BY r.day ASC
      `,
          [rid, rid, rid, rid, rid, currentBasho, watchedDay],
        );

        const matches = matchRows.map((
          [day, opponent, isWin, kimarite]: any,
        ) => ({
          day,
          opponent,
          isWin: Boolean(isWin),
          kimarite,
        }));

        return { shikonaEn, shikonaJp, owner, rikishi_id: rid, matches };
      },
    );

    db.close();
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
                    <div class="p-4 bg-white rounded-xl shadow-sm border border-slate-100">
                      <div class="flex justify-between items-center">
                        <div>
                          <span class="font-bold text-indigo-900 block">
                            {w.shikonaEn} ({w.shikonaJp})
                          </span>
                        </div>
                        <ReleaseButton name={w.shikonaEn} />
                      </div>

                      {/* NEW DROP DOWN SECTION */}
                      <MatchHistory matches={w.matches} />
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
