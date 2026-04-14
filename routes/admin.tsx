import { Handlers, PageProps } from "$fresh/server.ts";
import { DB } from "https://deno.land/x/sqlite@v3.9.1/mod.ts";
import { useComputed } from "@preact/signals";
import BanzukeSync from "../islands/BanzukeSync.tsx";

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
          body: JSON.stringify({ basho_id }), // Pass the ID to the API
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
    <div class="p-4 max-w-2xl mx-auto">
      <h1 class="text-3xl font-bold mb-6">Sumo Admin</h1>

      {/* The Island handles the form, fetch, and error/success states */}
      <section class="mt-8">
        <BanzukeSync />
      </section>

      {/* You can add other admin sections below as needed */}
      <section class="mt-8 border-t pt-8">
        <h2 class="text-xl font-semibold mb-4 text-gray-600">Other Tools</h2>
        <div class="grid grid-cols-2 gap-4">
          <a
            href="/admin/users"
            class="block p-4 border rounded hover:bg-gray-50"
          >
            Manage League Users
          </a>
          <a
            href="/admin/draft-reset"
            class="block p-4 border rounded hover:bg-gray-50"
          >
            Reset Draft Orders
          </a>
        </div>
      </section>
    </div>
  );
}
