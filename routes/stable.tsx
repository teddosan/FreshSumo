import { Handlers, PageProps } from "$fresh/server.ts";
import { pool } from "../utils/db.ts";
import ReleaseButton from "../islands/ReleaseButton.tsx";
import MatchHistory from "../islands/MatchHistory.tsx";

interface Match {
  day: number;
  opponent: string;
  isWin: boolean;
  kimarite: string;
}

interface Wrestler {
  rikishi_id: number;
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
  async GET(_req: Request, ctx) {
    const username = ctx.state.user?.username;
    const watchedDay = ctx.state.watchedDay || 0;
    const currentBasho = 202603;

    if (!username) {
      return ctx.render({ myWrestlers: [], watchedDay });
    }

    // 1. Fetch all wrestlers in the stable
    const wrestlerRes = await pool.query(
      `SELECT w.shikona_en, w.shikona_jp, b.owner, w.rikishi_id
       FROM wrestlers w
       JOIN banzuke b ON w.rikishi_id = b.rikishi_id
       WHERE b.owner = $1 AND b.basho_id = $2`,
      [username, currentBasho],
    );

    const wrestlerRows = wrestlerRes.rows;
    const rikishiIds = wrestlerRows.map((r) => r.rikishi_id);

    // 2. Fetch ALL matches for ALL stable members at once
    // This avoids the N+1 query problem
    let allMatches: any[] = [];
    if (rikishiIds.length > 0) {
      const matchRes = await pool.query(
        `SELECT 
          r.day,
          r.east_id,
          r.west_id,
          r.winner_id,
          r.kimarite,
          e.shikona_en as east_name,
          w.shikona_en as west_name
        FROM results r
        JOIN wrestlers e ON r.east_id = e.rikishi_id
        JOIN wrestlers w ON r.west_id = w.rikishi_id
        WHERE r.basho_id = $1 
          AND r.day <= $2
          AND (r.east_id = ANY($3) OR r.west_id = ANY($3))
        ORDER BY r.day ASC`,
        [currentBasho, watchedDay, rikishiIds],
      );
      allMatches = matchRes.rows;
    }

    // 3. Assemble the data in memory
    const myWrestlers: Wrestler[] = wrestlerRows.map((wRow) => {
      const rid = wRow.rikishi_id;

      // Filter the big matches list for this specific rikishi
      const matches: Match[] = allMatches
        .filter((m) => m.east_id === rid || m.west_id === rid)
        .map((m) => ({
          day: m.day,
          opponent: m.east_id === rid ? m.west_name : m.east_name,
          isWin: m.winner_id === rid,
          kimarite: m.kimarite,
        }));

      return {
        rikishi_id: rid,
        shikonaEn: wRow.shikona_en,
        shikonaJp: wRow.shikona_jp,
        owner: wRow.owner,
        matches,
      };
    });

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
            Record for March basho up to day {data.watchedDay}
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
                    <div
                      key={w.rikishi_id}
                      class="p-4 bg-white rounded-xl shadow-sm border border-slate-100"
                    >
                      <div class="flex justify-between items-center mb-2">
                        <div>
                          <span class="font-bold text-indigo-900 block">
                            {w.shikonaEn} ({w.shikonaJp})
                          </span>
                        </div>
                        <ReleaseButton name={w.shikonaEn} />
                      </div>
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
