import { useState } from "preact/hooks";

export default function SetCurrent() {
  const [loading, setLoading] = useState(false);
  const [bashoId, setBashoId] = useState("202603");

  const handleSync = async () => {
    setLoading(true);
    const res = await fetch("/api/set-basho", {
      method: "POST",
      body: JSON.stringify({ bashoId }),
    });

    if (res.ok) alert(`State set to ${bashoId}!`);
    else alert("Failed to set basho.");
    setLoading(false);
  };

  return (
    <div class="p-6 bg-white rounded-3xl shadow-sm border border-slate-100">
      <h2 class="text-xl font-bold mb-4 text-indigo-900">
        Set Current Basho 🏆
      </h2>
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

        <button
          onClick={handleSync}
          disabled={loading}
          class="w-full bg-indigo-600 text-white font-bold py-3 rounded-2xl hover:bg-indigo-700 transition-colors disabled:bg-slate-300"
        >
          {loading ? "Setting..." : `Set Current Basho`}
        </button>
      </div>
    </div>
  );
}
