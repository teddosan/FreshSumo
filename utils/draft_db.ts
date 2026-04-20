import { DB } from "https://deno.land/x/sqlite@v3.9.1/mod.ts";

export const db = new DB("sumo.db");

export function draftRikishi(wrestlerId: number, username: string) {
  // Update banzuke for the current March 2026 Basho
  db.query(
    "UPDATE banzuke SET owner = ? WHERE wrestler_id = ? AND basho_id = '202603' AND owner IS NULL",
    [username, wrestlerId],
  );
}
