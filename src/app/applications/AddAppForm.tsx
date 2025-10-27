"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

const STATUSES = ["SAVED","APPLIED","OA","INTERVIEW","OFFER","REJECTED","WITHDRAWN"] as const;

export default function AddAppForm() {
  const router = useRouter();
  const [company, setCompany] = useState("");
  const [position, setPosition] = useState("");
  const [status, setStatus] = useState<typeof STATUSES[number]>("SAVED");
  const [msg, setMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    const res = await fetch("/api/applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ company, position, status }),
    });

    if (res.ok) {
      setCompany("");
      setPosition("");
      setStatus("SAVED");
      setMsg("Added!");
      // refresh the server component list
      startTransition(() => router.refresh());
    } else {
      const data = await res.json().catch(() => ({}));
      setMsg(typeof data?.error === "string" ? data.error : "Failed to add");
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-2 rounded-xl border bg-[#0f1b2d] text-white p-4">
      <h2 className="text-lg font-semibold">Add Application</h2>
      <input
        className="w-full rounded-lg border px-3 py-2 bg-transparent text-white placeholder:text-gray-200"
        placeholder="Company (e.g., Google)"
        value={company}
        onChange={(e) => setCompany(e.target.value)}
        required
      />
      <input
        className="w-full rounded-lg border px-3 py-2 bg-transparent text-white placeholder:text-gray-200"
        placeholder="Position (e.g., SWE Intern)"
        value={position}
        onChange={(e) => setPosition(e.target.value)}
        required
      />
      <select
        className="w-full rounded-lg border px-3 py-2 bg-transparent text-white"
        value={status}
        onChange={(e) => setStatus(e.target.value as typeof STATUSES[number])}
      >
        {STATUSES.map(s => (
          <option key={s} value={s} className="text-black">{s}</option>
        ))}
      </select>
      <button
        className="w-full rounded-lg border px-3 py-2 disabled:opacity-50"
        type="submit"
        disabled={isPending}
      >
        {isPending ? "Adding..." : "Add"}
      </button>
      {msg && <p className="text-sm text-gray-300">{msg}</p>}
    </form>
  );
}