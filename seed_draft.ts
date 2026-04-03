import { DB } from "https://deno.land/x/sqlite@v3.9.1/mod.ts";

const db = new DB("sumo.db");

// 1. Create the table if it's missing
db.execute(`
  CREATE TABLE IF NOT EXISTS wrestlers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE,
    owner TEXT,
    basho_id TEXT
  )
`);

// 2. Add the actual picks (Replace these with your actual family picks!)
const picks = [
  { name: "Hoshoryu", owner: "Dad" },
  { name: "Kotozakura", owner: "Dad" },
  { name: "Onosato", owner: "Kevin" },
  { name: "Takerufuji", owner: "Kevin" },
  { name: "Kirishima", owner: "Mike" },
];

console.log("📝 Registering picks for March 2026...");

for (const p of picks) {
  db.query(
    "INSERT OR REPLACE INTO wrestlers (name, owner, basho_id) VALUES (?, ?, ?)",
    [p.name, p.owner, "202603"],
  );
}

db.close();
console.log("✅ Wrestlers table created and seeded!");
