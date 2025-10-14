// src/app/alerts/page.tsx
import React from "react";
import Link from "next/link";

export default function AlertsPage() {
  const allNotifications = [
    "Interview scheduled with TechCorp on Oct 18",
    "Application declined by DataWise",
    "New job posted: Frontend Developer at NovaSoft",
    "Recruiter message from BrightHire",
    "Follow-up email sent to InnovateX",
    "Offer received from NextGen Labs",
  ];

  return (
    <main className="p-8 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-4">All Alerts & Notifications</h1>

      <Link href="/" className="text-blue-600 hover:underline mb-4 inline-block">
        ← Back to Dashboard
      </Link>

      <div className="bg-white shadow-md rounded-2xl p-6 space-y-3">
        {allNotifications.map((note, index) => (
          <div
            key={index}
            className="border-l-4 border-blue-500 pl-3 py-1 text-gray-700"
          >
            {note}
          </div>
        ))}
      </div>
    </main>
  );
}
