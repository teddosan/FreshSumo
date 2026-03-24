import { useState } from "preact/hooks";

export default function SyncButton() {
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");

  const handleSync = async () => {
    setStatus("loading");
    try {
      // This calls the API route we defined earlier
      const res = await fetch("/api/sync", { method: "POST" });

      if (!res.ok) throw new Error("Sync failed");

      setStatus("success");
      // Refresh the page after 1.5 seconds so the new scores appear
      setTimeout(() => {
        location.reload();
      }, 1500);
    } catch (err) {
      console.error(err);
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
    }
  };

  return (
    <div class="w-full">
      <button
        onClick={handleSync}
        disabled={status === "loading"}
        class={`w-full py-4 rounded-xl font-black text-lg shadow-lg transition-all active:scale-95 ${
          status === "loading"
            ? "bg-gray-400 cursor-not-allowed"
            : status === "success"
            ? "bg-green-500 text-white"
            : status === "error"
            ? "bg-red-500 text-white"
            : "bg-indigo-600 hover:bg-indigo-700 text-white"
        }`}
      >
        {status === "loading" && "⏳ Fetching Results..."}
        {status === "success" && "✅ March Results Updated!"}
        {status === "error" && "❌ Sync Error"}
        {status === "idle" && "🔄 Sync March Results"}
      </button>
    </div>
  );
}
