import { Handlers, PageProps } from "$fresh/server.ts";
import { DB } from "https://deno.land/x/sqlite@v3.9.1/mod.ts";

async function handleSync(_req: Request) {
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
    db.close();
    return new Response(`Sync Failed: ${err.message}`, { status: 500 });
  }
}

async function handleTestHook(_req: Request) {
  // This is just a placeholder to show how you can add more admin actions
  console.log("Test Hook Triggered!");
  return new Response("", {
    status: 303,
    headers: { "Location": "/admin" },
  });
}

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

  async POST(req, _ctx) {
    // 1. Extract the form data from the request body
    const formData = await req.formData();
    const action = formData.get("action");

    // 2. Route the action
    switch (action) {
      case "sync_banzuke":
        return await handleSync(req); // Call a separate function to keep code tidy

      case "reset_draft":
        return await handleReset(req);

      case "delete_user":
        return await handleDeleteUser(req);

      default:
        // If someone sends a weird action, just send them back
        return new Response("", {
          status: 303,
          headers: { "Location": "/admin" },
        });
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
        <button
          name="action"
          value="sync_banzuke"
          class="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-xl font-bold shadow-md transition-all active:scale-95 flex items-center gap-2"
        >
          <span>🔄</span> Sync Banzuke
        </button>

        {/* Now you can safely add another button later! */}
        <button
          name="action"
          value="test_hook"
          class="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-xl font-bold shadow-md transition-all active:scale-95 flex items-center gap-2"
        >
          <span>🧪</span> Test Hook
        </button>
      </form>
    </div>
  );
}
