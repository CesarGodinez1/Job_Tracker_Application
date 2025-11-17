"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Silently triggers a background Gmail ingest on mount, throttled via localStorage.
 * Does not force; only pulls recent messages. Refreshes the page if anything changed.
 */
export default function AutoSyncOnMount({ minutes = 30 }: { minutes?: number }) {
  const router = useRouter();

  useEffect(() => {
    const key = "gmail-auto-sync:lastRun";
    const now = Date.now();
    const last = Number(localStorage.getItem(key) || 0);
    const intervalMs = Math.max(5, minutes) * 60 * 1000; // minimum 5 minutes
    if (now - last < intervalMs) return;

    (async () => {
      try {
        const res = await fetch("/api/gmail/ingest", { method: "POST" });
        const data = await res.json().catch(() => ({}));
        localStorage.setItem(key, String(now));
        if (res.ok && ((data?.created ?? 0) > 0 || (data?.updated ?? 0) > 0)) {
          router.refresh();
        }
      } catch {
        // best-effort; ignore errors
      }
    })();
  }, [router, minutes]);

  return null;
}

