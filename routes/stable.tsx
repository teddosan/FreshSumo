import { Handlers, PageProps } from "$fresh/server.ts";
import { DB } from "https://deno.land/x/sqlite@v3.9.1/mod.ts";
import ReleaseButton from "../islands/ReleaseButton.tsx";

interface Wrestler {
  name: string;
  owner: string;
}

interface DraftData {
  myWrestlers: Wrestler[];
}

export const handler: Handlers<DraftData> = {
  GET(_req: Request, ctx) {
    const db = new DB("sumo.db");

    // Fetch all wrestlers currently in the stable
    // You can add "WHERE owner = 'Dad'" later to personalize it
    const rows = db.query(
      "SELECT name, owner FROM wrestlers WHERE owner = ?",
      [ctx.state.user?.username],
    );

    const myWrestlers = rows.map(([name, owner]: any) => ({
      name,
      owner,
    }));

    db.close();
    return ctx.render({ myWrestlers });
  },
};

export default function StablePage({ data }: PageProps<DraftData>) {
  return (
    <div class="min-h-screen bg-slate-50 p-4 md:p-8">
      <div class="max-w-xl mx-auto">
        <header class="mb-8">
          <a href="/" class="text-indigo-600 font-bold text-sm">
            ← Back to Dashboard
          </a>
          <h1 class="text-3xl font-black text-slate-900 mt-2">Draft Room</h1>
          <p class="text-slate-500">Manage your stable for the May Basho</p>
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
                          {w.name}
                        </span>
                        <span class="text-[10px] uppercase font-bold text-slate-400">
                          Owner: {w.owner}
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

          {/* This is where you'll eventually add the "Search & Draft" island */}
          <div class="bg-indigo-50 p-6 rounded-2xl border border-indigo-100">
            <h4 class="font-bold text-indigo-900 mb-1">Add New Rikishi</h4>
            <p class="text-sm text-indigo-700 mb-4">
              Search the banzuke to add to your team.
            </p>
            <button
              disabled
              class="w-full py-3 bg-indigo-200 text-indigo-400 font-bold rounded-lg cursor-not-allowed"
            >
              Search Coming Soon...
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
