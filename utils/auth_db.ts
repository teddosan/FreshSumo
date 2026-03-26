import { DB } from "https://deno.land/x/sqlite@v3.9.1/mod.ts";

// Open DB
export const db = new DB("app.db");

// Performance tweak
db.execute(`PRAGMA journal_mode = WAL;`);

// Tables
db.execute(`
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL
);
`);

db.execute(`
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
`);

// -------------------------
// Helpers
// -------------------------

export function getUserByEmail(email: string) {
  const rows = [
    ...db.query(
      "SELECT id, email, password_hash FROM users WHERE email = ?",
      [email],
    ),
  ];

  if (rows.length === 0) return null;

  const [id, userEmail, password_hash] = rows[0];

  return {
    id: id as string,
    email: userEmail as string,
    password_hash: password_hash as string,
  };
}

export function getUserById(id: string) {
  const rows = [
    ...db.query(
      "SELECT id, email FROM users WHERE id = ?",
      [id],
    ),
  ];

  if (rows.length === 0) return null;

  const [userId, email] = rows[0];

  return {
    id: userId as string,
    email: email as string,
  };
}

// Optional but VERY useful for registration
export function createUser(email: string, passwordHash: string) {
  const id = crypto.randomUUID();

  db.query(
    "INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)",
    [id, email, passwordHash],
  );

  return { id, email };
}
