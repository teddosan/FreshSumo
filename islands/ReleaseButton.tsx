import { useState } from "preact/hooks";

export default function ReleaseButton({ name }: { name: string }) {
  const [confirming, setConfirming] = useState(false);

  const handleRelease = async () => {
    if (!confirming) {
      setConfirming(true);
      return;
    }

    const res = await fetch("/api/release", {
      method: "POST",
      body: JSON.stringify({ name }),
    });

    if (res.ok) {
      location.reload(); // Refresh to show the wrestler is gone
    }
  };

  return (
    <button
      onClick={handleRelease}
      onMouseLeave={() => setConfirming(false)}
      class={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
        confirming 
          ? "bg-red-600 text-white animate-pulse" 
          : "bg-slate-100 text-slate-400 hover:bg-red-100 hover:text-red-600"
      }`}
    >
      {confirming ? "Confirm Release?" : "Release"}
    </button>
  );
}