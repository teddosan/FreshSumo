import SpoilerShield from "../islands/SpoilerShield.tsx";
import type { PageProps } from "$fresh/server.ts";

export default function Layout({ Component, state, url }: PageProps) {
  // We check the URL to see which link should look "active"
  const pathname = url.pathname;
  const user = state.user as { username?: string } | null;
  const watchedDay = state.watchedDay as number | 0;

  return (
    <div class="flex min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* SHARED SIDEBAR */}
      <aside class="hidden md:flex flex-col w-72 bg-indigo-950 text-indigo-100 h-screen sticky top-0 p-6 border-r border-indigo-800 shrink-0">
        <h1 class="text-2xl font-black text-white mb-8 tracking-tighter uppercase">
          🎏 SumoFantasy
        </h1>

        <nav class="space-y-2 flex-grow">
          <p class="text-[10px] uppercase tracking-widest font-bold text-indigo-400 mb-2">
            Menu
          </p>

          <a
            href="/"
            class={`block p-2 rounded-lg font-bold transition ${
              pathname === "/"
                ? "bg-indigo-800 text-white"
                : "hover:bg-indigo-900"
            }`}
          >
            🏆 Standings
          </a>

          <a
            href="/stable"
            class={`block p-2 rounded-lg font-bold transition ${
              pathname === "/stable"
                ? "bg-indigo-800 text-white"
                : "hover:bg-indigo-900"
            }`}
          >
            🏠 My Stable
          </a>

          <a
            href="/rishiki"
            class={`block p-2 rounded-lg font-bold transition ${
              pathname === "/results"
                ? "bg-indigo-800 text-white"
                : "hover:bg-indigo-900"
            }`}
          >
            📊 All Rishiki
          </a>

          {state.isAdmin && (
            <a
              href="/admin"
              class={`block p-2 rounded-lg font-bold transition ${
                pathname === "/admin"
                  ? "bg-indigo-800 text-white"
                  : "hover:bg-indigo-900"
              }`}
            >
              🛠️ Admin Panel
            </a>
          )}
        </nav>
        <div class="mt-8">
          <SpoilerShield currentDay={watchedDay} />
        </div>

        {/* Action Center stays at the bottom of the sidebar globally */}
        <div class="mt-auto pt-6 border-t border-indigo-800">
          {user
            ? (
              <div class="space-y-3">
                <p class="text-xs font-bold text-indigo-400 truncate">
                  {user.username}
                </p>
                <form method="POST" action="/api/logout">
                  <button
                    type="submit"
                    class="w-full py-2 rounded-xl text-sm bg-indigo-800 hover:bg-red-600 transition"
                  >
                    Logout
                  </button>
                </form>
              </div>
            )
            : (
              <a
                href="/login"
                class="block w-full py-2 rounded-xl text-center bg-white text-indigo-950 font-bold"
              >
                Login
              </a>
            )}
        </div>
      </aside>

      {/* DYNAMIC CONTENT AREA */}
      <div class="flex-grow">
        <Component />
      </div>
    </div>
  );
}
