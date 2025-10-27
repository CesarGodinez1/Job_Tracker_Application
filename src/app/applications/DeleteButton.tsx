"use client";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

export default function DeleteButton({ id }: { id: string }) {
  const router = useRouter();
  const [isPending, start] = useTransition();

  async function onDelete() {
    const res = await fetch(`/api/applications/${id}`, { method: "DELETE" });
    if (res.ok) start(() => router.refresh());
    else alert("Failed to delete");
  }

  return (
    <button
      className="rounded-lg border px-2 py-1 text-xs"
      onClick={onDelete}
      disabled={isPending}
    >
      {isPending ? "Deleting..." : "Delete"}
    </button>
  );
}