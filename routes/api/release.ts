import { Handlers } from "$fresh/server.ts";
import { DB } from "https://deno.land/x/sqlite@v3.9.1/mod.ts";

export const handler: Handlers = {
  async POST(req) {
    const { name } = await req.json();
    const db = new DB("sumo.db");

    try {
      db.query("DELETE FROM wrestlers WHERE name = ?", [name]);
      db.close();
      return new Response(JSON.stringify({ success: true }));
    } catch (err) {
      db.close();
      return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
  },
};