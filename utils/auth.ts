import { getUserById, runQuery } from "./auth_db.ts";

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
  const rows = await runQuery(
    "SELECT user_id, expires_at FROM sessions WHERE id = $1",
    [sessionId],
  );

  if (rows.length === 0) return null;

  // Postgres returns objects, so we destructure by name
  const { user_id, expires_at } = rows[0];

  // Compare expiration
  if (Number(expires_at) < Date.now()) {
    // Optional: clean up expired session
    await runQuery("DELETE FROM sessions WHERE id = $1", [sessionId]);
    return null;
  }

  // getUserById is now async, so we must await it
  return await getUserById(user_id as string);
}

export async function deleteSession(sessionId: string) {
  await runQuery("DELETE FROM sessions WHERE id = $1", [sessionId]);
}
