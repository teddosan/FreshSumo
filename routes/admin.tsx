import { Handlers, PageProps } from "$fresh/server.ts";
import { pool } from "../utils/db.ts";
import { useComputed } from "@preact/signals";
import ResultsSync from "../islands/ResultsSync.tsx";
import BanzukeSync from "../islands/BanzukeSync.tsx";
import AdminTools from "../islands/AdminTools.tsx";
import SetCurrent from "../islands/SetCurrent.tsx";

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

  async POST(req: Request, _ctx: any): Promise<Response> { // 1. Explicitly define Return Type
    const contentType = req.headers.get("content-type") || "";
    let action: string | null = null;
    let data: any;

    try {
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
          /*
          await fetch(`${url.origin}/api/sync-banzuke`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ basho_id }),
          });
          */
          break;
        }

        case "set_basho": {
          const basho_id = data.basho_id;
          const url = new URL(req.url);
          /*
          await fetch(`${url.origin}/api/set-basho`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ basho_id }),
          });
          */
          break;
        }

        case "test_hook": {
          const url = new URL(req.url);
          /*
          await fetch(`${url.origin}/api/test-hook`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
          });
          */
          break;
        }

        default:
          // Handle unknown actions to prevent logic gaps
          console.warn(`Unknown action received: ${action}`);
      }

      // 3. Guaranteed Return
      if (contentType.includes("application/json")) {
        return new Response(
          JSON.stringify({ success: true, message: `${action} completed` }),
          { headers: { "Content-Type": "application/json" } },
        );
      }

      return new Response(null, {
        status: 303,
        headers: { "Location": "/admin" },
      });
    } catch (err) {
      // 4. Error Handling (Crucial for TS and Runtime)
      return new Response(
        JSON.stringify({ error: "Server Error", details: err.message }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
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
          <section>
            <SetCurrent />
          </section>
        </div>
      </div>
    </div>
  );
}
