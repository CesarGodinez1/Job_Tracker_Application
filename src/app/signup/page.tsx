"use client";

import { useState } from "react";

export default function SignupPage() {
    const [name, setName] = useState(""), [email, setEmail] = useState(""), [password, setPassword] = useState("");
    const [msg, setMsg] = useState<string | null>(null);

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault(); setMsg(null);
        const res = await fetch ("/api/register", {
            method: "POST",
            headers: { "Content-Type": "application.json" },
            body: JSON.stringify({ name, email, password }),

        });
        if (res.ok) setMsg("Account created! Now sign in.");
        else { const data = await res.json().catch(()=>({})); setMsg(data?.error ?? "Failed to register"); }

    }

    return (
        <div className="min-h-screen grid place-items-center p-6">
            <form onSubmit={onSubmit} className="w-full max-w-sm space-y-3 rounded-xl border bg-white p-4">
                <h1 className="text-xl font-semibold">Create account</h1>
                <input className="w-full rounded-lg border px-3 py-2" placeholder="Full name" value={name} onChange={e=>setName(e.target.value)} required />
                <input className="w-full rounded-lg border px-3 py-2" type="email" placeholder="you@example.com" onChange={e=>setEmail(e.target.value)} required />
                <input className="w-full rounded-lg border px-3 py-2" type="password" placeholder="Password (min 8 chars)" value={password} onChange={e=>setPassword(e.target.value)} required />
                <button className="w-full rounded-lg border px-3 py-2" type="submit">Sign up</button>
                {msg && <p className="text-sm text-gray-700">{msg}</p>}
            </form>
        </div>
    );
}