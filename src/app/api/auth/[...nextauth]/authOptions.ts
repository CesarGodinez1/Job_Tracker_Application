import type { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
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
        Credentials({
            name: "Email and Password",
            credentials: {
                email: { label: "Email", type: "email" },
                pasword: { label: "Password", type: "password" },

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
    session: { strategy: "database" },
    pages: { signIn: "/signin" },

};
