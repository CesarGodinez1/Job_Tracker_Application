"use client";
import { signOut } from "next-auth/react";

export default function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/signin" })}
      className="rounded-lg border px-3 py-2"
    >
      Sign out
    </button>
  );
}