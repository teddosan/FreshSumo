import { DB } from "https://deno.land/x/sqlite@v3.9.1/mod.ts";
import { Handlers } from "$fresh/server.ts";

async function handleSync(_req: Request) {
  const db = new DB("sumo.db");
  const formData = _req.formData();
  const bashoId = formData.get("basho_id")?.toString();

  if (!bashoId) return new Response("Missing Tournament ID", { status: 400 });

  try {
    // 1. Fetch from the Sumo API (using your existing fetch logic)
    const response = await fetch(`https://sumo-api.com/api/banzuke/${bashoId}`);
    const data = await response.json();
    if (!data || !data.rikishi) {
      return new Response("Invalid API Response", { status: 500 });
    }
    // 2. Ensure Tournament exists in DB
    db.query(
      "INSERT OR IGNORE INTO tournaments (basho_id, name) VALUES (?, ?)",
      [
        bashoId,
        `${bashoId} Tournament`,
      ],
    );

    const tIdResult = db.query(
      "SELECT id FROM tournaments WHERE basho_id = ?",
      [bashoId],
    );
    const tournamentInternalId = tIdResult[0][0];

    // 3. Populate Wrestlers and Banzuke
    for (const entry of data.rikishi) {
      // Update/Insert Wrestler
      db.query(
        "INSERT OR IGNORE INTO wrestlers (shikona, current_heya) VALUES (?, ?)",
        [entry.shikona, entry.heya],
      );

      const wIdResult = db.query("SELECT id FROM wrestlers WHERE shikona = ?", [
        entry.shikona,
      ]);
      const wrestlerId = wIdResult[0][0];

      // Create the Banzuke link
      db.query(
        `INSERT OR REPLACE INTO banzuke (tournament_id, wrestler_id, rank, side) 
          VALUES (?, ?, ?, ?)`,
        [tournamentInternalId, wrestlerId, entry.rank, entry.side],
      );
    }

    // Redirect back to admin with success
    return new Response(null, {
      status: 303,
      headers: { Location: "/admin?success=true" },
    });
  } catch (err) {
    console.error(err);
    return new Response("Sync Failed", { status: 500 });
  }
}

async function handleTestHook(_req: Request) {
  // This is just a placeholder to show how you can add more admin actions
  console.log("Test Hook Triggered!");
  return new Response("", {
    status: 303,
    headers: { "Location": "/admin" },
  });
}
