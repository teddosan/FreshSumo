import { Handlers } from "$fresh/server.ts";
import { pool } from "../../utils/db.ts";

export const handler: Handlers<any> = {
  async POST(req, ctx) {
    const username = ctx.state.user.username;

    if (!username) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { rikishiId } = await req.json();

    // Update the DB with the ACTUAL logged-in user
    await pool.query(
      `
      UPDATE banzuke SET owner = $1
      WHERE rikishi_id = $2 
      AND owner IS NULL 
      AND basho_id = (SELECT value::INTEGER FROM site_settings WHERE key = 'current_basho')`,
      [username, rikishiId],
    );

    return new Response(JSON.stringify({ success: true }));
  },
};
