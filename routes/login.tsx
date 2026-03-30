export default function Login() {
  return (
    <div class="min-h-screen bg-slate-50 font-sans text-slate-900 flex items-center justify-center p-4">
      <div class="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
        <h1 class="text-2xl font-black text-slate-900 mb-6">Login</h1>

        <form method="POST" action="/api/login">
          <div class="space-y-2">
            <label
              class="block text-sm font-bold tracking-wide text-slate-700"
              for="email"
            >
              Email
            </label>
            <input
              name="email"
              type="email"
              required
              class="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100"
            />
          </div>

          <div class="space-y-2">
            <label
              class="block text-sm font-bold tracking-wide text-slate-700"
              for="password"
            >
              Password
            </label>
            <input
              name="password"
              type="password"
              required
              class="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100"
            />
          </div>

          <button
            type="submit"
            class="w-full rounded-xl bg-blue-500 text-white font-bold py-2 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Login
          </button>
        </form>

        <p class="mt-5 text-sm text-slate-600">
          No account?{"  "}
          <a
            href="/register"
            class="font-bold text-indigo-700 hover:text-indigo-900 underline underline-offset-2"
          >
            Register
          </a>
        </p>
      </div>
    </div>
  );
}
