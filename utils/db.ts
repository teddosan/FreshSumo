// utils/db.ts
import { Pool } from "npm:pg";

const connectionString = Deno.env.get("DATABASE_URL");

if (!connectionString) {
  console.error("🚨 DATABASE_URL IS TOTALLY MISSING!");
} else {
  // Check if it's actually the string you expect (don't log the whole thing for security)
  console.log("✅ DATABASE_URL detected. length:", connectionString.length);
}

export const pool = new Pool({
  connectionString,
  ssl: false,
});
