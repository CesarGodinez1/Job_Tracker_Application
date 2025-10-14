// src/components/StatsChart.tsx // have to install npm install recharts
"use client";

import React from "react";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface StatsChartProps {
  jobs: {
    applied: number;
    interview: number;
    declined: number;
    offers: number;
  };
}

export default function StatsChart({ jobs }: StatsChartProps) {
  const data = [
    { name: "Applied", value: jobs.applied },
    { name: "Interview", value: jobs.interview },
    { name: "Declined", value: jobs.declined },
    { name: "Offers", value: jobs.offers },
  ];

  return (
    <div className="bg-white p-6 rounded-2xl shadow-md">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
