"use client";

import { useState } from "react";

export default function SyncGmailButton() {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function onClick() {
    setLoading(true);
    setMsg(null);
    const res = await fetch("/api/gmail/ingest", { method: "POST" });
    const data = await res.json().catch(() => null);
    setLoading(false);
    if (res.ok) {
      setMsg(`Synced: +${data.created} created, ${data.updated} updated, ${data.skipped} skipped.`);
      // quick refresh
      window.location.reload();
    } else {
      setMsg(data?.error ?? "Sync failed");
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={onClick}
        disabled={loading}
        className="rounded-lg border px-3 py-2 disabled:opacity-50"
      >
        {loading ? "Syncing Gmail..." : "Sync Gmail now"}
      </button>
      {msg && <span className="text-sm opacity-80">{msg}</span>}
    </div>
  );
}