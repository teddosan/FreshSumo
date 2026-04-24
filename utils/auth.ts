import { getUserById, runQuery } from "./auth_db.ts";
import { pool } from "./db.ts";

const SESSION_DURATION = 1000 * 60 * 60 * 24 * 7; // 7 days

export async function createSession(userId: string) {
  const sessionId = crypto.randomUUID();
  const expiresAt = Date.now() + SESSION_DURATION;

  // Use $1, $2 syntax for Postgres
  await runQuery(
    "INSERT INTO sessions (id, user_id, expires_at) VALUES ($1, $2, $3)",
    [sessionId, userId, expiresAt],
  );

  return sessionId;
}

export async function getUserFromSession(sessionId: string) {
  // DEBUG 1: Is the ID even reaching the function?
  console.log("--- Debugging Session ---");
  console.log("Input SessionID:", `"${sessionId}"`); // Quotes help see hidden spaces

  // DEBUG 2: Ignore expiration for a second to see if the ID exists
  const simpleResult = await pool.query(
    "SELECT id, expires_at FROM sessions WHERE id = $1",
    [sessionId],
  );

  if (simpleResult.rows.length === 0) {
    console.log("❌ No session found with that ID in the DB.");
    return null;
  }

  const dbSession = simpleResult.rows[0];
  const now = Date.now();
  console.log("✅ Session found in DB!");
  console.log("DB Expiry:", dbSession.expires_at);
  console.log("Current Time:", now);

  if (Number(dbSession.expires_at) < now) {
    console.log("❌ Session is expired.");
    return null;
  }

  // If we got here, the JOIN is the problem
  const fullResult = await pool.query(
    `
    SELECT u.id, u.username, u.fullname, u.email
    FROM users u
    JOIN sessions s ON u.id = s.user_id
    WHERE s.id = $1
  `,
    [sessionId],
  );

  if (fullResult.rows.length === 0) {
    console.log(
      "❌ Session exists, but the user_id doesn't match any user in 'users' table.",
    );
    return null;
  }

  const user = fullResult.rows[0];
  return {
    id: user.id,
    username: user.username,
    fullname: user.fullname,
    isAdmin: user.username === "teddosan",
  };
}

export async function deleteSession(sessionId: string) {
  await runQuery("DELETE FROM sessions WHERE id = $1", [sessionId]);
}
