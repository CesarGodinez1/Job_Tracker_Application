import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "../../../lib/db";
import bcrypt from "bcryptjs";
import { error } from "console";


const RegisterSchema = z.object({
    name: z.string().min(1),
    email: z.string().email(),
    password: z.string().min(8, "Password must be at least 8 characters"),
})


export async function POST(req: Request) {
    try {
        const body = await req.json();
        const parsed = RegisterSchema.safeParse(body);
        if (!parsed.success){
            return NextResponse.json({error: parsed.error.flatten() }, { status: 400 });

        }

        const { name, email, password } = parsed.data;

        const exists = await db.user.findUnique({ where: { email } });
        if(exists) {
            return NextResponse.json({ error: "Email already registered" }, { status: 409 });

        }

        const passwordHash = await bcrypt.hash(password, 12);

        await db.user.create({
            data: { name, email, passwordHash },

        });

        return NextResponse.json({ ok: true }, { status: 201 });


    } catch (e){
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
