import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcrypt";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// keperluan testing (nanti dihapus)
import { getSessionOrToken } from "@/lib/getSessionOrToken";

export async function POST(req: NextRequest) {
    // keperluan testing (nanti dihapus)
    // const session = await getSessionOrToken(req);
    // console.log("SESSION DEBUG:", session);

    // session yang asli (nanti uncomment)
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "USER_SUPERADMIN") {
        return NextResponse.json({ message: "Unauthorized: Only 'Superadmin' users can create account" }, { status: 403 });
    }

    try {
        const body = await req.json();
        const { username, password, role } = body;
        const nama = body.nama?.trim(), kode = body.kode?.trim(), kode_kwaran = body.kode_kwaran?.trim(), kode_kwarcab = body.kode_kwarcab?.trim();

        if (!username || !password || !role || !nama || !kode) {
            return NextResponse.json({ message: "All fields are required" }, { status: 400 });
        }

        if (!/^\S+$/.test(username)) {
            return NextResponse.json({ message: "Username cannot contain spaces" }, { status: 400 });
        }
        
        if (!/^\S+$/.test(kode)) {
          return NextResponse.json(
            { message: "Kode cannot contain spaces" },
            { status: 400 }
          );
        }

        if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,}$/.test(password)) {
            return NextResponse.json({
                message: "Password must be at least 8 characters long, contain uppercase, lowercase letters, and numbers."
            }, { status: 400 });
        }

        const existingUser = await prisma.user.findUnique({ where: { username } });
            if (existingUser) {
                return NextResponse.json({ message: "Username already exists" }, { status: 400 });
        }

        const hashedPassword = await hash(password, 10);
        const createdById = session.user.id;

        let newUser;

        // pembuatan berdasarkan role yang diminta
        if (role === "USER_KWARCAB") {
            const kode_kwarcab_baru = kode;
            if (!kode_kwarcab_baru) return NextResponse.json({ message: "Kode Kwarcab required" }, { status: 400 });

            const existingKodeKwarcab = await prisma.kwarcab.findUnique({ where: { kode_kwarcab: kode_kwarcab_baru } });
            if (existingKodeKwarcab) {
                return NextResponse.json({ message: "Kode Kwarcab already exists" }, { status: 400 });
            }

            const existingNamaKwarcab = await prisma.kwarcab.findUnique({ where: { nama_kwarcab: nama } });
            if (existingNamaKwarcab) {
                return NextResponse.json({ message: "Nama Kwarcab already exists" }, { status: 400 });
            }

            newUser = await prisma.user.create({
                data: {
                    username,
                    password: hashedPassword,
                    role,
                    createdById,
                    kwarcab: {
                        create: {
                            nama_kwarcab: nama,
                            kode_kwarcab: kode_kwarcab_baru,
                        }
                    }
                },
                select: {
                    id: true,
                    username: true,
                    role: true,
                    createdAt: true
                }
            });

        } else if (role === "USER_KWARAN") {
            if (!kode_kwarcab) return NextResponse.json({ message: "Kode Kwarcab required" }, { status: 400 });

            const parentKwarcab = await prisma.kwarcab.findUnique({ where: { kode_kwarcab } });
            if (!parentKwarcab) return NextResponse.json({ message: "Kode Kwarcab invalid" }, { status: 400 });

            const existingKodeKwaran = await prisma.kwaran.findUnique({ where: { kode_kwaran: kode } });
            if (existingKodeKwaran) {
                return NextResponse.json({ message: "Kode Kwaran already exists" }, { status: 400 });
            }

            const existingNamaKwaran = await prisma.kwaran.findUnique({ where: { nama_kwaran: nama } });
            if (existingNamaKwaran) {
                return NextResponse.json({ message: "Nama Kwarcab already exists" }, { status: 400 });
            }

            newUser = await prisma.user.create({
                data: {
                    username,
                    password: hashedPassword,
                    role,
                    createdById,
                    kwaran: {
                        create: {
                            nama_kwaran: nama,
                            kode_kwaran: kode,
                            kwarcab: {
                                connect: {
                                    kode_kwarcab
                                }
                            }
                        }
                    }
                },
                select: {
                    id: true,
                    username: true,
                    role: true,
                    createdAt: true
                }
            });

        } else if (role === "USER_GUSDEP") {
            if (!kode_kwarcab || !kode_kwaran) return NextResponse.json({ message: "Kode Kwarcab and Kwaran required" }, { status: 400 });

            const parentKwaran = await prisma.kwaran.findUnique({
                where: { kode_kwaran },
                include: { kwarcab: true }
            });
            
            if (!parentKwaran || parentKwaran.kwarcab?.kode_kwarcab !== kode_kwarcab) {
                return NextResponse.json({ message: "Relasi Kwarcab and Kwaran invalid" }, { status: 400 });
            }

            const existingKodeGusdep = await prisma.gugusDepan.findUnique({ where: { kode_gusdep: kode } });
            if (existingKodeGusdep) {
                return NextResponse.json({ message: "Kode Gugus Depan already exists" }, { status: 400 });
            }

            const existingNamaGusdep = await prisma.gugusDepan.findUnique({ where: { nama_gusdep: nama } });
            if (existingNamaGusdep) {
                return NextResponse.json({ message: "Nama Kwarcab already exists" }, { status: 400 });
            }

            newUser = await prisma.user.create({
                data: {
                    username,
                    password: hashedPassword,
                    role,
                    createdById,
                    gugusDepan: {
                        create: {
                            nama_gusdep: nama,
                            kode_gusdep: kode,
                            kwaran: {
                                connect: {
                                    kode_kwaran
                                }
                            }
                        }
                    }
                },
                select: {
                    id: true,
                    username: true,
                    role: true,
                    createdAt: true
                }
            });

        } else {
        return NextResponse.json({ message: "Role invalid" }, { status: 400 });
        }

        return NextResponse.json({ user: newUser, message: "User created successfully" }, { status: 201 });
    } catch (error) {
        console.error("Error creating user:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    // untuk keperluan testing (nanti dihapus)
    const session = await getSessionOrToken(req);
    console.log("SESSION DEBUG:", session);

    // session yang asli (nanti uncomment)
    // const session = await getServerSession(authOptions);
  
    if (!session || session.user.role !== "USER_SUPERADMIN") {
        return NextResponse.json({ message: "Unauthorized: Only 'Superadmin' users can retrieve accounts" }, { status: 403 });
    }
  
    try {
        const { searchParams } = new URL(req.url);

        // pagination
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");

        const users = await prisma.user.findMany({
            where: { 
                createdById: session.user.id,
                role: { in: ["USER_KWARCAB", "USER_KWARAN", "USER_GUSDEP"] } },
            select: {
                id: true,
                username: true,
                role: true,
                createdAt: true,
                kwarcab: {
                    select: {
                        nama_kwarcab: true,
                        kode_kwarcab: true
                    }
                },
                kwaran: {
                    select: {
                        nama_kwaran: true,
                        kode_kwaran: true,
                        kwarcab: {
                            select: {
                                kode_kwarcab: true
                            }
                        }
                    }
                },
                gugusDepan: {
                    select: {
                        nama_gusdep: true,
                        kode_gusdep: true,
                        kwaran: {
                            select: {
                                kode_kwaran: true,
                                kwarcab: {
                                    select: {
                                        kode_kwarcab: true
                                    }
                                }
                            }
                        }
                    }
                }
            },
            orderBy: { createdAt: "desc" },
            skip: (page - 1) * limit,
            take: limit
        });
  
        return NextResponse.json({ users });
    } catch (error) {
        console.error("Error fetching users:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}
