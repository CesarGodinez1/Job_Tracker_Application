"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

type Counts = Record<
  "TOTAL" | "SAVED" | "APPLIED" | "OA" | "INTERVIEW" | "OFFER" | "REJECTED" | "WITHDRAWN",
  number
>;

export default function StatusBarGraph({ counts }: { counts: Counts }) {
  const data = [
    { name: "Saved", value: counts.SAVED },
    { name: "Applied", value: counts.APPLIED },
    { name: "OA", value: counts.OA },
    { name: "Interview", value: counts.INTERVIEW },
    { name: "Offer", value: counts.OFFER },
    { name: "Rejected", value: counts.REJECTED },
    { name: "Withdrawn", value: counts.WITHDRAWN },
  ];

  return (
    <div className="w-full rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold mb-4 text-gray-800">
        Application Status Breakdown
      </h2>

      <div className="w-full h-72">
        <ResponsiveContainer>
          <BarChart data={data}>
            <XAxis dataKey="name" stroke="#555" />
            <YAxis allowDecimals={false} stroke="#555" />
            <Tooltip
              contentStyle={{ borderRadius: "12px", border: "1px solid #eee" }}
            />
            <Bar dataKey="value" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
