import { draftRikishi } from "../../utils/draft_db.ts";

export const handler: Handlers = {
  async POST(req) {
    const { wrestlerId } = await req.json();
    // Logic to get the logged-in user from cookies/session
    const username = "User123";

    // Call your DB update logic
    draftRikishi(wrestlerId, username);

    return new Response(JSON.stringify({ success: true }));
  },
};
