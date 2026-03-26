import { Handlers } from "$fresh/server.ts";
import { setCookie } from "$std/http/cookie.ts";
import bcrypt from "bcrypt";

import { createUser, getUserByEmail } from "../../utils/auth_db.ts";
import { createSession } from "../../utils/auth.ts";

export const handler: Handlers = {
  GET() {
    return new Response(null, {
      status: 303,
      headers: {
        Location: "/register",
      },
    });
  },

  async POST(req: Request) {
    const form = await req.formData();

    const email = form.get("email")?.toString().trim() || "";
    const password = form.get("password")?.toString() || "";

    // Basic validation
    if (!email || !password) {
      return new Response("Missing email or password", { status: 400 });
    }

    if (password.length < 6) {
      return new Response("Password must be at least 6 characters", {
        status: 400,
      });
    }

    // Check if user exists
    const existingUser = getUserByEmail(email);

    if (existingUser) {
      return new Response("User already exists", { status: 400 });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const user = createUser(email, passwordHash);

    // Create session (auto-login)
    const sessionId = createSession(user.id);

    const headers = new Headers();

    setCookie(headers, {
      name: "session",
      value: sessionId,
      httpOnly: true,
      path: "/",
      sameSite: "Lax",
    });

    headers.set("Location", "/");
    return new Response(null, { status: 303, headers });
  },
};
