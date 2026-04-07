import { Handlers, PageProps } from "$fresh/server.ts";

export const handler: Handlers = {
  GET(req, ctx) {
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
};

export default function AdminPage() {
  return (
    <div class="p-8">
      <h1 class="text-3xl font-black text-white mb-4">Master Control</h1>
      <p class="text-slate-400">
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
