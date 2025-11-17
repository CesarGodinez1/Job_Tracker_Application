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
    <form onSubmit={onSubmit} className="space-y-3 rounded-xl border border-gray-200 bg-white text-gray-900 p-4 shadow-sm">
      <h2 className="text-lg font-semibold">Add Application</h2>
      <input
        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        placeholder="Company (e.g., Google)"
        value={company}
        onChange={(e) => setCompany(e.target.value)}
        required
      />
      <input
        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        placeholder="Position (e.g., SWE Intern)"
        value={position}
        onChange={(e) => setPosition(e.target.value)}
        required
      />
      <select
        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        value={status}
        onChange={(e) => setStatus(e.target.value as typeof STATUSES[number])}
      >
        {STATUSES.map(s => (
          <option key={s} value={s} className="text-black">{s}</option>
        ))}
      </select>
      <button
        className="w-full rounded-lg bg-blue-600 text-white px-3 py-2 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        type="submit"
        disabled={isPending}
      >
        {isPending ? "Adding..." : "Add"}
      </button>
      {msg && <p className="text-sm text-gray-700">{msg}</p>}
    </form>
  );
}
