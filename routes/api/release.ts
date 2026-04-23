import { Handlers } from "$fresh/server.ts";
import { Pool } from "npm:pg";

export const handler: Handlers = {
  async POST(req) {
    const { name } = await req.json();
    const db = new Pool();

    try {
      db.query("DELETE FROM wrestlers WHERE name = $1", [name]);
      db.close();
      return new Response(JSON.stringify({ success: true }));
    } catch (err) {
      db.close();
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
      });
    }
  },
};
