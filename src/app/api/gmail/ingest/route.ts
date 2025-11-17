import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { db } from "@/lib/db";
import type { ApplicationStatus } from "@prisma/client";
import { google, gmail_v1 } from "googleapis";
import { parseJobEmail } from "@/lib/emailParsers";

const STATUS_ORDER: ApplicationStatus[] = [
  "SAVED",
  "APPLIED",
  "OA",
  "INTERVIEW",
  "OFFER",
  "REJECTED",
  "WITHDRAWN",
];
const rank = (s: ApplicationStatus) => STATUS_ORDER.indexOf(s);

// ---- Google OAuth client using tokens from Prisma Account(row) ----
async function getGoogleClientForUser(userId: string) {
  const account = await db.account.findFirst({
    where: { userId, provider: "google" },
  });
  if (!account) throw new Error("No linked Google account.");
  if (!account.access_token && !account.refresh_token) {
    throw new Error("Missing Google tokens.");
  }

  const client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID!,
    process.env.GOOGLE_CLIENT_SECRET!
    // redirect URI not required for refresh/use here
  );

  client.setCredentials({
    access_token: account.access_token ?? undefined,
    refresh_token: account.refresh_token ?? undefined,
    expiry_date: account.expires_at ? account.expires_at * 1000 : undefined,
  });

  // Ensure access token is fresh
  await client.getAccessToken().catch(() => {
    throw new Error("Google token refresh failed; please re-connect Google.");
  });

  return client;
}

async function applyEventToApplications(opts: {
  userId: string;
  parsed: { status: ApplicationStatus; company?: string; position?: string };
  subject: string;
  force?: boolean;
  receivedAt: Date;
}) {
  const { userId, parsed, subject, force, receivedAt } = opts;

  if (!parsed.company) return { created: 0, updated: 0 };

  // --- Company: find or create by name (schema unique is name+location) ---
  let company = await db.company.findFirst({ where: { name: parsed.company } });
  if (!company) {
    company = await db.company.create({ data: { name: parsed.company } });
  }

  // --- Job: find or create by title+companyId (no unique in schema) ---
  const title = parsed.position ?? "Unknown Role";
  let job = await db.job.findFirst({ where: { title, companyId: company.id } });
  if (!job) {
    job = await db.job.create({ data: { title, companyId: company.id } });
  }

  const existing = await db.application.findFirst({
    where: { userId, jobId: job.id },
    select: { id: true, status: true },
  });

  if (!existing) {
    await db.application.create({
      data: {
        userId,
        jobId: job.id,
        status: parsed.status,
        createdAt: receivedAt,
        // --- If you have Activity model, keep this; else comment it out ---
        activities: {
          create: [{ kind: "EMAIL", details: `Detected ${parsed.status} from Gmail: ${subject}` }],
        } as any,
      },
    });
    return { created: 1, updated: 0 };
  }

  if (
    parsed.status !== existing.status &&
    (force || rank(parsed.status) > rank(existing.status))
  ) {
    const current = await db.application.findUnique({ where: { id: existing.id }, select: { createdAt: true } });
    const backfill = current && receivedAt < current.createdAt ? receivedAt : undefined;
    await db.application.update({
      where: { id: existing.id },
      data: {
        status: parsed.status,
        // If this email predates the current createdAt, backfill to earliest known
        ...(backfill ? { createdAt: backfill } : {}),
        activities: {
          create: [{ kind: "EMAIL", details: `Status updated to ${parsed.status} from Gmail: ${subject}` }],
        } as any,
      },
    });
    return { created: 0, updated: 1 };
  } else {
    // Optional activity log with no status change
    try {
      await db.activity.create({
        data: { applicationId: existing.id, kind: "EMAIL", details: `Email processed: ${subject}` },
      });
      // Also backfill createdAt if email predates it
      const cur = await db.application.findUnique({ where: { id: existing.id }, select: { createdAt: true } });
      if (cur && receivedAt < cur.createdAt) {
        await db.application.update({ where: { id: existing.id }, data: { createdAt: receivedAt } });
      }
    } catch {}
    return { created: 0, updated: 0 };
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const user = await db.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const { searchParams } = new URL(req.url);
    const force = searchParams.get("force") === "1";

    const client = await getGoogleClientForUser(user.id);
    const gmail = google.gmail({ version: "v1", auth: client });

    // Broader query but still focused on recruiting traffic.
    // Add common ATS sources and subject synonyms (Workday/BrassRing often use myworkday.com etc.)
    let q =
      'category:primary (subject:("thank you for applying" OR "application received" OR "application is in" OR "application submitted" OR "we received your application" OR assessment OR interview OR offer OR regret OR declined) OR from:(careers OR recruiting OR jobs OR donotreply OR noreply OR myworkday OR brassring))';
    if (!force) q += " newer_than:30d";

    const list = await gmail.users.messages.list({
      userId: "me",
      q,
      maxResults: 25,
    });

    const ids = (list.data.messages ?? []).map((m) => m.id!).filter(Boolean);

    let scanned = 0;
    let created = 0;
    let updated = 0;

    for (const id of ids) {
      // Skip if we've processed this gmailId and not forcing
      if (!force) {
        const seen = await db.emailEvent.findUnique({ where: { gmailId: id } });
        if (seen) continue;
      }

      const full = await gmail.users.messages.get({
        userId: "me",
        id,
        format: "full",
      });
      scanned++;

      const headers = full.data.payload?.headers ?? [];
      const subject = headers.find((h) => h.name?.toLowerCase() === "subject")?.value ?? "";
      const snippet = full.data.snippet ?? "";
      // Prefer internalDate (ms since epoch), fallback to Date header
      const receivedAt = (() => {
        const internal = full.data.internalDate ? Number(full.data.internalDate) : undefined;
        if (internal && !Number.isNaN(internal)) return new Date(internal);
        const dateHeader = headers.find((h) => h.name?.toLowerCase() === "date")?.value;
        const d = dateHeader ? new Date(dateHeader) : new Date();
        return d;
      })();

      // Parse to status/company/position (your custom function)
      const parsed = parseJobEmail(full.data as gmail_v1.Schema$Message);

      await db.emailEvent.upsert({
        where: { gmailId: id },
        update: {
          subject,
          snippet,
          detectedStatus: parsed?.status,
          detectedCompany: parsed?.company,
          detectedPosition: parsed?.position,
          processedAt: new Date(),
          userId: user.id,
        },
        create: {
          gmailId: id,
          userId: user.id,
          subject,
          snippet,
          detectedStatus: parsed?.status,
          detectedCompany: parsed?.company,
          detectedPosition: parsed?.position,
          processedAt: new Date(),
        },
      });

      if (parsed) {
        const res = await applyEventToApplications({
          userId: user.id,
          parsed,
          subject,
          receivedAt,
          force,
        });
        created += res.created;
        updated += res.updated;
      }
    }

    return NextResponse.json({ ok: true, scanned, created, updated });
  } catch (err: any) {
    console.error("Gmail ingest error:", err?.message ?? err);
    return NextResponse.json(
      { error: "Ingest failed", reason: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}
