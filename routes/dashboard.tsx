import { Handlers, PageProps } from "$fresh/server.ts";

export const handler: Handlers = {
  GET(_req, ctx) {
    const user = ctx.state.user as unknown | null;

    // Keep your existing login/register redirects working.
    return new Response(null, {
      status: 303,
      headers: {
        Location: user ? "/" : "/login",
      },
    });
  },
};

export default function DashboardRedirect(_props: PageProps) {
  return (
    <div class="min-h-screen bg-slate-50 flex items-center justify-center text-slate-700">
      Redirecting...
    </div>
  );
}
