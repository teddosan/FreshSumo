import { Handlers, PageProps } from "$fresh/server.ts";
import { DB } from "https://deno.land/x/sqlite@v3.9.1/mod.ts";

export const handler: Handlers = {
  GET(_req, ctx) {
    // 1. Check the 'state' set by your middleware
    // We will set 'isAdmin' in the next step
    if (!ctx.state.isAdmin) {
      // Redirect unauthorized users to the home page
      return new Response("", {
        status: 303,
        headers: { "Location": "/" },
      });
    }
    return ctx.render();
  },

  async POST(_req, _ctx) {
    const db = new DB("sumo.db");
    try {
      const resp = await fetch(
        "https://www.sumo-api.com/api/basho/202601/banzuke/Makuuchi",
      );
      const apiData = await resp.json();

      // 1. Combine the two sides of the Banzuke
      const east = apiData.east || [];
      const west = apiData.west || [];
      const allRikishi = [...east, ...west];

      if (allRikishi.length === 0) {
        throw new Error("No rikishi found in the east or west arrays.");
      }

      db.transaction(() => {
        for (const item of allRikishi) {
          // Map the API fields to your DB columns
          const name = item.shikonaEn; // e.g., "Hoshoryu"
          const rank = item.rank; // e.g., "Yokozuna 1 East"
          // Note: The snippet doesn't show 'stable', so we use a placeholder
          // or check if 'heya' exists elsewhere in your full API response.
          const stable = item.heya || "Unknown";

          db.query(
            `
          INSERT INTO wrestlers (name, rank, stable, owner)
          VALUES (?, ?, ?, null)
          ON CONFLICT(name) DO UPDATE SET
            rank = excluded.rank
        `,
            [name, rank, stable],
          );
        }
      });

      db.close();
      return new Response("", {
        status: 303,
        headers: { "Location": "/admin" },
      });
    } catch (err) {
      console.error("Detailed Sync Failure:", err);
      db.close();
      return new Response(`Sync Failed: ${err.message}`, { status: 500 });
    }
  },
};

export default function AdminPage() {
  return (
    <div class="p-8">
      <h1 class="text-3xl font-black text-black mb-4">Master Control</h1>
      <p class="text-slate-600">
        Welcome, Ted. You have full access to the Sumo DB.
      </p>
      {/* Add your "Clear Database" or "Manual Sync" buttons here */}
      <form method="POST">
        <button class="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-xl font-bold shadow-md transition-all active:scale-95 flex items-center gap-2">
          <span>🔄</span> Sync Banzuke
        </button>
      </form>
    </div>
  );
}
