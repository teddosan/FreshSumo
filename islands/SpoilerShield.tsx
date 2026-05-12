import { useEffect } from "preact/hooks";
import { getCookies } from "$std/http/cookie.ts";

interface Props {
  currentDay?: number;
}

export default function SpoilerShield({ currentDay }: Props) {
  console.log(currentDay);
  console.log(typeof currentDay);
  useEffect(() => {
    // This will ONLY run in the browser after the page loads
    console.log("Island hydrated! Cookie is:", document.cookie);
  }, []);

  const updateDay = (day: number) => {
    // 1. Set the cookie
    document.cookie =
      `sumo_watched_day=${day}; path=/; max-age=31536000; SameSite=Lax`;
    // 2. Refresh by navigating to the current path
    // This is more reliable than reload() in some browsers
    globalThis.location.href = globalThis.location.pathname;
  };

  return (
    <div class="bg-indigo-900/40 p-4 rounded-2xl border border-indigo-800 shadow-inner">
      <div class="flex justify-between items-start mb-4">
        <h3 class="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 flex items-center gap-2 mt-2">
          <span>🚫</span> Spoiler Shield
        </h3>

        {/* The 0 Button positioned to the right */}
        <button
          type="button"
          onClick={() => updateDay(0)}
          class={`w-[calc(20%-4px)] aspect-square flex items-center justify-center rounded-lg text-[11px] font-bold transition-all active:scale-90 ${
            currentDay === 0
              ? "bg-amber-400 text-indigo-950 shadow-[0_0_15px_rgba(251,191,36,0.3)]"
              : "bg-indigo-950/50 text-indigo-300 hover:bg-indigo-800 border border-indigo-700/50"
          }`}
        >
          0
        </button>
      </div>

      <div class="grid grid-cols-5 gap-1">
        {Array.from({ length: 15 }, (_, i) => i + 1).map((day) => (
          <button
            key={day}
            type="button"
            onClick={() => updateDay(day)}
            class={`aspect-square flex items-center justify-center rounded-lg text-[11px] font-bold transition-all active:scale-90 ${
              currentDay === day
                ? "bg-amber-400 text-indigo-950 shadow-[0_0_15px_rgba(251,191,36,0.3)]"
                : "bg-indigo-950/50 text-indigo-300 hover:bg-indigo-800 border border-indigo-700/50"
            }`}
          >
            {day}
          </button>
        ))}
      </div>

      <p class="mt-4 text-[9px] text-center text-indigo-500 font-medium italic">
        Viewing results through Day {currentDay}
      </p>
    </div>
  );
}
