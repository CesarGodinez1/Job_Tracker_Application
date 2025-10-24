import type { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { db } from "../../../../lib/db";
import bcrypt from "bcryptjs";
import { z } from "zod";

const Creds = z.object({
    email: z.string().email(),
    password: z.string().min(1),
});

export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(db),
    providers: [
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
        Credentials({
            name: "Email and Password",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },

            },

            async authorize(credentials) {
                const parsed = Creds.safeParse(credentials);
                if(!parsed.success) return null;

                const { email, password } = parsed.data;
                const user = await db.user.findUnique({ where: { email } });
                if (!user?.passwordHash) return null;

                const ok = await bcrypt.compare(password, user.passwordHash);
                if (!ok) return null;

                return {
                    id: user.id,
                    name: user.name ?? null,
                    email: user.email ?? undefined,
                    image: user.image ?? undefined,
                };
            },
        }),
    ],

    secret: process.env.NEXTAUTH_SECRET,
    session: { strategy: "jwt" }, // Temporarily switch to JWT to test
    pages: { 
        signIn: "/signin",
        error: "/signin" // Redirect errors back to signin
    },
    
    // Add callbacks to handle user creation and linking
    callbacks: {
        async signIn({ user, account, profile, email, credentials }) {
            console.log("SignIn callback:", { user, account, profile });
            
            // Allow Google OAuth sign-ins
            if (account?.provider === "google") {
                return true;
            }
            // Allow credentials sign-ins
            if (account?.provider === "credentials") {
                return true;
            }
            return false;
        },
        async session({ session, user }) {
            if (session.user) {
                (session.user as any).id = user.id;
            }
            return session;
        },
    },

    // Handle events for better user management
    events: {
        async createUser({ user }) {
            console.log("User created:", user);
        },
        async linkAccount({ user, account, profile }) {
            console.log("Account linked:", { user, account, profile });
        },
        async signIn({ user, account, profile, isNewUser }) {
            console.log("User signed in:", { user, account, profile, isNewUser });
        },
        async signOut({ token, session }) {
            console.log("User signed out:", { token, session });
        },
    },

    // Add error handling
    logger: {
        error(code, metadata) {
            console.error("NextAuth Error:", { code, metadata });
            if (code === 'OAUTH_CALLBACK_ERROR') {
                console.error("OAuth Callback Error Details:", {
                    error: (metadata as { error: Error }).error,
                    providerId: (metadata as unknown as { providerId: string }).providerId,
                    message: (metadata as { error: Error }).error?.message,
                    stack: (metadata as { error: Error }).error?.stack
                });
            }
        },
        warn(code) {
            console.warn("NextAuth Warning:", code);
        },
        debug(code, metadata) {
            console.log("NextAuth Debug:", { code, metadata });
        },
    },

    // Enable debug mode for development
    debug: process.env.NODE_ENV === "development",
};
