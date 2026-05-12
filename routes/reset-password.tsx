import { Handlers, PageProps } from "$fresh/server.ts";
import { pool } from "../utils/db.ts"; // Your DB connection
import bcrypt from "bcrypt";

export const handler: Handlers = {
  async GET(req, ctx) {
    const url = new URL(req.url);
    const token = url.searchParams.get("token");

    if (!token) return ctx.renderNotFound();

    // 1. Hash the incoming token to check against the DB
    const tokenHash = await hashToken(token);

    // 2. Check if token is valid and not expired
    const result = await pool.query(
      `
      SELECT user_id FROM password_reset_tokens 
      WHERE token_hash = $1 AND expires_at > NOW()
      LIMIT 1
    `,
      [tokenHash],
    );

    if (result.rows.length === 0) {
      // Token is invalid or expired
      return new Response(null, {
        status: 303,
        headers: { Location: "/forgot-password?error=invalid_token" },
      });
    }

    return ctx.render({ token });
  },

  async POST(req, _ctx) {
    const formData = await req.formData();
    const token = formData.get("token")?.toString();
    const password = formData.get("password")?.toString();

    if (!token || !password) {
      return new Response("Missing data", { status: 400 });
    }

    const tokenHash = await hashToken(token);

    // 3. Update password and delete token in a transaction
    // 1. Check out a dedicated client from the pool
    const client = await pool.connect();

    try {
      // Hash the password before starting the DB work
      const newPasswordHash = await bcrypt.hash(password, 10);

      // 2. Start the transaction
      await client.query("BEGIN");

      const query = `
        WITH deleted_token AS (
          DELETE FROM password_reset_tokens 
          WHERE token_hash = $1 
            AND expires_at > NOW()
          RETURNING user_id
        )
        UPDATE users 
        SET password_hash = $2
        FROM deleted_token
        WHERE users.id = deleted_token.user_id
        RETURNING users.id;
      `;

      // 3. Execute the query using the specific client
      const result = await client.query(query, [tokenHash, newPasswordHash]);

      if (result.rows.length === 0) {
        // This will trigger the catch block and the ROLLBACK
        throw new Error("Invalid or expired token");
      }

      // 4. Commit if everything worked
      await client.query("COMMIT");

      return new Response(null, {
        status: 303,
        headers: { Location: "/login?message=password_updated" },
      });
    } catch (e) {
      // 5. Roll back if any part of the process failed
      await client.query("ROLLBACK");
      console.error("Update failed:", e.message);

      return new Response("Update failed: " + e.message, { status: 400 });
    } finally {
      // 6. ALWAYS release the client back to the pool
      client.release();
    }
  },
};

// Helper to hash the token (consistent with how you stored it)
async function hashToken(token: string) {
  const data = new TextEncoder().encode(token);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export default function ResetPasswordPage({ data }: PageProps) {
  return (
    <div class="max-w-sm mx-auto mt-8">
      <h1 class="text-xl font-bold">Reset Your Password</h1>
      <form method="POST">
        <input type="hidden" name="token" value={data.token} />
        <div class="mt-4">
          <label class="block">New Password</label>
          <input
            type="password"
            name="password"
            required
            minLength={8}
            class="border p-2 w-full"
          />
        </div>
        <button type="submit" class="mt-4 bg-blue-500 text-white p-2 rounded">
          Update Password
        </button>
      </form>
    </div>
  );
}
