import { useState } from "preact/hooks";

interface Match {
  day: number;
  opponent_name: string;
  result: "W" | "L";
  kimarite: string;
}

export default function MatchHistory(
  { matches, shikona }: { matches: Match[]; shikona: string },
) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div class="border-t border-slate-100 py-2">
      <button
        onClick={() => setIsOpen(!isOpen)}
        class="flex items-center text-sm font-bold text-indigo-600 hover:text-indigo-800"
      >
        {isOpen ? "▼ Hide Matches" : "▶ Show Matches"}
      </button>

      {isOpen && (
        <div class="mt-3 space-y-2 pl-4">
          {matches.length === 0
            ? <p class="text-xs text-slate-400">No matches watched yet.</p>
            : (
              matches.map((m) => (
                <div class="flex justify-between text-sm bg-slate-50 p-2 rounded-lg">
                  <span>
                    <span class="font-mono text-slate-400 mr-2">
                      Day {m.day}
                    </span>
                    vs <span class="font-bold">{m.opponent}</span>
                  </span>
                  <span
                    class={m.isWin
                      ? "text-green-600 font-black"
                      : "text-red-600 font-black"}
                  >
                    {m.isWin ? "W" : "L"}
                    <span class="text-[10px] font-normal text-slate-400 ml-1">
                      ({m.kimarite})
                    </span>
                  </span>
                </div>
              ))
            )}
        </div>
      )}
    </div>
  );
}
