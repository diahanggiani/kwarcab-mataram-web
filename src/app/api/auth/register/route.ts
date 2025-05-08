import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { hash } from "bcrypt";
import { Role } from "@prisma/client";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { username, password } = body;

        // validasi input (field tidak boleh kosong)
        if (!username || !password) {
            return NextResponse.json({ message: 'All fields are required' }, { status: 400 });
        }

        // validasi format username (tidak boleh pakai spasi)
        const usernameRegex = /^\S+$/;
        if (!usernameRegex.test(username)) {
            return NextResponse.json({ message: 'Username cannot contain spaces' }, { status: 400 });
        }

        // validasi format password (minimal 8 karakter: setidaknya 1 huruf kecil (a-z), 1 huruf besar (A-Z), 1 angka (0-9), opsional: tambahkan simbol jika diinginkan)
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,}$/;
        if (!passwordRegex.test(password)) {
            return NextResponse.json({ message: 'Password must be at least 8 characters long, contain uppercase, lowercase letters, and numbers.' }, { status: 400 });
        }

        // cek username
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