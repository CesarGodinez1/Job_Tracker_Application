import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { db } from "@/lib/db";
import { z } from "zod";

// ---- Validation ----
const StatusSchema = z.object({
  status: z.enum(["SAVED", "APPLIED", "OA", "INTERVIEW", "OFFER", "REJECTED", "WITHDRAWN"]),
});

// ---- Helpers ----
async function requireUserId() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return { error: "Unauthorized", status: 401 as const };

  const me = await db.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!me) return { error: "User not found", status: 404 as const };

  return { userId: me.id };
}

// ---- DELETE /api/applications/:id ----
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireUserId();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const app = await db.application.findUnique({
    where: { id: params.id },
    select: { userId: true },
  });
  if (!app) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (app.userId !== auth.userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await db.application.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}

// ---- PATCH /api/applications/:id (update status) ----
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireUserId();
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const app = await db.application.findUnique({
    where: { id: params.id },
    select: { userId: true },
  });
  if (!app) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (app.userId !== auth.userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = StatusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  await db.application.update({
    where: { id: params.id },
    data: { status: parsed.data.status },
  });

  return NextResponse.json({ ok: true });
}