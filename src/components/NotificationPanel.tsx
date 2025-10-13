// src/components/NotificationPanel.tsx
import React from "react";

interface NotificationPanelProps {
  notifications: string[];
}

export default function NotificationPanel({ notifications }: NotificationPanelProps) {
  return (
    <div className="bg-white shadow-md rounded-2xl p-4">
      <h2 className="text-xl font-semibold mb-2">Alerts & Notifications</h2>
      {notifications.length === 0 ? (
        <p className="text-gray-500">No notifications yet</p>
      ) : (
        <ul className="space-y-2">
          {notifications.map((note, index) => (
            <li key={index} className="border-l-4 border-blue-500 pl-2 text-gray-700">
              {note}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
