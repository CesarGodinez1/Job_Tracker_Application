"use client";

import React, { useState } from "react";
import StatsChart from "@/components/StatsChart";

export default function StatisticsPage() {
  const [chartType, setChartType] = useState<"bar" | "line" | "pie">("bar");

  const jobs = {
    applied: 15,
    interview: 8,
    declined: 3,
    offers: 2,
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Job Statistics</h1>

        <select
          value={chartType}
          onChange={(e) =>
            setChartType(e.target.value as "bar" | "line" | "pie")
          }
          className="border border-gray-300 rounded-md p-2"
        >
          <option value="bar">Bar Chart</option>
          <option value="line">Line Chart</option>
          <option value="pie">Pie Chart</option>
        </select>
      </div>

      {/*  Make sure to include chartType here */}
      <StatsChart jobs={jobs} chartType={chartType} />
    </div>
  );
}