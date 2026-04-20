import { useState } from "preact/hooks";

interface DraftProps {
  wrestlerId: number;
  initialOwner: string | null;
}

export default function DraftButton({ wrestlerId, initialOwner }: DraftProps) {
  const [owner, setOwner] = useState(initialOwner);
  const [loading, setLoading] = useState(false);

  const handleDraft = async () => {
    setLoading(true);
    // Fresh uses standard API routes for island-to-server communication
    const res = await fetch("/api/draft", {
      method: "POST",
      body: JSON.stringify({ wrestlerId }),
    });

    if (res.ok) {
      // For a quick hack, we assume current user,
      // but ideally the API returns the new owner name
      setOwner("You");
    }
    setLoading(false);
  };

  return (
    <button
      onClick={handleDraft}
      disabled={owner !== null || loading}
      class={`px-4 py-1 rounded ${
        owner ? "bg-gray-200" : "bg-blue-500 text-white"
      }`}
    >
      {loading ? "..." : owner ? `Owned by ${owner}` : "Draft"}
    </button>
  );
}
