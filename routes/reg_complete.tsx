import { PageProps } from "$fresh/server.ts";

export default function RegistrationComplete() {
  return (
    <div class="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div class="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 border border-slate-100 text-center">
        {/* Success Icon */}
        <div class="text-6xl mb-4">🎏</div>

        <h1 class="text-3xl font-black text-indigo-900 tracking-tight mb-2">
          Registration Sent!
        </h1>

        <p class="text-slate-600 font-medium leading-relaxed mb-8">
          Thanks for joining the Ohio Fantasy Sumo League. Your application has
          been forwarded to the Commissioner for approval.
        </p>

        <div class="bg-indigo-50 rounded-2xl p-4 mb-8">
          <p class="text-indigo-700 text-sm font-bold">
            What happens next?
          </p>
          <p class="text-indigo-600 text-xs mt-1">
            Once approved, you'll receive an email and be able to log in to
            start your draft.
          </p>
        </div>

        <a
          href="/"
          class="inline-block w-full bg-slate-900 hover:bg-black text-white font-bold py-3 px-6 rounded-xl transition-all active:scale-95"
        >
          Back to Home
        </a>
      </div>
    </div>
  );
}
