"use client";
import { useState } from "react";

export default function StatusFilter({
  statuses,
  onChange,
}: {
  statuses: string[];
  onChange: (status: string | null) => void;
}) {
  const [active, setActive] = useState<string | null>(null);

  function handleClick(s: string) {
    const newStatus = active === s ? null : s; // toggle off if same
    setActive(newStatus);
    onChange(newStatus);
  }

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {statuses.map((s) => (
        <button
          key={s}
          onClick={() => handleClick(s)}
          className={`px-3 py-1 rounded-full border text-sm ${
            active === s
              ? "bg-blue-600 text-white"
              : "bg-white text-black hover:bg-gray-100"
          }`}
        >
          {s}
        </button>
      ))}
    </div>
  );
}