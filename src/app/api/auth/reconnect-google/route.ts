import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.redirect(new URL("/signin", new URL(req.url).origin));
  }

  const user = await db.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!user) {
    return NextResponse.redirect(new URL("/signin", new URL(req.url).origin));
  }

  // Remove existing Google account tokens for this user
  await db.account.deleteMany({ where: { userId: user.id, provider: "google" } });

  // Redirect straight to Google sign-in with callback back to applications
  const origin = new URL(req.url).origin;
  const redirectUrl = new URL("/api/auth/signin/google", origin);
  redirectUrl.searchParams.set("callbackUrl", "/applications");
  return NextResponse.redirect(redirectUrl);
}
