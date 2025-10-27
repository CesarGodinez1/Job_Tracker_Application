"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";

const STATUSES = [
  "SAVED",
  "APPLIED",
  "OA",
  "INTERVIEW",
  "OFFER",
  "REJECTED",
  "WITHDRAWN",
] as const;

export default function StatusSelect({
  id,
  value,
}: {
  id: string;
  value: string;
}) {
  const router = useRouter();
  const [isPending, start] = useTransition();

  async function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const status = e.target.value;
    const res = await fetch(`/api/applications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) start(() => router.refresh());
    else alert("Failed to update");
  }

  return (
    <select
      className="rounded-lg border px-2 py-1 bg-transparent"
      defaultValue={value}
      onChange={onChange}
      disabled={isPending}
    >
      {STATUSES.map((s) => (
        <option key={s} value={s} className="text-black">
          {s}
        </option>
      ))}
    </select>
  );
}