// src/components/JobStatusCard.tsx
import React from "react";

interface JobStatusCardProps {
  title: string;
  count: number;
  color: "blue" | "green" | "red";
}

export default function JobStatusCard({ title, count, color }: JobStatusCardProps) {
  const colors = {
    blue: "bg-blue-100 text-blue-700",
    green: "bg-green-100 text-green-700",
    red: "bg-red-100 text-red-700",
  };

  return (
    <div className={`p-6 rounded-2xl shadow-sm ${colors[color]}`}>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-3xl font-bold">{count}</p>
    </div>
  );
}
