import { PageProps } from "$fresh/server.ts";

export default function ForgotPasswordSuccessPage() {
  return (
    <div class="max-w-md mx-auto mt-20 p-6 text-center border rounded-xl shadow-sm bg-white">
      <div class="mb-6 inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full">
        <svg
          class="w-8 h-8 text-green-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M5 13l4 4L19 7"
          >
          </path>
        </svg>
      </div>

      <h1 class="text-2xl font-bold mb-4">Check your email</h1>
      <p class="text-gray-600 mb-8 leading-relaxed">
        If an account exists for that address, we have sent a password reset
        link. Please check your inbox (and your spam folder) to continue.
      </p>

      <div class="border-t pt-6">
        <a
          href="/login"
          class="text-blue-600 hover:text-blue-800 font-medium transition"
        >
          &larr; Return to Login
        </a>
      </div>
    </div>
  );
}
