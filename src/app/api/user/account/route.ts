import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcrypt";
import { Role } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { formatKode } from "@/lib/helpers/format";
import { generateAkunWhereClause } from "@/lib/helpers/queryClause";


// keperluan testing (nanti dihapus)
// import { getSessionOrToken } from "@/lib/getSessionOrToken";

export async function POST(req: NextRequest) {
  // keperluan testing (nanti dihapus)
  //   const session = await getSessionOrToken(req);
  //   console.log("SESSION DEBUG:", session);

  // session yang asli (nanti uncomment)
  const session = await getServerSession(authOptions);

  if (!session || session.user.role === "USER_SUPERADMIN") {
    return NextResponse.json(
      {
        message:
          "Unauthorized: Only 'Kwarcab/Kwaran/Gusdep' users can create account",
      },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const { username, password, kode } = body;
    const nama = body.nama?.trim();

    if (!username || !password || !nama || !kode) {
      return NextResponse.json(
        { message: "All fields are required" },
        { status: 400 }
      );
    }

    const usernameRegex = /^\S+$/;
    if (!usernameRegex.test(username)) {
      return NextResponse.json(
        { message: "Username cannot contain spaces" },
        { status: 400 }
      );
    }

    const kodeRegex = /^\S+$/;
    if (!kodeRegex.test(kode)) {
      return NextResponse.json(
        { message: "Kode cannot contain spaces" },
        { status: 400 }
      );
    }

    let newRole: Role;

    // kwarcab bisa membuat user dengan role kwaran
    if (session.user.role === Role.USER_KWARCAB) {
      newRole = Role.USER_KWARAN;

      // kwaran bisa membuat user dengan role gusdep
    } else if (session.user.role === Role.USER_KWARAN) {
      newRole = Role.USER_GUSDEP;

      // gusdep tidak bisa membuat akun untuk dirinya sendiri ataupun akun untuk gusdep lain
    } else {
      return NextResponse.json(
        { message: "You are not allowed to create users" },
        { status: 403 }
      );
    }

    let formattedKode: string;
    try {
      formattedKode = formatKode(newRole, kode);
    } catch (err) {
      return NextResponse.json(
        { message: err instanceof Error ? err.message: "Invalid kode format" }, { status: 400 }
      );
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,}$/;
    if (!passwordRegex.test(password)) {
      return NextResponse.json(
        {
          message:
            "Password must be at least 8 characters long, contain uppercase, lowercase letters, and numbers.",
        },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({ where: { username } });
    if (existingUser) {
      return NextResponse.json(
        { message: "Username already exists" },
        { status: 400 }
      );
    }

    // cek apakah kode & nama sudah dipakai dalam entitas terkait
    let entityExists;
    if (newRole === "USER_GUSDEP") {
      entityExists = await prisma.gugusDepan.findFirst({
        where: { OR: [{ kode_gusdep: formattedKode }, { nama_gusdep: nama }] },
      });
    } else if (newRole === "USER_KWARAN") {
      entityExists = await prisma.kwaran.findFirst({
        where: { OR: [{ kode_kwaran: formattedKode }, { nama_kwaran: nama }] },
      });
    } else if (newRole === "USER_KWARCAB") {
      entityExists = await prisma.kwarcab.findFirst({
        where: { OR: [{ kode_kwarcab: formattedKode }, { nama_kwarcab: nama }] },
      });
    }
    if (entityExists) {
      return NextResponse.json(
        {
          message:
            "This code and name are already taken. Please use different values.",
        },
        { status: 400 }
      );
    }

    const hashedPassword = await hash(password, 10);

    // const newUser = await prisma.$transaction(async () => {
    //   const user = await prisma.user.create({
    const newUser = await prisma.$transaction(
      async (tx) => {
        const user = await tx.user.create({
          data: {
            username,
            password: hashedPassword,
            role: newRole,
            createdBy: {
              connect: { id: session.user.id },
            },
          },
        });

        if (newRole === Role.USER_GUSDEP) {
          if (!session.user.kode_kwaran) {
            throw new Error("Missing kwaran data in token");
          }
          // await prisma.gugusDepan.create({
          await tx.gugusDepan.create({
            data: {
              kode_gusdep: formattedKode,
              nama_gusdep: nama,
              kwaran: { connect: { kode_kwaran: session.user.kode_kwaran } }, // ambil kode kwaran dari token
              user: { connect: { id: user.id } },
            },
          });
        } else if (newRole === Role.USER_KWARAN) {
          if (!session.user.kode_kwarcab) {
            throw new Error("Missing kwarcab data in token");
          }
          // await prisma.kwaran.create({
          await tx.kwaran.create({
            data: {
              kode_kwaran: formattedKode,
              nama_kwaran: nama,
              kwarcab: { connect: { kode_kwarcab: session.user.kode_kwarcab } }, // ambil kode kwarcab dari token
              user: { connect: { id: user.id } },
            },
          });
        }
        return user;
      },
      {
        maxWait: 5000,
        timeout: 10000,
      }
    );

    return NextResponse.json(
      { user: newUser, message: "User created successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  // untuk keperluan testing (nanti dihapus)
  //   const session = await getSessionOrToken(req);
  //   console.log("SESSION DEBUG:", session);

  // session yang asli (nanti uncomment)
  const session = await getServerSession(authOptions);

  if (!session || session.user.role === "USER_SUPERADMIN") {
    return NextResponse.json(
      {
        message:
          "Unauthorized: Only 'Kwarcab/Kwaran/Gusdep' users can retrieve accounts",
      },
      { status: 403 }
    );
  }

  try {
    const { searchParams } = new URL(req.url);
    const searchQuery = searchParams.get("search") || undefined;

    // pagination
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    let accounts = [];

    if (session.user.role === Role.USER_KWARCAB) {
      const whereClause = generateAkunWhereClause(
        {
          role: Role.USER_KWARAN,
          createdById: session.user.id,
          kwaran: {
            kwarcab: {
              kode_kwarcab: session.user.kode_kwarcab,
            },
          },
        },
        searchQuery
      );

      accounts = await prisma.user.findMany({
        where: whereClause,
        select: {
          id: true,
          username: true,
          role: true,
          kwaran: {
            select: {
              kode_kwaran: true,
              nama_kwaran: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      });
    } else if (session.user.role === Role.USER_KWARAN) {
      const whereClause = generateAkunWhereClause(
        {
          role: Role.USER_GUSDEP,
          createdById: session.user.id,
          gugusDepan: {
            kwaran: {
              kode_kwaran: session.user.kode_kwaran,
            },
          },
        },
        searchQuery
      );

      accounts = await prisma.user.findMany({
        where: whereClause,
        select: {
          id: true,
          username: true,
          role: true,
          gugusDepan: {
            select: {
              kode_gusdep: true,
              nama_gusdep: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      });
    } else {
      return NextResponse.json(
        { message: "You are not allowed to view accounts" },
        { status: 403 }
      );
    }
    
    return NextResponse.json({ accounts });
  } catch (error) {
    console.error("Error getting accounts:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
