import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { db } from "@/lib/db";
import StatsChartsClient from "./StatsChartsClient";



export default async function StatsPage() {
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
    orderBy: { createdAt: "desc" },
  });

  const counts = {
    SAVED: 0,
    APPLIED: 0,
    OA: 0,
    INTERVIEW: 0,
    OFFER: 0,
    REJECTED: 0,
    WITHDRAWN: 0,
  };

  for (const a of apps) {
    const k = a.status as keyof typeof counts;
    if (k in counts) counts[k] += 1;
    }
    return (
    <div className="mx-auto max-w-5xl p-6 space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Statistics</h1>
      <p className="text-gray-600">Visual breakdown of your application statuses.</p>

      <StatsChartsClient counts={counts} />
    </div>
    );
}