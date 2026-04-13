import { DB } from "https://deno.land/x/sqlite@v3.9.1/mod.ts";
import { Resend } from "resend";

const resend = new Resend("re_YiKwnaRd_MxLHshXWGFkDgdGxLqAGWd9f");
// Open DB
export const db = new DB("app.db");

// Performance tweak
db.execute(`PRAGMA journal_mode = WAL;`);

// Tables
db.execute(`
CREATE TABLE IF NOT EXISTS pending_users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  fullname TEXT NOT NULL,
  password_hash TEXT NOT NULL
);
`);

db.execute(`
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  fullname TEXT NOT NULL,
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

export async function approveUserRegistration(
  username: string,
  email: string,
  fullname: string,
  passwordHash: string,
) {
  const id = crypto.randomUUID();

  db.query(
    "INSERT INTO pending_users (id, username, email, fullname, password_hash) VALUES (?, ?, ?, ?, ?)",
    [id, username, email, fullname, passwordHash],
  );

  await resend.emails.send({
    from: "Sumo App <onboarding@resend.dev>",
    to: "teddo3@gmail.com",
    subject: `🚨 New Registration Request: ${username}`,
    html: `
      <h2>New User Registration Details</h2>
      <table style="font-family: sans-serif; border-collapse: collapse; width: 100%;">
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Full Name:</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">${fullname}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Username:</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">${username}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Email:</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;">${email}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;"><strong>Password Hash:</strong></td>
          <td style="padding: 8px; border: 1px solid #ddd;"><code style="font-size: 10px;">${passwordHash}</code></td>
        </tr>
      </table>
      <p style="margin-top: 20px;">
        <em>Log into your Master Control panel to approve this user.</em>
      </p>
    `,
  });
}
