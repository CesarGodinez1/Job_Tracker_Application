"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();

  const navItems = [
    { name: "Home", path: "/" },
    { name: "Applications", path: "/application" },
    { name: "Statistics", path: "/statistics" },
    { name: "Sign In", path: "/signin" },
    //{ name: "Sign Up", path: "/signup" },
  ];

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 py-3 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-blue-600">JobTracker</h1>

        <ul className="flex space-x-6 text-gray-700 font-medium">
          {navItems.map((item) => (
            <li key={item.path}>
              <Link
                href={item.path}
                className={`hover:text-blue-600 transition-colors ${
                  pathname === item.path ? "text-blue-600 font-semibold" : ""
                }`}
              >
                {item.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}