import { getUserById, runQuery } from "./auth_db.ts";

const SESSION_DURATION = 1000 * 60 * 60 * 24 * 7; // 7 days

export function createSession(userId: string) {
  const sessionId = crypto.randomUUID();
  const expiresAt = Date.now() + SESSION_DURATION;

  runQuery(
    "INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)",
    [sessionId, userId, expiresAt],
  );

  return sessionId;
}

export function getUserFromSession(sessionId: string) {
  const rows = [
    ...runQuery(
      "SELECT user_id, expires_at FROM sessions WHERE id = ?",
      [sessionId],
    ),
  ];

  if (rows.length === 0) return null;

  const [user_id, expires_at] = rows[0];

  if ((expires_at as number) < Date.now()) {
    // Optional: clean up expired session
    runQuery("DELETE FROM sessions WHERE id = ?", [sessionId]);
    return null;
  }

  return getUserById(user_id as string);
}

export function deleteSession(sessionId: string) {
  runQuery("DELETE FROM sessions WHERE id = ?", [sessionId]);
}
