import { getCookies } from "$std/http/cookie.ts";
import { getUserFromSession } from "../utils/auth.ts";

export async function handler(req: Request, ctx: any) {
  const cookies = getCookies(req.headers);
  const sessionId = cookies.session;
  const watchedDay = cookies.sumo_watched_day;
  const watchedDayNum = watchedDay ? parseInt(watchedDay) : 0;

  const user = sessionId ? getUserFromSession(sessionId) : null;
  console.log(user);

  ctx.state.user = user;
  ctx.state.watchedDay = watchedDayNum;
  console.log(
    `Middleware: User=${user}, watchedDay=${watchedDayNum}`,
  );
  return await ctx.next();
}
