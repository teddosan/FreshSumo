import { Handlers } from "$fresh/server.ts";
import { setCookie } from "$std/http/cookie.ts";
import bcrypt from "bcrypt";

import {
  approveUserRegistration,
  createUser,
  getUserByUsername,
} from "../../utils/auth_db.ts";
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

    const username = form.get("username")?.toString().trim() || "";
    const fullname = form.get("full_name")?.toString().trim() || "";
    const email = form.get("email")?.toString().trim() || "";
    const password = form.get("password")?.toString() || "";

    // Basic validation
    if (!username || !password) {
      return new Response("Missing username or password", { status: 400 });
    }

    if (password.length < 6) {
      return new Response("Password must be at least 6 characters", {
        status: 400,
      });
    }

    // Check if user exists
    const existingUser = await getUserByUsername(username);

    if (existingUser) {
      return new Response("User already exists", { status: 400 });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Approve user
    const user = approveUserRegistration(
      username,
      email,
      fullname,
      passwordHash,
    );

    return new Response(null, {
      status: 303,
      headers: { Location: "/reg_complete" },
    });
  },
};
