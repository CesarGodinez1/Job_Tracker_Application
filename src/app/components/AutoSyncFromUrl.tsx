"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";

/**
 * If the URL has ?autoSync=1, trigger a one-time Gmail ingest (optionally force)
 * and then clean the URL so it doesn't repeat on refresh/back.
 */
export default function AutoSyncFromUrl() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    const auto = searchParams.get("autoSync");
    if (auto !== "1") return;
    fired.current = true;

    (async () => {
      try {
        await fetch("/api/gmail/ingest?force=1", { method: "POST" });
        // Remove the query param to avoid re-trigger on refresh
        router.replace("/applications");
        router.refresh();
      } catch {
        router.replace("/applications");
      }
    })();
  }, [router, searchParams]);

  return null;
}

