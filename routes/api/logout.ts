import { deleteCookie, getCookies } from "$std/http/cookie.ts";
import { deleteSession } from "../../lib/auth.ts";

export function POST(req: Request) {
  const cookies = getCookies(req.headers);
  const sessionId = cookies.session;

  if (sessionId) {
    deleteSession(sessionId);
  }

  const headers = new Headers();

  deleteCookie(headers, "session", { path: "/" });

  return new Response(null, {
    status: 303,
    headers: {
      ...Object.fromEntries(headers),
      Location: "/login",
    },
  });
}
