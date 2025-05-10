import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcrypt";
import { Role } from "@prisma/client";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { username, password } = body;

        if (!username || !password) {
            return NextResponse.json({ message: 'All fields are required' }, { status: 400 });
        }

        const usernameRegex = /^\S+$/;
        if (!usernameRegex.test(username)) {
            return NextResponse.json({ message: 'Username cannot contain spaces' }, { status: 400 });
        }

        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,}$/;
        if (!passwordRegex.test(password)) {
            return NextResponse.json({ message: 'Password must be at least 8 characters long, contain uppercase, lowercase letters, and numbers.' }, { status: 400 });
        }

        const existingUserByUsername = await prisma.user.findUnique({
            where: { username: username }
        });
        if (existingUserByUsername) {
            return NextResponse.json({ message: "User with this username already exists" }, { status: 400 });
        }

        // simpan user baru dalam database
        const hashedPassword = await hash(password, 10);
        const newUser = await prisma.user.create({
            data: {
                username,
                password: hashedPassword,
                role: Role.USER_SUPERADMIN
            },
            select: {
                id: true,
                username: true,
                role: true,
                createdAt: true
            }
        })

        return NextResponse.json({ user: newUser, message: "User created succesfully" }, { status: 201 });
    } catch (error) {
        console.error("Error creating user:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}