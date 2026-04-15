import { useSignal } from "@preact/signals";

export default function AdminTools() {
  const status = useSignal("");

  const runAction = async (action: string, confirmMsg: string) => {
    if (!confirm(confirmMsg)) return;

    status.value = `Running ${action}...`;

    try {
      const resp = await fetch(`/admin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      if (resp.ok) {
        status.value = `Success: ${action} complete`;
      } else {
        const errData = await resp.json().catch(() => ({}));
        status.value = `Error: ${errData.error || "Check server logs"}`;
      }
    } catch (_err) {
      status.value = "Network error.";
    }
  };

  // The "return" block is what was missing!
  const btnClass =
    "block p-4 border rounded hover:bg-gray-50 text-left transition-colors font-medium";

  return (
    <div class="mt-8 border-t pt-8">
      <h2 class="text-xl font-semibold mb-4 text-gray-600">Other Tools</h2>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => runAction("test_hook", "Run test hook?")}
          class={btnClass}
        >
          Test Hook
        </button>

        <button
          onClick={() =>
            runAction(
              "reset_draft",
              "Reset all draft ownership for this tournament?",
            )}
          class={btnClass}
        >
          Reset Draft Orders
        </button>

        <button
          onClick={() =>
            runAction(
              "database_reinit",
              "WARNING: This will wipe and recreate all sumo tables. Continue?",
            )}
          class={`${btnClass} text-red-600 border-red-100 hover:bg-red-50`}
        >
          Reinitialize Database
        </button>
      </div>

      {status.value && (
        <div
          class={`mt-4 p-3 rounded text-sm font-mono ${
            status.value.includes("Success")
              ? "bg-green-100 text-green-800"
              : "bg-gray-100 text-gray-800"
          }`}
        >
          {status.value}
        </div>
      )}
    </div>
  );
}
