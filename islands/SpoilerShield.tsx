import { useSignal } from "@preact/signals";
import { useEffect } from "preact/hooks";

export default function SpoilerShield() {
  // Default to Day 0 (show nothing) or Day 15 (show all)
  const watchedUntil = useSignal(0);

  useEffect(() => {
    const saved = localStorage.getItem("sumo_watched_day");
    if (saved) watchedUntil.value = parseInt(saved);
  }, []);

  const updateDay = (day: number) => {
    watchedUntil.value = day;
    localStorage.setItem("sumo_watched_day", day.toString());
    // Optional: Reload to filter server-side results or
    // use a global Signal to hide elements instantly.
    location.reload();
  };

  return (
    <div class="bg-indigo-900/50 p-4 rounded-xl border border-indigo-700">
      <h3 class="text-xs font-bold uppercase tracking-widest text-indigo-300 mb-3">
        🚫 Spoiler Shield
      </h3>
      <p class="text-xs text-indigo-200 mb-3">
        Hide results past:{" "}
        <span class="font-bold text-white">Day {watchedUntil.value}</span>
      </p>
      <div class="grid grid-cols-5 gap-1">
        {Array.from({ length: 15 }, (_, i) => i + 1).map((day) => (
          <button
            onClick={() => updateDay(day)}
            class={`text-[10px] py-1 rounded font-bold transition ${
              watchedUntil.value === day
                ? "bg-amber-400 text-indigo-900"
                : "bg-indigo-800 text-indigo-300 hover:bg-indigo-700"
            }`}
          >
            {day}
          </button>
        ))}
      </div>
    </div>
  );
}
