"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SyncGmailButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSync() {
    try {
      setLoading(true);
      const res = await fetch("/api/gmail/ingest", { method: "POST" });
      const data = await res.json();
      console.log("Sync result:", data);
      alert(
        res.ok
          ? ` Gmail synced!\nScanned: ${data.scanned}\nCreated: ${data.created}\nUpdated: ${data.updated}`
          : ` Sync failed: ${data.error || data.detail}`
      );
    } catch (err) {
      console.error(err);
      alert(" Unexpected error while syncing Gmail.");
    } finally {
      setLoading(false);
      router.refresh(); // refresh the applications table
    }
  }

  return (
    <button
      onClick={handleSync}
      disabled={loading}
      className="border border-gray-500 px-3 py-1 rounded-md hover:bg-gray-800"
    >
      {loading ? "Syncing…" : "Sync Gmail now"}
    </button>
  );
}