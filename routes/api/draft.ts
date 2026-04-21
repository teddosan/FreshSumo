import { Handlers } from "$fresh/server.ts";
import { DB } from "https://deno.land/x/sqlite@v3.9.1/mod.ts";

export const db = new DB("sumo.db");

export const handler: Handlers<any> = {
  async POST(req, ctx) {
    const username = ctx.state.user.username;

    if (!username) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { wrestlerId } = await req.json();

    // Update the DB with the ACTUAL logged-in user
    db.query(
      "UPDATE banzuke SET owner = ? WHERE wrestler_id = ? AND owner IS NULL",
      [username, wrestlerId],
    );

    return new Response(JSON.stringify({ success: true }));
  },
};
