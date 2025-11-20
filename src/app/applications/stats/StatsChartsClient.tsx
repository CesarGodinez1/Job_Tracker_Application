"use client";

import { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
  LineChart, Line,
} from "recharts";

type Counts = Record<
  "SAVED" | "APPLIED" | "OA" | "INTERVIEW" | "OFFER" | "REJECTED" | "WITHDRAWN",
  number
>;

const STATUS_COLORS: Record<string, string> = {
  SAVED: "#6C757D",
  APPLIED: "#0D6EFD",
  OA: "#6610F2",
  INTERVIEW: "#198754",
  OFFER: "#FFC107",
  REJECTED: "#DC3545",
  WITHDRAWN: "#20C997",
};

export default function StatsChartsClient({ counts }: { counts: Counts }) {
  const [chart, setChart] = useState<"bar" | "pie" |"line">("bar");

  const data = Object.entries(counts).map(([key, value]) => ({
    name: key,
    value,
    fill: STATUS_COLORS[key],
  }));

  console.log("chart data:", data); // <= DEBUG OUTPUT

  return (
    <div className="space-y-6">
      <div>
        <label className="text-sm font-medium">Select Chart View</label>
        <select
          value={chart}
          onChange={(e) => setChart(e.target.value as "bar" | "pie")}
          className="ml-2 rounded-lg border p-2 bg-white shadow-sm"
        >
          <option value="bar">Bar Chart</option>
          <option value="pie">Pie Chart</option>
           <option value="line">line Chart</option>
        </select>
      </div>

      {chart === "bar" && (
        <div className="w-full min-h-[400px] h-96 rounded-xl border bg-white p-4 shadow">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                <XAxis dataKey="name" stroke="#555" />
                <YAxis stroke="#555" />
                <Tooltip />
                <Bar dataKey="value">
                 {data.map((entry, i) => (
                <Cell key={i} fill={entry.fill} />
                ))}
            </Bar>
        </BarChart>
        </ResponsiveContainer>
    </div>
    )}

      {chart === "pie" && (
        <div className="w-full min-h-[400px] h-96 rounded-xl border bg-white p-4 shadow">
            <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                innerRadius={60}
                outerRadius={120}
                paddingAngle={4}
              >
                {data.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {chart === "line" && (
        <div className="w-full min-h-[400px] h-96 rounded-xl border bg-white p-4 shadow">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <XAxis dataKey="name" stroke="#555" />
              <YAxis stroke="#555" />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="#00bbffff" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}