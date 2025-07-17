import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getGusdepKodeByRegion } from "@/lib/helpers/getGusdep";
import { isValidEnum } from "@/lib/helpers/enumValidator";
import { generatePembinaWhereClause } from "@/lib/helpers/queryClause";
import { formatNta } from "@/lib/helpers/format";

// keperluan testing (nanti dihapus)
// import { getSessionOrToken } from "@/lib/getSessionOrToken";

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
        const { tgl_lahir, gender, agama, jenjang_pbn, no_telp } = body;
        const nama_pbn = body.nama_pbn?.trim(), alamat = body.alamat?.trim();
        const rawNta = body.nta?.replace(/\D/g, "");

        if (!nama_pbn || !rawNta || !tgl_lahir || !alamat || !gender || !agama || !jenjang_pbn || !no_telp) {
            return NextResponse.json({ message: "All fields are required" }, { status: 400 });
        }

        if (!isValidEnum("Gender", gender)) {
            return NextResponse.json({ message: "Invalid gender" }, { status: 400 });
        }

        if (!isValidEnum("Agama", agama)) {
            return NextResponse.json({ message: "Invalid agama" }, { status: 400 });
        }
        
        if (!isValidEnum("JenjangPembina", jenjang_pbn)) {
            return NextResponse.json({ message: "Invalid jenjang pembina" }, { status: 400 });
        }

        if (rawNta.length < 14 || rawNta.length > 16) {
            return NextResponse.json({ message: "NTA must be 14–16 digit numbers" }, { status: 400 });
        }
        
        // format nta bertitik (XXXX.XX.XXX.XXXXX)
        const formattedNta = formatNta(rawNta);

        const existingPembina = await prisma.pembina.findUnique({ where: { nta: formattedNta } });
        if (existingPembina) {
            return NextResponse.json({ message: "NTA already registered" }, { status: 409 });
        }

        // format nomor telepon
        if (no_telp && !/^[0-9]{1,15}$/.test(no_telp)) {
            return NextResponse.json({ message: "The phone number may only contain numbers and a max 15 digits." }, { status: 400 });
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
        const searchQuery = searchParams.get("search") || undefined;

        // pagination
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");

        let gusdepKodeList: string[] = [];

        if (session.user.role === "USER_GUSDEP") {
            if (!session.user.kode_gusdep) {
                return NextResponse.json({ message: "Kode gugus depan tidak ditemukan di session" }, { status: 400 });
            }
            // gugus depan hanya bisa melihat pembinanya sendiri
            gusdepKodeList = [session.user.kode_gusdep];

        } else if (session.user.role === "USER_KWARAN") {
            if (!session.user.kode_kwaran) {
                return NextResponse.json({ message: "Kode kwaran tidak ditemukan di session" }, { status: 400 });
            }
            // kwaran bisa melihat pembina dari gugus depan di bawah naungannya
            gusdepKodeList = await getGusdepKodeByRegion(session.user.kode_kwaran, true);
        
        } else if (session.user.role === "USER_KWARCAB") {
            if (!session.user.kode_kwarcab) {
                return NextResponse.json({ message: "Kode kwarcab tidak ditemukan di session" }, { status: 400 });
            }
            // kwarcab bisa melihat pembina dari gugus depan di bawah naungannya
            gusdepKodeList = await getGusdepKodeByRegion(session.user.kode_kwarcab, false);
        
        } else {
            return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
        }

        if (!gusdepKodeList.length) {
            console.log(`No Gugus Depan found for role: ${session.user.role}`);
            return NextResponse.json([]);
        }

        const allowedKode = kode_gusdep && gusdepKodeList.includes(kode_gusdep)
            ? kode_gusdep
            : undefined;

        const whereClause = generatePembinaWhereClause(
              allowedKode ? { gusdepKode: allowedKode } : { gusdepKode: { in: gusdepKodeList } },
              searchQuery
        );
        
            const pembina = await prisma.pembina.findMany({
              where: whereClause,
              orderBy: { nama_pbn: "asc" },
              include: {
                gugusDepan: {
                  select: { nama_gusdep: true },
                },
              },
              skip: (page - 1) * limit,
              take: limit
            });
        
            const result = pembina.map((pbn) => ({
              id_pembina: pbn.id_pembina,
              nama_pbn: pbn.nama_pbn,
              nta: pbn.nta,
              tgl_lahir: pbn.tgl_lahir,
              gender: pbn.gender,
              agama: pbn.agama,
              alamat: pbn.alamat,
              no_telp: pbn.no_telp,
              jenjang_pbn: pbn.jenjang_pbn,
              gugus_depan: pbn.gugusDepan?.nama_gusdep ?? null,
            }));
        
        console.log(`Role: ${session.user.role} | Total mentor found: ${result.length}`);
        return NextResponse.json(result);
    } catch (error) {
        console.error("Error retrieving data:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}
