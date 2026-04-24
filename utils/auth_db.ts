import { pool } from "./db.ts";
import { Resend } from "resend";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const resend = new Resend(RESEND_API_KEY!);

// Generic helper - now async
export async function runQuery(sql: string, params: any[] = []) {
  const result = await pool.query(sql, params);
  return result.rows;
}

export async function getUserByUsername(userName: string) {
  const rows = await runQuery(
    "SELECT id, username, password_hash FROM users WHERE username = $1",
    [userName],
  );

  if (rows.length === 0) return null;

  const { id, username, password_hash } = rows[0];
  console.log("🔍 User found:", { id, username, password_hash });

  return {
    id: id as string,
    username: username as string,
    password_hash: password_hash as string,
  };
}

export async function getUserById(id: string) {
  const rows = await runQuery(
    "SELECT id, username FROM users WHERE id = $1",
    [id],
  );

  if (rows.length === 0) return null;

  const { id: userId, username } = rows[0];

  return {
    id: userId as string,
    username: username as string,
    isAdmin: username === "teddosan",
  };
}

export async function createUser(username: string, passwordHash: string) {
  const id = crypto.randomUUID();

  await runQuery(
    "INSERT INTO users (id, username, password_hash) VALUES ($1, $2, $3)",
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

  // Perform DB work first
  await runQuery(
    "INSERT INTO users (id, username, email, fullname, password_hash) VALUES ($1, $2, $3, $4, $5)",
    [id, username, email, fullname, passwordHash],
  );

  // Send email after DB succeeds
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
