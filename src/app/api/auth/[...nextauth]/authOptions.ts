import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { db } from "@/lib/db";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db),

  providers: [
    // Google OAuth
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
      authorization: {
        params: {
          scope:
            "openid email profile https://www.googleapis.com/auth/gmail.readonly",
          access_type: "offline",
          // Force account chooser and consent so users can pick accounts
          prompt: "consent select_account", // ensures refresh_token is returned
        },
      },
    }),
  ],

  
  session: { strategy: "jwt" },

  callbacks: {
    // Explicitly link Google account to an existing user with same email
    async signIn({ user, account, profile }) {
      try {
        if (account?.provider === "google") {
          const email = (user?.email || (profile as any)?.email) as string | undefined;
          if (!email) return true;

          const existing = await db.user.findUnique({ where: { email } });
          if (existing) {
            const already = await db.account.findFirst({
              where: {
                userId: existing.id,
                provider: "google",
                providerAccountId: account.providerAccountId!,
              },
            });
            if (!already) {
              await db.account.create({
                data: {
                  userId: existing.id,
                  type: account.type!,
                  provider: "google",
                  providerAccountId: account.providerAccountId!,
                  access_token: account.access_token ?? null,
                  refresh_token: account.refresh_token ?? null,
                  expires_at: account.expires_at ?? null,
                  token_type: account.token_type ?? null,
                  scope: account.scope ?? null,
                  id_token: account.id_token ?? null,
                  session_state: (account as any).session_state ?? null,
                },
              });
            }
            // let the sign in continue using the linked account
            return true;
          }
        }
      } catch (e) {
        console.error("signIn linking error", e);
      }
      return true;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        // add id to session for easy access
        // @ts-expect-error - custom field
        session.user.id = token.sub;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) token.sub = user.id;
      return token;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
  pages: { signIn: "/signin" },
};
