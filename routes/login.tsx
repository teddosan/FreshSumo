export default function Login() {
  return (
    <div class="min-h-screen bg-slate-50 font-sans text-slate-900 flex items-center justify-center p-4">
      <div class="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
        <h1 class="text-2xl font-black text-slate-900 mb-6">Login</h1>

        <form method="POST" action="/api/login" class="space-y-5">
          <div class="space-y-2">
            <label
              class="block text-sm font-bold tracking-wide text-slate-700"
              for="email"
            >
              Email
            </label>
            <input
              id="email"
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
              id="password"
              name="password"
              type="password"
              required
              class="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100"
            />
          </div>

          <button
            type="submit"
            class="w-full rounded-xl bg-indigo-600 py-3 font-black text-white hover:bg-indigo-700 active:scale-95 transition"
          >
            Login
          </button>
        </form>

        <p class="mt-5 text-sm text-slate-600">
          Need to register?{" "}
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
