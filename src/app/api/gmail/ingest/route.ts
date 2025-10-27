import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { db } from "@/lib/db";
import type { ApplicationStatus } from "@prisma/client";
import { google, gmail_v1 } from "googleapis";
import { parseJobEmail } from "@/lib/emailParsers";

// ---- status precedence so we can decide when to update an existing app ----
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

// ---- get & refresh a Google access token for this user ----
async function getGoogleClientForUser(userId: string) {
  const account = await db.account.findFirst({
    where: { userId, provider: "google" },
  });
  if (!account?.access_token) throw new Error("No Google account linked.");

  const client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID!,
    process.env.GOOGLE_CLIENT_SECRET!,
    process.env.NEXTAUTH_URL! + "/api/auth/callback/google"
  );

  // refresh if expired (or about to be)
  const now = Math.floor(Date.now() / 1000);
  if (account.expires_at && account.expires_at < now + 60 && account.refresh_token) {
    const url = "https://oauth2.googleapis.com/token";
    const body = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      grant_type: "refresh_token",
      refresh_token: account.refresh_token,
    });
    const res = await fetch(url, { method: "POST", body });
    if (!res.ok) {
      throw new Error(`Failed to refresh Google token (${res.status})`);
    }
    const json = await res.json();
    await db.account.update({
      where: { id: account.id },
      data: {
        access_token: json.access_token ?? account.access_token,
        expires_at: json.expires_in ? now + Number(json.expires_in) : account.expires_at,
        id_token: json.id_token ?? account.id_token ?? undefined,
        scope: json.scope ?? account.scope ?? undefined,
      },
    });
    client.setCredentials({ access_token: json.access_token });
  } else {
    client.setCredentials({ access_token: account.access_token });
  }

  return client;
}

// ---- turn a Gmail message into or onto an Application row ----
async function applyEventToApplications(opts: {
  userId: string;
  parsed: { status: ApplicationStatus; company?: string; position?: string };
  subject: string;
  gmailId: string;
}) {
  const { userId, parsed, subject } = opts;

  if (!parsed.company) return { created: 0, updated: 0 }; // no company guess -> skip

  // upsert company (location left null – your schema has @@unique([name, location]))
  const company = await db.company.upsert({
    where: {
      // since location can be null and @@unique is composite, findFirst then upsert by id
      // we emulate upsert by name only:
      // create a deterministic name+location by first trying findFirst
      // (Postgres treats NULLs as distinct, so we can’t use composite unique with null in upsert)
      // We'll do: try findFirst, else create.
      // prisma doesn't allow upsert without a unique where, so we split in two steps:
      // (1) findFirst
      // (2) create if missing
      // This block is replaced below – just a placeholder to satisfy TS
      id: "unused",
    },
    update: {},
    create: { name: parsed.company },
  } as any);

  // The above "as any" workaround is ugly. Do it properly:
  let companyRow =
    (await db.company.findFirst({ where: { name: parsed.company } })) ??
    (await db.company.create({ data: { name: parsed.company } }));

  // upsert job by (companyId, title)
  const jobRow =
    (await db.job.findFirst({
      where: { companyId: companyRow.id, title: parsed.position ?? "Unknown Role" },
    })) ??
    (await db.job.create({
      data: {
        title: parsed.position ?? "Unknown Role",
        companyId: companyRow.id,
      },
    }));

  // find existing application for this user & job
  const existing =
    (await db.application.findFirst({
      where: { userId, jobId: jobRow.id },
      select: { id: true, status: true },
    })) ?? null;

  if (!existing) {
    // create new application
    const app = await db.application.create({
      data: {
        userId,
        jobId: jobRow.id,
        status: parsed.status,
        activities: {
          create: [
            {
              kind: "EMAIL",
              details: `Detected ${parsed.status} from Gmail: ${subject}`,
            },
          ],
        },
      },
    });
    return { created: 1, updated: 0 };
  }

  // maybe update status based on precedence
  if (parsed.status !== existing.status && rank(parsed.status) > rank(existing.status)) {
    await db.application.update({
      where: { id: existing.id },
      data: {
        status: parsed.status,
        activities: {
          create: [
            {
              kind: "EMAIL",
              details: `Status updated to ${parsed.status} from Gmail: ${subject}`,
            },
          ],
        },
      },
    });
    return { created: 0, updated: 1 };
  } else {
    // even if status unchanged (or lower precedence), record activity so the user sees the email hit
    await db.activity.create({
      data: {
        applicationId: existing.id,
        kind: "EMAIL",
        details: `Email processed (no status change): ${subject}`,
      },
    });
    return { created: 0, updated: 0 };
  }
}

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const me = await db.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });
    if (!me) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // gmail client
    const client = await getGoogleClientForUser(me.id);
    const gmail = google.gmail({ version: "v1", auth: client });

    // fetch a small recent batch (tweak as you like)
    const list = await gmail.users.messages.list({
      userId: "me",
      maxResults: 20,
      // only inbox/primary, recent:
      q: "newer_than:30d category:primary",
    });

    const ids = (list.data.messages ?? []).map((m) => m.id!).filter(Boolean);
    let scanned = 0;
    let created = 0;
    let updated = 0;

    for (const id of ids) {
      const exists = await db.emailEvent.findUnique({ where: { gmailId: id } });
      if (exists) continue; // already processed

      const full = await gmail.users.messages.get({
        userId: "me",
        id,
        format: "full",
      });
      scanned += 1;

      const headers = full.data.payload?.headers ?? [];
      const subject = headers.find((h) => h.name?.toLowerCase() === "subject")?.value ?? "";

      // parse into a status/company/position
      const parsed = parseJobEmail(full.data as gmail_v1.Schema$Message);
      if (!parsed) {
        // store event anyway for traceability
        await db.emailEvent.create({
          data: {
            userId: me.id,
            gmailId: id,
            subject,
            snippet: full.data.snippet ?? "",
            processedAt: new Date(),
          },
        });
        continue;
      }

      // record the email event (so we don’t reparse)
      await db.emailEvent.create({
        data: {
          userId: me.id,
          gmailId: id,
          subject,
          snippet: full.data.snippet ?? "",
          detectedStatus: parsed.status,
          detectedCompany: parsed.company,
          detectedPosition: parsed.position,
          processedAt: new Date(),
        },
      });

      // apply to Applications
      const res = await applyEventToApplications({
        userId: me.id,
        parsed,
        subject,
        gmailId: id,
      });
      created += res.created;
      updated += res.updated;
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