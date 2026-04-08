import { DB } from "https://deno.land/x/sqlite@v3.9.1/mod.ts";

// Open DB
export const db = new DB("app.db");

// Performance tweak
db.execute(`PRAGMA journal_mode = WAL;`);

// Tables
db.execute(`
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
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

export function getUserByUsername(userName: string) {
  const rows = [
    ...db.query(
      "SELECT id, username, password_hash FROM users WHERE username = ?",
      [userName],
    ),
  ];

  if (rows.length === 0) return null;

  const [id, username, password_hash] = rows[0];

  return {
    id: id as string,
    username: username as string,
    password_hash: password_hash as string,
  };
}

export function getUserById(id: string) {
  const rows = [
    ...db.query(
      "SELECT id, username FROM users WHERE id = ?",
      [id],
    ),
  ];

  if (rows.length === 0) return null;

  const [userId, username] = rows[0];

  return {
    id: userId as string,
    username: username as string,
    /// Change this to eventually check database for admin status
    isAdmin: username === "teddosan",
  };
}

// Optional but VERY useful for registration
export function createUser(username: string, passwordHash: string) {
  const id = crypto.randomUUID();

  db.query(
    "INSERT INTO users (id, username, password_hash) VALUES (?, ?, ?)",
    [id, username, passwordHash],
  );

  return { id, username };
}
