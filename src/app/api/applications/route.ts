import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { db } from "@/lib/db";
import { z } from "zod";

const ApplicationSchema = z.object({
  company: z.string().min(1),
  position: z.string().min(1),
  status: z.enum(["SAVED","APPLIED","OA","INTERVIEW","OFFER","REJECTED","WITHDRAWN"]).default("SAVED"),
  location: z.string().optional().nullable(),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = ApplicationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { company, position, status, location = null } = parsed.data;

    // current user
    const user = await db.user.findUnique({
      where: { email: session.user.email! },
      select: { id: true },
    });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // find-or-create company
    let comp = await db.company.findFirst({
      where: { name: company, OR: [{ location: location }, { location: null }] },
      select: { id: true },
    });
    if (!comp) {
      comp = await db.company.create({
        data: { name: company, location: location ?? null },
        select: { id: true },
      });
    }

    // create job
    const job = await db.job.create({
      data: { title: position, companyId: comp.id },
      select: { id: true },
    });

    // create application
    const app = await db.application.create({
      data: { userId: user.id, jobId: job.id, status },
      select: { id: true },
    });

    return NextResponse.json({ ok: true, id: app.id }, { status: 201 });
  } catch (e) {
    console.error("[applications POST] error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}