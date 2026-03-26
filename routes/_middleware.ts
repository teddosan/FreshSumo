import { getCookies } from "$std/http/cookie.ts";
import { getUserFromSession } from "../utils/auth.ts";

export async function handler(req: Request, ctx: any) {
  const cookies = getCookies(req.headers);
  const sessionId = cookies.session;

  const user = sessionId ? getUserFromSession(sessionId) : null;

  // Attach user to context
  ctx.state.user = user;

  return await ctx.next();
}
