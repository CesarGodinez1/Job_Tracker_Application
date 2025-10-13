// src/app/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import JobStatusCard from "@/components/JobStatusCard";
import NotificationPanel from "@/components/NotificationPanel";
import StatsChart from "@/components/StatsChart";

export default function HomePage() {
  const [jobs, setJobs] = useState({
    applied: 5,
    interview: 2,
    declined: 1,
    Offers: 3,
  });

  const [notifications, setNotifications] = useState<string[]>([
    "Interview scheduled with TechCorp on Oct 18",
    "Application declined by DataWise",
    "New job posted: Frontend Developer at NovaSoft",
  ]);

  useEffect(() => {
    // Example: fetch data from your backend API
    // fetch("/api/jobs").then(res => res.json()).then(setJobs);
  }, []);

  return (
    <main className="flex flex-col gap-6 p-8 bg-gray-50 min-h-screen">
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800">Job Tracker Dashboard</h1>
        <p className="text-gray-500">Stay on top of your applications 📊</p>
      </header>

      {/* Job Tracking Cards */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <JobStatusCard title="Applied" count={jobs.applied} color="blue" />
        <JobStatusCard title="Interview" count={jobs.interview} color="green" />
        <JobStatusCard title="Declined" count={jobs.declined} color="red" />
        <JobStatusCard title="Offers" count={jobs.declined} color="blue" />
      </section>

      {/* Alerts & Notifications */}
      <section>
        <NotificationPanel notifications={notifications} />
      </section>

      {/* Statistics Visualization */}
      <section>
        <h2 className="text-xl font-semibold mb-3">Application Statistics</h2>
        <StatsChart jobs={jobs} />
      </section>
    </main>
  );
}
