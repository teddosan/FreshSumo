import { Handlers } from "$fresh/server.ts";
import { deleteCookie, getCookies } from "$std/http/cookie.ts";
import { deleteSession } from "../../utils/auth.ts";

export const handler: Handlers = {
  GET() {
    return new Response(null, {
      status: 303,
      headers: {
        Location: "/login",
      },
    });
  },

  POST(req: Request) {
    const cookies = getCookies(req.headers);
    const sessionId = cookies.session;

    if (sessionId) {
      deleteSession(sessionId);
    }

    const headers = new Headers();

    deleteCookie(headers, "session", { path: "/" });

    headers.set("Location", "/login");
    return new Response(null, { status: 303, headers });
  },
};
