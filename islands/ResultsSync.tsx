import { useState } from "preact/hooks";

export default function ResultsSync() {
  const [bashoId, setBashoId] = useState("202603");
  const [day, setDay] = useState("1");
  const [loading, setLoading] = useState(false);

  const handleSync = async () => {
    setLoading(true);
    const res = await fetch("/api/sync-results", {
      method: "POST",
      body: JSON.stringify({ bashoId, day: parseInt(day) }),
    });

    if (res.ok) alert(`Day ${day} results synced!`);
    else alert("Failed to sync results.");
    setLoading(false);
  };

  return (
    <div class="p-6 bg-white rounded-3xl shadow-sm border border-slate-100">
      <h2 class="text-xl font-bold mb-4 text-indigo-900">Sync Results 🏆</h2>
      <div class="space-y-4">
        <div>
          <label class="block text-xs font-black uppercase text-slate-400 mb-1">
            Basho ID
          </label>
          <input
            type="text"
            value={bashoId}
            onInput={(e) => setBashoId(e.currentTarget.value)}
            class="w-full p-2 border rounded-xl"
          />
        </div>
        <div>
          <label class="block text-xs font-black uppercase text-slate-400 mb-1">
            Day Number (1-15)
          </label>
          <input
            type="number"
            value={day}
            onInput={(e) => setDay(e.currentTarget.value)}
            class="w-full p-2 border rounded-xl"
          />
        </div>
        <button
          onClick={handleSync}
          disabled={loading}
          class="w-full bg-indigo-600 text-white font-bold py-3 rounded-2xl hover:bg-indigo-700 transition-colors disabled:bg-slate-300"
        >
          {loading ? "Fetching..." : `Fetch Day ${day} Results`}
        </button>
      </div>
    </div>
  );
}
