import { Handlers, PageProps } from "$fresh/server.ts";
import DraftTool from "../islands/DraftTool.tsx";

export const handler: Handlers = {
  async GET(_req, ctx) {
    // We'll eventually pull this from your SUMO_API_URL or DB
    const rikishi = [
      { name: "Hoshoryu", rank: "Ozeki" },
      { name: "Kotozakura", rank: "Ozeki" },
      { name: "Onosato", rank: "Sekiwake" },
      { name: "Takerufuji", rank: "Maegashira 17" },
    ];
    return ctx.render(rikishi);
  },
};

export default function DraftPage({ data }: PageProps) {
  return (
    <div class="max-w-4xl mx-auto py-8">
      <h1 class="text-3xl font-extrabold text-center mb-8">
        🎏 May 2026 Draft Room
      </h1>
      <DraftTool initialRikishi={data} />
    </div>
  );
}