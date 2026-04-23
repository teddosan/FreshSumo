// utils/db.ts
import { Pool } from "npm:pg";

const connectionString = Deno.env.get("DATABASE_URL");

export const pool = new Pool({
  // CORRECT: Wrap the string in an object
  connectionString: connectionString,

  // Also, since you are connecting from WSL to Windows,
  // you might need this to avoid SSL issues locally
  ssl: connectionString?.includes("localhost")
    ? false
    : { rejectUnauthorized: false },
});
