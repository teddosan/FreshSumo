import { DB } from "https://deno.land/x/sqlite/mod.ts";
import { useState } from "preact/hooks";

interface Rikishi {
  name: string;
  rank: string;
}

const basho_day = 15; // You can change this to the current day of the basho

function initDatabase() {
  const db = new DB("sumo.db");

  // This creates the 'daily_results' table if it doesn't already exist
  db.execute(`
    CREATE TABLE IF NOT EXISTS daily_results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      basho_id TEXT,
      day INTEGER,
      rikishi_name TEXT,
      opponent_name TEXT,
      result TEXT,
      kimarite TEXT,
      UNIQUE(basho_id, day, rikishi_name) -- Prevents duplicate entries if you sync twice
    )
  `);

  console.log("✅ Table 'daily_results' is verified and ready.");
  db.close();
}

// Call it right away
initDatabase();

async function updateDailyResults(day: number) {
  const basho = "202603";
  const url = `https://sumo-api.com/api/basho/${basho}/results/${day}`;

  const response = await fetch(url);
  const data = await response.json();

  const db = new DB("sumo.db");

  db.transaction(() => {
    // The API provides results in 'east' and 'west' blocks
    const allResults = [...data.east, ...data.west];

    for (const record of allResults) {
      // Use the correct keys: shikonaEn, opponentShikonaEn, result
      db.query(
        `
        INSERT OR REPLACE INTO daily_results 
        (basho_id, day, rikishi_name, opponent_name, result, kimarite) 
        VALUES (?, ?, ?, ?, ?, ?)`,
        [
          basho,
          day,
          record.shikonaEn, // 👈 Match this to the JSON
          record.opponentShikonaEn, // 👈 Match this to the JSON
          record.result, // 'win' or 'loss'
          record.kimarite, // e.g. 'yorikiri'
        ],
      );
    }
  });

  db.close();
  console.log(`✅ Day ${day} synced!`);
}

async function syncFullTournament() {
  console.log("📥 Starting full tournament sync...");
  for (let d = 1; d <= 15; d++) {
    // This calls the fetch function we wrote earlier
    await updateDailyResults(d);
  }
  console.log("🏆 All 15 days of the March Basho are now in your database!");
}

// Trigger the sync
await syncFullTournament();

// Don't forget to actually CALL the function at the bottom of the file!
// await updateDailyResults(basho_day);
