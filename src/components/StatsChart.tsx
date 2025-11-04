// src/components/StatsChart.tsx // have to install npm install recharts
"use client";

import React from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface StatsChartProps {
  jobs: {
    applied: number;
    interview: number;
    declined: number;
    offers: number;
  };
  chartType?: "bar" | "line" | "pie";
}

export default function StatsChart({ jobs, chartType ="bar" }: StatsChartProps) {
  const data = [
    { name: "Applied", value: jobs.applied },
    { name: "Interview", value: jobs.interview },
    { name: "Declined", value: jobs.declined },
    { name: "Offers", value: jobs.offers },
  ];

  const colors = ["#3b82f6", "#10b981", "#ef4444", "#f59e0b"];

  return (
    <div className="bg-white p-6 rounded-2xl shadow-md">
      <ResponsiveContainer width="100%" height={350}>
        {chartType === "bar" && (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Legend />
            <Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]} />
          </BarChart>
        )}

        {chartType === "line" && (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#3b82f6"
              strokeWidth={3}
              dot={{ r: 5 }}
            />
          </LineChart>
        )}

        {chartType === "pie" && (
          <PieChart>
            <Tooltip />
            <Legend />
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={120}
              label
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
          </PieChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}