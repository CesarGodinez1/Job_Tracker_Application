import { google } from "googleapis";
import { db } from "@/lib/db";

export function newOAuth2() {
  const client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID!,
    process.env.GOOGLE_CLIENT_SECRET!,
    // NextAuth handles the full OAuth flow; the redirect here is unused for refreshes,
    // but Google client wants one. Using your NextAuth callback is fine:
    `${process.env.NEXTAUTH_URL}/api/auth/callback/google`
  );
  return client;
}

/**
 * Returns an authenticated Gmail client for the given user
 * (using tokens saved by NextAuth in the Account table).
 * Also persists refreshed tokens back to the DB.
 */
export async function getGmailForUser(userId: string) {
  const account = await db.account.findFirst({
    where: { userId, provider: "google" },
    select: {
      id: true,
      access_token: true,
      refresh_token: true,
      expires_at: true,
      scope: true,
      token_type: true,
      session_state: true,
    },
  });

  if (!account?.refresh_token) {
    throw new Error("No Google account linked (refresh_token missing).");
  }

  const oauth2 = newOAuth2();
  oauth2.setCredentials({
    access_token: account.access_token ?? undefined,
    refresh_token: account.refresh_token ?? undefined,
    expiry_date: account.expires_at ? account.expires_at * 1000 : undefined,
    token_type: account.token_type ?? undefined,
    scope: account.scope ?? undefined,
  });

  // When Google refreshes tokens, save them back to Prisma.
  oauth2.on("tokens", async (tokens) => {
    await db.account.update({
      where: { id: account.id },
      data: {
        access_token: tokens.access_token ?? account.access_token,
        refresh_token: tokens.refresh_token ?? account.refresh_token,
        expires_at: tokens.expiry_date
          ? Math.floor(tokens.expiry_date / 1000)
          : account.expires_at,
        token_type: tokens.token_type ?? account.token_type,
        scope: tokens.scope ?? account.scope,
      },
    });
  });

  const gmail = google.gmail({ version: "v1", auth: oauth2 });
  return gmail;
}