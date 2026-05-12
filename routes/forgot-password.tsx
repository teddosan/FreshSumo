import { Handlers, PageProps } from "$fresh/server.ts";
import { pool } from "../utils/db.ts"; // Replace with your actual DB import
import { Resend } from "resend";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const resend = new Resend(RESEND_API_KEY!);

export const handler: Handlers = {
  async POST(req, _ctx) {
    const formData = await req.formData();
    const email = formData.get("email")?.toString().toLowerCase();

    if (!email) {
      return new Response("Email is required", { status: 400 });
    }

    // 1. Look up user by email
    const userResult = await pool.query(
      "SELECT id, username FROM users WHERE email = $1 LIMIT 1",
      [email],
    );

    // ONLY proceed if a user was actually found
    if (userResult.rows.length > 0) {
      // Use the correct accessor based on your driver (usually .id or [0])
      const userId = userResult.rows[0].id;
      const username = userResult.rows[0].username;
      const token = crypto.randomUUID();
      const tokenHash = await hashToken(token); // Ensure this helper is awaited

      // 4. Store hashed token
      await pool.query(
        `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, NOW() + INTERVAL '1 hour')`,
        [userId, tokenHash],
      );

      // 5. Send Email logic here...
      console.log(
        `Sending reset link to ${email}: /reset-password?token=${token}`,
      );
      await resend.emails.send({
        from: "Sumo App <onboarding@resend.dev>",
        to: email,
        subject: `🚨 Password Reset Request: ${username}`,
        html: `
      <h2>Password Reset Request</h2>
        <p>We received a request to reset your password. 
        Click the link below to set a new password:</p>
        <a href="https://fresh-sumo.teddosan.deno.net/reset-password?token=${token}"
        style="display:inline-block;margin-top:20px;padding:10px 20px;
        background-color:#2563eb;color:#fff;text-decoration:none;
        border-radius:5px;">Reset Password</a>
        <p style="margin-top:20px;font-size:12px;color:#555;">
        If you didn't request this, you can safely ignore this email.</p>
    `,
      });
    }

    // Always return success to prevent user enumeration
    return new Response(null, {
      status: 303,
      headers: { Location: "/forgot-password/success" },
    });
  },
};

export default function ForgotPasswordPage() {
  return (
    <div class="max-w-md mx-auto mt-10 p-4">
      <h1 class="text-2xl font-bold mb-4">Reset Your Password</h1>
      <p class="text-gray-600 mb-6">
        Enter your email address and we'll send you a link to reset your
        password.
      </p>

      <form method="POST">
        <div class="mb-4">
          <label class="block mb-2 font-medium">Email Address</label>
          <input
            type="email"
            name="email"
            required
            class="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="rikishi@example.com"
          />
        </div>
        <button
          type="submit"
          class="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition"
        >
          Send Reset Link
        </button>
      </form>
    </div>
  );
}

// Helper to hash the token for secure storage
async function hashToken(token: string) {
  const data = new TextEncoder().encode(token);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
