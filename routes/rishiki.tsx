import { Handlers, PageProps } from "$fresh/server.ts";
import { DB } from "https://deno.land/x/sqlite@v3.9.1/mod.ts";

interface Rikishi {
  name: string;
  rank: string;
}

export default function DraftTool(
  { initialRikishi }: { initialRikishi: Rikishi[] },
) {
  const [available, setAvailable] = useState(initialRikishi);

  const handleDraft = (name: string) => {
    // In a real app, we'd send a POST request to our Deno backend here
    console.log(`Drafting ${name} for Dad...`);

    // Remove from the available list locally to show immediate feedback
    setAvailable(available.filter((r) => r.name !== name));
    alert(`${name} has been added to your stable!`);
  };

  return (
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
      {available.map((r) => (
        <div class="border rounded-lg p-4 shadow-sm bg-white hover:bg-gray-50 transition">
          <h3 class="text-xl font-bold">{r.name}</h3>
          <p class="text-gray-600 mb-4">{r.rank}</p>
          <button
            onClick={() => handleDraft(r.name)}
            class="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 w-full"
          >
            Draft This Rikishi
          </button>
        </div>
      ))}
    </div>
  );
}
