import { Handlers, PageProps } from "$fresh/server.ts";
import { pool } from "../utils/db.ts";
import { useComputed } from "@preact/signals";
import ResultsSync from "../islands/ResultsSync.tsx";
import BanzukeSync from "../islands/BanzukeSync.tsx";
import AdminTools from "../islands/AdminTools.tsx";

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

  // routes/admin/index.tsx

  async POST(req, _ctx) {
    // 1. Detect Content-Type to handle both Islands (JSON) and Forms (FormData)
    const contentType = req.headers.get("content-type") || "";
    let action: string | null;
    let data: any;

    if (contentType.includes("application/json")) {
      data = await req.json();
      action = data.action;
    } else {
      const formData = await req.formData();
      data = Object.fromEntries(formData.entries());
      action = data.action;
    }

    // 2. Route the action
    switch (action) {
      case "sync_banzuke": {
        const basho_id = data.basho_id;
        const url = new URL(req.url);

        await fetch(`${url.origin}/api/sync-banzuke`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ basho_id }),
        });
        break;
      }

      case "database_reinit": {
        // 1. Array of individual commands
        const commands = [
          `DROP TABLE IF EXISTS results CASCADE;`,
          `DROP TABLE IF EXISTS banzuke CASCADE;`,
          `DROP TABLE IF EXISTS tournaments CASCADE;`,
          `DROP TABLE IF EXISTS wrestlers CASCADE;`,

          `CREATE TABLE tournaments (
      basho_id INTEGER PRIMARY KEY,
      start_date TEXT,
      end_date TEXT,
      location TEXT
    );`,

          `CREATE TABLE wrestlers (
      rikishi_id INTEGER PRIMARY KEY,
      shikona_en TEXT NOT NULL,
      shikona_jp TEXT NOT NULL
    );`,

          `CREATE TABLE banzuke (
      basho_id INTEGER NOT NULL,
      rikishi_id INTEGER NOT NULL,
      rank TEXT NOT NULL,
      owner TEXT,
      PRIMARY KEY (basho_id, rikishi_id),
      FOREIGN KEY (basho_id) REFERENCES tournaments(basho_id),
      FOREIGN KEY (rikishi_id) REFERENCES wrestlers(rikishi_id)
    );`,

          `CREATE TABLE results (
      id TEXT PRIMARY KEY,
      day INTEGER NOT NULL,
      basho_id INTEGER NOT NULL,
      west_id INTEGER NOT NULL,
      east_id INTEGER NOT NULL,
      winner_id INTEGER NOT NULL,
      kimarite TEXT,
      FOREIGN KEY (basho_id) REFERENCES tournaments(basho_id),
      FOREIGN KEY (west_id) REFERENCES wrestlers(rikishi_id),
      FOREIGN KEY (east_id) REFERENCES wrestlers(rikishi_id),
      FOREIGN KEY (winner_id) REFERENCES wrestlers(rikishi_id)
    );`,
        ];

        // 2. Execute them in a loop
        console.log("Starting database re-initialization...");
        for (const cmd of commands) {
          await pool.query(cmd);
        }
        console.log("Database successfully re-initialized.");
        break;
      }
        // ... [Other cases: reset_draft, delete_user, etc.] ...
    }

    // 3. Return the right response type
    if (contentType.includes("application/json")) {
      return new Response(
        JSON.stringify({ success: true, message: `${action} completed` }),
        {
          headers: { "Content-Type": "application/json" },
        },
      );
    } else {
      return new Response(null, {
        status: 303,
        headers: { "Location": "/admin" },
      });
    }
  },
};

export default function AdminPage() {
  return (
    <div class="min-h-screen bg-slate-50 p-8">
      <div class="max-w-6xl mx-auto">
        <header class="mb-10">
          <h1 class="text-4xl font-black tracking-tighter uppercase text-slate-900">
            Sumo Admin <span class="text-indigo-600">Control Panel</span>
          </h1>
          <p class="text-slate-500 font-medium">
            Manage Banzuke and Tournament Results
          </p>
        </header>

        {/* The Two-Column Grid */}
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Column: Results */}
          <section>
            <ResultsSync />
            <div class="mt-6">
              <AdminTools />
            </div>
          </section>

          {/* Right Column: Banzuke */}
          <section>
            <BanzukeSync />
          </section>
        </div>
      </div>
    </div>
  );
}
