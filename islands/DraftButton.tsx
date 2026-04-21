import { context } from "https://deno.land/x/esbuild@v0.20.2/mod.d.ts";
import { useState } from "preact/hooks";

interface DraftProps {
  rikishiId: number;
  initialOwner: string | null;
}

export default function DraftButton(
  { rikishiId, initialOwner, currentUser }: DraftProps,
) {
  const [owner, setOwner] = useState(initialOwner);
  const [loading, setLoading] = useState(false);

  const handleDraft = async () => {
    setLoading(true);
    // Fresh uses standard API routes for island-to-server communication
    const res = await fetch("/api/draft", {
      method: "POST",
      body: JSON.stringify({ rikishiId }),
    });

    if (res.ok) {
      console.log(`Successfully drafted wrestler ${rikishiId}`);
      setOwner(currentUser); // Update the owner to the current user
    } else {
      console.log("Resp: ", res);
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
