import { Handlers, PageProps } from "$fresh/server.ts";
import { DB } from "https://deno.land/x/sqlite@v3.9.1/mod.ts";
import { useComputed } from "@preact/signals";
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
        const db = new DB("sumo.db");
        // Use the refactored schema we discussed to keep your results and banzuke separated!
        db.execute(`
        DROP TABLE IF EXISTS results;
        DROP TABLE IF EXISTS banzuke;
        DROP TABLE IF EXISTS tournaments;
        DROP TABLE IF EXISTS wrestlers;
        CREATE TABLE tournaments (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          basho_id INTEGER NOT NULL,
          start_date TEXT,
          end_date TEXT
        );
        CREATE TABLE wrestlers (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          shikonaEn TEXT NOT NULL,
          shikonaJp TEXT NOT NULL
        );
        CREATE TABLE banzuke (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          basho_id INTEGER NOT NULL,
          wrestler_id INTEGER NOT NULL,
          rank TEXT NOT NULL,
          owner TEXT
        );
        CREATE TABLE results (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          basho_id INTEGER NOT NULL,
          wrestler_id INTEGER NOT NULL,
          wins INTEGER NOT NULL,
          losses INTEGER NOT NULL
        );  
        `);
        db.close();
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
    <div class="p-4 max-w-2xl mx-auto">
      <h1 class="text-3xl font-bold mb-6">Sumo Admin</h1>

      <section class="mt-8">
        <BanzukeSync />
      </section>

      <section class="mt-8">
        <AdminTools />
      </section>
    </div>
  );
}
