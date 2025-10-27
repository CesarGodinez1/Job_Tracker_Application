import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { db } from "@/lib/db";
import AddAppForm from "./AddAppForm";
import ApplicationsTable from "./ApplicationsTable";
import StatsBar from "./StatsBar";
import SyncGmailButton from "@/components/SyncGmailButton";

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
    <div className="p-6 space-y-6">
      {/* Header with Sync Gmail button */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Applications</h1>
        <SyncGmailButton />
      </div>

      <AddAppForm />

      {/* Stats summary bar */}
      <StatsBar counts={counts} />

      {apps.length === 0 ? (
        <p className="text-sm opacity-80">No applications yet.</p>
      ) : (
        <ApplicationsTable apps={apps} />
      )}
    </div>
  );
}