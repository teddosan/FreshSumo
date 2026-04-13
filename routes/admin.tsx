import { Handlers, PageProps } from "$fresh/server.ts";
import { DB } from "https://deno.land/x/sqlite@v3.9.1/mod.ts";
import { useComputed } from "@preact/signals";

async function handleSync(_req: Request) {
  const db = new DB("sumo.db");
  const formData = await _req.formData();
  const bashoId = formData.get("basho_id")?.toString();

  if (!bashoId) return new Response("Missing Tournament ID", { status: 400 });

  try {
    // 1. Fetch from the Sumo API (using your existing fetch logic)
    const response = await fetch(`https://sumo-api.com/api/banzuke/${bashoId}`);
    const data = await response.json();
    if (!data || !data.rikishi) {
      return new Response("Invalid API Response", { status: 500 });
    }
    // 2. Ensure Tournament exists in DB
    db.query(
      "INSERT OR IGNORE INTO tournaments (basho_id, name) VALUES (?, ?)",
      [
        bashoId,
        `${bashoId} Tournament`,
      ],
    );

    const tIdResult = db.query(
      "SELECT id FROM tournaments WHERE basho_id = ?",
      [bashoId],
    );
    const tournamentInternalId = tIdResult[0][0];

    // 3. Populate Wrestlers and Banzuke
    for (const entry of data.rikishi) {
      // Update/Insert Wrestler
      db.query(
        "INSERT OR IGNORE INTO wrestlers (shikona, current_heya) VALUES (?, ?)",
        [entry.shikona, entry.heya],
      );

      const wIdResult = db.query("SELECT id FROM wrestlers WHERE shikona = ?", [
        entry.shikona,
      ]);
      const wrestlerId = wIdResult[0][0];

      // Create the Banzuke link
      db.query(
        `INSERT OR REPLACE INTO banzuke (tournament_id, wrestler_id, rank, side) 
          VALUES (?, ?, ?, ?)`,
        [tournamentInternalId, wrestlerId, entry.rank, entry.side],
      );
    }

    // Redirect back to admin with success
    return new Response(null, {
      status: 303,
      headers: { Location: "/admin?success=true" },
    });
  } catch (err) {
    console.error(err);
    return new Response("Sync Failed", { status: 500 });
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
      case "sync_banzuke": {
        console.log("Received Sync Banzuke Request");
        const basho_id = formData.get("basho_id");
        const url = new URL(req.url);

        // Use the server to call the API
        await fetch(`${url.origin}/api/sync-banzuke`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ basho_id }) // Pass the ID to the API
        });

        // Redirect back to admin so the user sees the dashboard again
        return new Response(null, {
          status: 303,
          headers: { "Location": "/admin" },
        });
      }

      case "test_hook":
        return await handleTestHook(req);

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
    <div class="p-4">
      <h1 class="text-2xl font-bold">Sumo Admin</h1>

      <section class="mt-8 border p-4 rounded">
        <h2 class="text-xl font-semibold">Sync Banzuke</h2>
        <form method="POST"> {/* Submits to the same page */}
        <input type="hidden" name="action" value="sync_banzuke" />
        <div class="mt-4">
          <label class="block text-sm">Tournament ID (YYYYMM)</label>
          <input type="text" name="basho_id" required class="border p-2 rounded w-full" />
        </div>
        <button type="submit" class="mt-4 bg-blue-600 text-white px-4 py-2 rounded">
          Fetch and Populate
        </button>
      </form>
      </section>
    </div>
  );
}
