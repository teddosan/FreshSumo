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
  // The official endpoint for match results
  const url =
    `https://www.sumo-api.com/api/basho/${basho}/torikumi/Makuuchi/${day}`;

  const response = await fetch(url);
  const data = await response.json(); // This is an array of bouts

  const db = new DB("sumo.db");

  // Replace the loop in your updateDailyResults function with this:

  const matches = data.torikumi || []; // Access the 'torikumi' array

  db.transaction(() => {
    for (const bout of matches) {
      // 1. Handle the EAST wrestler
      db.query(
        `
      INSERT OR REPLACE INTO daily_results 
      (basho_id, day, rikishi_name, opponent_name, result, kimarite) 
      VALUES (?, ?, ?, ?, ?, ?)`,
        [
          bout.bashoId,
          bout.day,
          bout.eastShikona,
          bout.westShikona,
          bout.winnerEn === bout.eastShikona ? "win" : "loss",
          bout.kimarite,
        ],
      );

      // 2. Handle the WEST wrestler
      db.query(
        `
      INSERT OR REPLACE INTO daily_results 
      (basho_id, day, rikishi_name, opponent_name, result, kimarite) 
      VALUES (?, ?, ?, ?, ?, ?)`,
        [
          bout.bashoId,
          bout.day,
          bout.westShikona,
          bout.eastShikona,
          bout.winnerEn === bout.westShikona ? "win" : "loss",
          bout.kimarite,
        ],
      );
    }
  });

  db.close();
  console.log(`✅ Day ${day} synced with official Torikumi data.`);
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
