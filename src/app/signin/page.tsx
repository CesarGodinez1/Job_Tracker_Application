"use client"
import { signIn } from "next-auth/react";
import { useState } from "react";

export default function SignIn() {
    const [email, setEmail] = useState(""), [password, setPassword] = useState("");
    const [msg, setMsg] = useState<string | null>(null);

    async function onSubmit(e: React.FormEvent){
        e.preventDefault(); setMsg(null);
        const res = await signIn("credentials", { email, password, redirect: false });
        if (res?.ok) window.location.href = "/applications";
        else setMsg("Invalid email or password");
        
    }

    return (
        <div className="min-h-screen grid place-items-center p-6">
            <div className="w-full max-w-sm space-y-3 rounded-xl border bg-white p-4">
                <h1 className="text-xl font-semibold">Sign in</h1>
                <form onSubmit={onSubmit} className="space-y-2">
                    <input className="w-full rounded-lg border px-3 py-2" type="email" placeholder="you@example.com" value={email} onChange={e=>setEmail(e.target.value)} required />
                    <input className="w-full rounded-lg border px-3 py-2" type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} required />
                    <button className="w-full rounded-lg border px-3 py-2" type="submit">Sign in</button>
                    </form>
                    {msg && <p className="text-sm text-red-600">{msg}</p>}  
                    </div>
        </div>
    );
}