"use client";

import Link from "next/link";

interface NotificationPanelProps {
  notifications: string[];
  clickable?: boolean;
}

export default function NotificationPanel({
  notifications,
  clickable = false,
}: NotificationPanelProps) {
  return (
    <div className="bg-white shadow-md rounded-2xl p-4">
      {notifications.length === 0 ? (
        <p className="text-gray-500">No notifications yet 🎉</p>
      ) : (
        <ul className="space-y-2">
          {notifications.map((note, index) =>
            clickable ? (
              <Link
                key={index}
                href="/alerts"
                className="block hover:bg-grey-50 rounded-lg transition"
              >
                <li className="border-l-4 border-blue-500 pl-2 text-gray-700">
                  {note}
                </li>
              </Link>
            ) : (
              <li
                key={index}
                className="border-l-4 border-blue-500 pl-2 text-gray-700"
              >
                {note}
              </li>
            )
          )}
        </ul>
      )}
    </div>
  );
}
