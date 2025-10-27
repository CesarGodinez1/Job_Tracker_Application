"use client";

import { useEffect, useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function SignIn() {
  const router = useRouter();
  const { status } = useSession(); // "loading" | "authenticated" | "unauthenticated"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // If already signed in, send to applications
  useEffect(() => {
    if (status === "authenticated") router.replace("/applications");
  }, [status, router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl: "/applications",
    });
    setLoading(false);
    if (res?.ok) router.push("/applications");
    else setMsg(res?.error || "Invalid email or password");
  }

  return (
    <div className="min-h-screen grid place-items-center p-6">
      <div className="w-full max-w-sm space-y-3 rounded-xl border bg-[#0f1b2d] text-white p-4">
        <h1 className="text-xl font-semibold">Sign in</h1>

        <form onSubmit={onSubmit} className="space-y-2">
          <input
            className="w-full rounded-lg border px-3 py-2 text-black"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            className="w-full rounded-lg border px-3 py-2 text-black"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            className="w-full rounded-lg border px-3 py-2 disabled:opacity-50"
            type="submit"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div className="flex items-center gap-2 opacity-60">
          <div className="h-px flex-1 bg-white/30" />
          <span className="text-xs">or</span>
          <div className="h-px flex-1 bg-white/30" />
        </div>

        <button
          className="w-full rounded-lg border px-3 py-2 bg-white text-black"
          onClick={() => signIn("google", { callbackUrl: "/applications" })}
        >
          Continue with Google
        </button>

        {msg && <p className="text-sm text-red-400">{msg}</p>}
        <p className="text-sm">
          New here? <a className="underline" href="/signup">Create an account</a>
        </p>
      </div>
    </div>
  );
}