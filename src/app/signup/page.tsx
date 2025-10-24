"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" }, // fixed
      body: JSON.stringify({ name, email, password }),
    });

    if (res.ok) {
      setMsg("Account created! Now sign in.");
    } else {
      // Make Zod errors readable
      let text = "Failed to register";
      try {
        const data = await res.json();
        if (typeof data?.error === "string") text = data.error;
        else if (data?.error?.fieldErrors) {
          const firstField = Object.values<string[]>(data.error.fieldErrors)[0];
          if (firstField?.[0]) text = firstField[0];
        }
      } catch {
        /* ignore */
      }
      setMsg(text);
    }
  }

  async function handleGoogleSignIn() {
    setMsg(null);
    try {
      // Let NextAuth handle the redirect automatically
      await signIn("google", { 
        callbackUrl: "/applications"
      });
    } catch (error) {
      console.error("Google sign-in error:", error);
      setMsg("Google sign-in failed: " + (error as Error).message);
    }
  }

  return (
    <div className="min-h-screen grid place-items-center p-6">
      <div className="w-full max-w-sm space-y-4 rounded-xl border bg-white p-6">
        <h1 className="text-xl font-semibold">Create account</h1>
        
        {/* Google Sign-in Button */}
        <button 
          onClick={handleGoogleSignIn}
          className="w-full rounded-lg border px-3 py-2 bg-white hover:bg-gray-50 flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or</span>
          </div>
        </div>

        {/* Email/Password Form */}
        <form onSubmit={onSubmit} className="space-y-3">
          <input
            className="w-full rounded-lg border px-3 py-2"
            placeholder="Full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <input
            className="w-full rounded-lg border px-3 py-2"
            type="email"
            placeholder="you@example.com"
            value={email}                          
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            className="w-full rounded-lg border px-3 py-2"
            type="password"
            placeholder="Password (min 8 chars)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button className="w-full rounded-lg border px-3 py-2 bg-blue-600 text-white hover:bg-blue-700" type="submit">Sign up with Email</button>
        </form>
        
        {msg && <p className="text-sm text-gray-700">{msg}</p>}
        
        {/* Sign in link */}
        <p className="text-sm text-center text-gray-600">
          Already have an account?{" "}
          <a href="/signin" className="text-blue-600 hover:underline">Sign in</a>
        </p>
      </div>
    </div>
  );
}
