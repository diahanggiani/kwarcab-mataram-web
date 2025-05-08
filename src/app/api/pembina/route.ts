import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getGusdepKodeByRegion } from "@/lib/helpers/getGusdep";
import { isValidEnum } from "@/lib/helpers/enumValidator";

// keperluan testing (nanti dihapus)
// import { getSessionOrToken } from "@/lib/getSessionOrToken";

// handler untuk tambah data pembina oleh role gusdep
export async function POST (req: NextRequest) {
    // keperluan testing (nanti dihapus)
    // const session = await getSessionOrToken(req);
    // console.log("SESSION DEBUG:", session);

    // session yang asli (nanti uncomment)
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "USER_GUSDEP") {
        return NextResponse.json({ message: "Unauthorized: Only 'Gugus Depan' users can add mentor" }, { status: 403 });
    }

    try {
        const body = await req.json();
        const { nama_pbn, nta, tgl_lahir, alamat, gender, agama, jenjang_pbn } = body;

        if (!nama_pbn || !nta || !tgl_lahir || !alamat || !gender || !agama || !jenjang_pbn) {
            return NextResponse.json({ message: "All fields are required" }, { status: 400 });
        }

        // validasi enum
        if (!isValidEnum("Gender", gender)) {
            return NextResponse.json({ message: "Invalid gender" }, { status: 400 });
        }
        if (!isValidEnum("Agama", agama)) {
            return NextResponse.json({ message: "Invalid agama" }, { status: 400 });
        }
        if (!isValidEnum("JenjangPembina", jenjang_pbn)) {
            return NextResponse.json({ message: "Invalid jenjang anggota" }, { status: 400 });
        }

        const existingPembina = await prisma.pembina.findUnique({ where: { nta } });
        if (existingPembina) {
            return NextResponse.json({ message: "NTA already registered" }, { status: 400 });
        }

        if (!session.user.kode_gusdep) {
            throw new Error('Missing kwaran data in token');
        }

        const pembina = await prisma.pembina.create({
            data: {
                ...body, // object spread syntax: ambil semua properti dari objek body, dan masukkan ke dalam objek baru di situ (responsenya tetap sama)
                tgl_lahir: new Date(body.tgl_lahir),
                gusdepKode: session.user.kode_gusdep,
            },
        });

        return NextResponse.json({ message: "Mentor successfully added", pembina }, { status: 201 });
    } catch (error) {
        console.error("Error adding mentor:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}

// handler untuk lihat data pembina (all roles with access restrictions)
export async function GET(req: NextRequest) {
    // keperluan testing (nanti dihapus)
    // const session = await getSessionOrToken(req);
    // console.log("SESSION DEBUG:", session);

    // session yang asli (nanti uncomment)
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role === "USER_SUPERADMIN") {
        return NextResponse.json({ message: "Unauthorized: Only 'Kwarcab/Kwaran/Gusdep' users can retrieve mentors" }, { status: 403 });
    }
    
    try {
        // ambil kode_gusdep dari query string (jika ada)
        const { searchParams } = new URL(req.url);
        const kode_gusdep = searchParams.get("kode_gusdep");
        if (kode_gusdep) {
            let allowed = false;

            // Cek akses berdasarkan role
            if (session.user.role === "USER_GUSDEP") {
                allowed = session.user.kode_gusdep === kode_gusdep;
            } else if (session.user.role === "USER_KWARAN") {
                const gusdepKodeList = await getGusdepKodeByRegion(session.user.kode_kwaran!, true);
                allowed = gusdepKodeList.includes(kode_gusdep);
            } else if (session.user.role === "USER_KWARCAB") {
                const gusdepKodeList = await getGusdepKodeByRegion(session.user.kode_kwarcab!, false);
                allowed = gusdepKodeList.includes(kode_gusdep);
            }

            if (!allowed) {
                return NextResponse.json({ message: "Forbidden: Anda tidak punya akses ke gugus depan ini" }, { status: 403 });
            }

            // ambil anggota berdasarkan kode_gusdep
            const pembina = await prisma.pembina.findMany({
                where: { gusdepKode: kode_gusdep },
                include: { gugusDepan: { select: { nama_gusdep: true } } },
            });

            return NextResponse.json(pembina);
        }

        let pembina;

        // gugus depan hanya bisa melihat pembinanya sendiri
        if (session.user.role === "USER_GUSDEP") {
            pembina = await prisma.pembina.findMany({
                where: { gusdepKode: session.user.kode_gusdep },
                include: { gugusDepan: { select: { nama_gusdep: true } } },
            });

        // kwaran bisa melihat pembina dari gugus depan di bawah naungannya
        } else if (session.user.role === "USER_KWARAN") {
            if (!session.user.kode_kwaran) {
                return NextResponse.json({ message: "Kode kwaran tidak ditemukan di session" }, { status: 400 });
            }
            const gusdepKodeList = await getGusdepKodeByRegion(session.user.kode_kwaran, true);
            
            if (gusdepKodeList.length === 0) {
                console.log(`There are no Gugus Depan registered under Kwaran ${session.user.kode_kwaran}`);
                return NextResponse.json([]);
            }

            pembina = await prisma.pembina.findMany({
                where: { gusdepKode: { in: gusdepKodeList } },
                include: { gugusDepan: { select: { nama_gusdep: true } } },
            });

        // kwarcab bisa melihat pembina dari gugus depan di bawah naungannya
        } else if (session.user.role === "USER_KWARCAB") {
            if (!session.user.kode_kwarcab) {
                return NextResponse.json({ message: "Kode kwarcab tidak ditemukan di session" }, { status: 400 });
            }
            const gusdepKodeList = await getGusdepKodeByRegion(session.user.kode_kwarcab, false);
            
            if (gusdepKodeList.length === 0) {
                console.log(`There are no Gugus Depan registered under Kwarcab ${session.user.kode_kwarcab}`);
                return NextResponse.json([]);
            }
            
            pembina = await prisma.pembina.findMany({
                where: { gusdepKode: { in: gusdepKodeList } },
                include: { gugusDepan: { select: { nama_gusdep: true } } },
            });

        } else {
            return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
        }

        console.log(`Role: ${session.user.role} | Total mentors found: ${pembina.length}`);
        return NextResponse.json(pembina);
    } catch (error) {
        console.error("Error retrieving data:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}
