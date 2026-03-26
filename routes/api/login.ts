import { setCookie } from "$std/http/cookie.ts";
import { getUserByEmail } from "../../utils/auth_db.ts";
import { createSession } from "../../utils/auth.ts";
import bcrypt from "bcrypt";

export async function POST(req: Request) {
  const body = await req.formData();

  const email = body.get("email")?.toString() || "";
  const password = body.get("password")?.toString() || "";

  const user = getUserByEmail(email);

  if (!user) {
    return new Response("Invalid credentials", { status: 401 });
  }

  const valid = await bcrypt.compare(password, user.password_hash);

  if (!valid) {
    return new Response("Invalid credentials", { status: 401 });
  }

  const sessionId = createSession(user.id);

  const headers = new Headers();

  setCookie(headers, {
    name: "session",
    value: sessionId,
    httpOnly: true,
    path: "/",
    sameSite: "Lax",
  });

  return new Response(null, {
    status: 303,
    headers: {
      ...Object.fromEntries(headers),
      Location: "/dashboard",
    },
  });
}
