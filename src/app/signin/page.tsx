"use client";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";

export default function SignIn() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/applications?autoSync=1";
  // Pass through existing callbackUrl as-is to avoid double-encoding
  const href = `/api/auth/signin/google?callbackUrl=${callbackUrl}`;

  const err = (searchParams.get("error") || "").toString();
  const errorMessage = (() => {
    switch (err) {
      case "OAuthSignin":
        return "Sign-in failed. Check Google Client ID/Secret and redirect URI.";
      case "OAuthCallback":
        return "Callback failed. Ensure the redirect URI matches your Google OAuth settings.";
      case "OAuthCreateAccount":
        return "Could not create an account from Google profile.";
      case "OAuthAccountNotLinked":
        return "This email is already used. Use the same provider you originally signed up with.";
      case "Configuration":
        return "Auth configuration error. See server logs for details.";
      case "AccessDenied":
        return "Access denied. The app might be in Testing and your account isn’t added as a test user.";
      default:
        return err ? `Error: ${err}` : null;
    }
  })();

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-white via-white to-gray-50">
      <div className="relative mx-auto max-w-3xl px-6">
        <header className="pt-10 pb-6 text-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Application Tracker</h1>
          <p className="mt-1 text-sm text-gray-600">Manage and monitor your job applications</p>
        </header>
      </div>

      <div className="relative grid place-items-center p-6">
        <div className="w-full max-w-md space-y-6 rounded-2xl border border-black/5 bg-white/80 p-8 shadow-xl backdrop-blur-lg">
          <h2 className="text-2xl font-bold tracking-tight">Sign in with Google</h2>
          <p className="-mt-1 text-sm text-gray-600">
            This app relies solely on Gmail sync. To continue, sign in with your Google
            account and grant read-only access to scan job-related emails.
          </p>

          {errorMessage && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {errorMessage}
            </div>
          )}

          <button
            type="button"
            onClick={() => signIn("google", { callbackUrl })}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 shadow-sm transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="h-5 w-5"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 31.6 29.3 35 24 35c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.7 5.1 29.6 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21c10.5 0 20-7.6 20-21 0-1.2-.1-2.3-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 16.2 18.9 13 24 13c3 0 5.8 1.1 7.9 3l5.7-5.7C34.7 5.1 29.6 3 24 3 16.5 3 10 7.1 6.3 14.7z"/><path fill="#4CAF50" d="M24 45c5.2 0 10-2 13.6-5.4l-6.3-5.3C29 35.9 26.6 37 24 37c-5.2 0-9.6-3.4-11.4-8.2l-6.6 5.1C10 41 16.5 45 24 45z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-1 3-4.2 7-11.3 7-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.7 5.1 29.6 3 24 3 16.5 3 10 7.1 6.3 14.7z"/></svg>
            Continue with Google
          </button>

          <p className="text-xs text-gray-500">
            You can revoke access at any time from your Google Account settings.
          </p>
        </div>
      </div>
    </div>
  );
}
