import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { db } from "@/lib/db";
import AddAppForm from "./AddAppForm";
import ApplicationsTable from "./ApplicationsTable";
import StatsBar from "./StatsBar";
import SyncGmailButton from "@/components/SyncGmailButton";
import ReconnectGoogleButton from "@/app/components/ReconnectGoogleButton";
import SignOutButton from "@/app/components/SignOutButton";
import AutoSyncOnMount from "@/app/components/AutoSyncOnMount";
import AutoSyncFromUrl from "@/app/components/AutoSyncFromUrl";

export default async function ApplicationsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/signin");

  const email = session.user?.email ?? "";
  const user = await db.user.findUnique({
    where: { email },
    select: { id: true, name: true },
  });
  if (!user) redirect("/signin");

  const apps = await db.application.findMany({
    where: { userId: user.id },
    include: {
      job: { select: { title: true, company: { select: { name: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  // --- counts for the summary bar ---
  const counts = {
    TOTAL: apps.length,
    SAVED: 0,
    APPLIED: 0,
    OA: 0,
    INTERVIEW: 0,
    OFFER: 0,
    REJECTED: 0,
    WITHDRAWN: 0,
  } as const as Record<
    "TOTAL" | "SAVED" | "APPLIED" | "OA" | "INTERVIEW" | "OFFER" | "REJECTED" | "WITHDRAWN",
    number
  >;

  for (const a of apps) {
    const k = a.status as keyof typeof counts;
    if (k in counts) counts[k] = (counts[k] ?? 0) + 1;
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-white via-white to-gray-50">
      <div className="mx-auto max-w-6xl p-6 space-y-6">
      <AutoSyncOnMount minutes={30} />
      <AutoSyncFromUrl />
      {/* Header with actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Application Tracker</h1>
          <p className="text-sm text-gray-600">Manage and monitor your job applications</p>
        </div>
        <div className="flex items-center gap-2">
          <SyncGmailButton />
          <ReconnectGoogleButton />
          <SignOutButton />
        </div>
      </div>

      <AddAppForm />

      {/* Stats summary bar */}
      <StatsBar counts={counts} />
      <div className="flex justify-end">
        <a
          href="/applications/stats"
          className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition"
        >
          View Full Stats
        </a>
      </div>

      {apps.length === 0 ? (
        <div className="rounded-2xl border border-black/5 bg-white/80 p-8 text-center text-sm text-gray-600 shadow-sm">
          No applications yet. Add your first one above.
        </div>
      ) : (
        <ApplicationsTable apps={apps} />
      )}
      </div>
    </div>
  );
}
