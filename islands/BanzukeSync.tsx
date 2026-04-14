// islands/BanzukeSync.tsx
import { useSignal } from "@preact/signals";

export default function BanzukeSync() {
  const bashoId = useSignal("");
  const status = useSignal<
    { type: "success" | "error" | "loading" | null; msg: string }
  >({
    type: null,
    msg: "",
  });

  const handleSync = async (e: Event) => {
    e.preventDefault();
    status.value = { type: "loading", msg: "Fetching from Sumo API..." };

    try {
      const response = await fetch("/api/sync-banzuke", {
        method: "POST",
        body: JSON.stringify({ basho_id: bashoId.value }),
        headers: { "Content-Type": "application/json" },
      });

      const result = await response.json();

      if (response.ok) {
        status.value = {
          type: "success",
          msg: `Successfully synced ${result.count} rikishi!`,
        };
      } else {
        status.value = { type: "error", msg: result.error || "Sync failed." };
      }
    } catch (err) {
      status.value = {
        type: "error",
        msg: "Network error. Is the server running?",
      };
    }
  };

  return (
    <div class="border p-4 rounded-lg bg-white shadow-sm">
      <h2 class="text-xl font-semibold mb-4">Sync Banzuke</h2>

      <form onSubmit={handleSync} class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700">
            Tournament ID (YYYYMM)
          </label>
          <input
            type="text"
            value={bashoId.value}
            onInput={(e) => (bashoId.value = e.currentTarget.value)}
            placeholder="202605"
            class="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        <button
          type="submit"
          disabled={status.value.type === "loading"}
          class={`w-full py-2 px-4 rounded font-bold text-white transition-colors ${
            status.value.type === "loading"
              ? "bg-gray-400"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {status.value.type === "loading"
            ? "Syncing..."
            : "Fetch and Populate"}
        </button>
      </form>

      {/* Response Message Display */}
      {status.value.type && (
        <div
          class={`mt-4 p-3 rounded text-sm ${
            status.value.type === "success"
              ? "bg-green-100 text-green-800"
              : status.value.type === "error"
              ? "bg-red-100 text-red-800"
              : "bg-blue-50 text-blue-800"
          }`}
        >
          {status.value.msg}
        </div>
      )}
    </div>
  );
}
