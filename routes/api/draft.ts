import { Handlers } from "$fresh/server.ts";
import { Pool } from "npm:pg";

export const db = new Pool();

export const handler: Handlers<any> = {
  async POST(req, ctx) {
    const username = ctx.state.user.username;

    if (!username) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { rikishiId } = await req.json();

    // Update the DB with the ACTUAL logged-in user
    db.query(
      "UPDATE banzuke SET owner = $1 WHERE rikishi_id = $2 AND owner IS NULL",
      [username, rikishiId],
    );

    return new Response(JSON.stringify({ success: true }));
  },
};
