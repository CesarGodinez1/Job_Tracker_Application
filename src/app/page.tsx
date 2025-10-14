// src/app/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import JobStatusCard from "@/components/JobStatusCard";
import NotificationPanel from "@/components/NotificationPanel";
import StatsChart from "@/components/StatsChart";
import Link from "next/link";

export default function HomePage() {
  const [jobs, setJobs] = useState({
    applied: 5,
    interview: 2,
    declined: 1,
    offers: 1,
  });
  const [notifications] = useState<string[]>([
    "Interview scheduled with Google on Oct 18",
    "Application declined by Mircosoft",
    "New job posted: Frontend Developer at Meta",
    "Recruiter message from McDonalds",
    "Follow-up email sent to OpenAI",
  ]);

  // Show only first 3 on homepage
  const recentNotifications = notifications.slice(0, 3);

  useEffect(() => {
    // Example: fetch data from your backend API
    // fetch("/api/jobs").then(res => res.json()).then(setJobs);
  }, []);

  return (
    <main className="flex flex-col gap-6 p-8 bg-gray-50 min-h-screen">
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800">Job Tracker Dashboard</h1>
      </header>

      {/* Job Tracking Cards */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <JobStatusCard title="Applied" count={jobs.applied} color="blue" />
        <JobStatusCard title="Interview" count={jobs.interview} color="purple" />
        <JobStatusCard title="Declined" count={jobs.declined} color="red" />
        <JobStatusCard title="Offers" count={jobs.offers} color="green" />
      </section>

      {/* Alerts & Notifications */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-semibold text-gray-800">Recent Alerts</h2>
          <Link
            href="/alerts"
            className="text-blue-600 hover:underline text-sm font-medium"
          >
            View All →
          </Link>
        </div>
        <NotificationPanel notifications={recentNotifications} clickable />
      </section>

      {/* Statistics Preview */}
      <section>
        <h2 className="text-xl font-semibold text-gray-800 mb-3">Application Statistics</h2>
        <StatsChart jobs={jobs} />
      </section>
    </main>
  );
  

}
