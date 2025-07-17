import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getGusdepKodeByRegion } from "@/lib/helpers/getGusdep";
import { isValidEnum } from "@/lib/helpers/enumValidator";
import { generateWhereClause } from "@/lib/helpers/queryClause";
import { formatNta } from "@/lib/helpers/format";

// keperluan testing (nanti dihapus)
// import { getSessionOrToken } from "@/lib/getSessionOrToken";

export async function POST(req: NextRequest) {
  // keperluan testing (nanti dihapus)
    // const session = await getSessionOrToken(req);
    // console.log("SESSION DEBUG:", session);

  // session yang asli (nanti uncomment)
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "USER_GUSDEP") {
    return NextResponse.json({ message: "Unauthorized: Only 'Gugus Depan' users can add member" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { tgl_lahir, gender, agama, status_agt, tahun_gabung, jenjang_agt, tgl_perubahan, no_telp } = body;
    // const nama_agt = body.nama_agt?.trim(), nta = body.nta?.trim(), alamat = body.alamat?.trim();
    const nama_agt = body.nama_agt?.trim(), alamat = body.alamat?.trim();
    const rawNta = body.nta?.replace(/\D/g, "");

    if (!nama_agt || !rawNta || !tgl_lahir || !alamat || !gender || !agama || !status_agt || !tahun_gabung || !jenjang_agt || !tgl_perubahan || !no_telp) {
      return NextResponse.json({ message: "All fields are required" }, { status: 400 });
    }

    if (!isValidEnum("Gender", gender)) {
      return NextResponse.json({ message: "Invalid gender" }, { status: 400 });
    }

    if (!isValidEnum("Agama", agama)) {
      return NextResponse.json({ message: "Invalid agama" }, { status: 400 });
    }

    if (!isValidEnum("StatusKeaktifan", status_agt)) {
      return NextResponse.json({ message: "Invalid status keaktifan" }, { status: 400 });
    }

    if (!isValidEnum("JenjangAnggota", jenjang_agt)) {
      return NextResponse.json({ message: "Invalid jenjang anggota" }, { status: 400 });
    }

    if (rawNta.length < 14 || rawNta.length > 16) {
      return NextResponse.json({ message: "NTA must be 14–16 digit numbers" }, { status: 400 });
    }

    // format nta bertitik (XXXX.XX.XXX.XXXXX)
    const formattedNta = formatNta(rawNta);

    const existingAnggota = await prisma.anggota.findUnique({ where: { nta: formattedNta } });
    if (existingAnggota) {
      return NextResponse.json({ message: "NTA already registered" }, { status: 409 });
    }

    // format nomor telepon
    if (no_telp && !/^[0-9]{1,15}$/.test(no_telp)) {
      return NextResponse.json({ message: "The phone number may only contain numbers and a max 15 digits." }, { status: 400 });
    }

    if (!session.user.kode_gusdep) {
      throw new Error("Missing kwaran data in token");
    }

    const anggota = await prisma.$transaction([
      prisma.anggota.create({
        data: {
          nama_agt,
          nta: formattedNta,
          alamat,
          tgl_lahir: new Date(tgl_lahir),
          gender,
          agama,
          no_telp,
          status_agt,
          tahun_gabung: parseInt(tahun_gabung),
          jenjang_agt,
          gusdepKode: session.user.kode_gusdep,
        },
      }),
      prisma.riwayatJenjang.create({
        data: {
          // anggota: { connect: { nta: nta.trim() } },
          anggota: { connect: { nta: formattedNta } },
          jenjang_agt,
          tgl_perubahan: new Date(tgl_perubahan),
        },
      }),
    ]);

    return NextResponse.json({ message: "Member successfully added", anggota }, { status: 201 });
  } catch (error) {
    console.error("Error adding member:", error);
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
    return NextResponse.json({ message: "Unauthorized: Only 'Kwarcab/Kwaran/Gusdep' users can retrieve members" }, { status: 403 });
  }

  try {
    // ambil kode_gusdep dari query string (jika ada)
    const { searchParams } = new URL(req.url);
    const kode_gusdep = searchParams.get("kode_gusdep");

    const searchQuery = searchParams.get("search") || undefined;
    const statusFilter = searchParams.get("status");

    // pagination
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    const validStatuses: ("AKTIF" | "NON_AKTIF" | "ALL")[] = ["AKTIF", "NON_AKTIF", "ALL"];
    const filterStatus: "AKTIF" | "NON_AKTIF" | undefined =
      validStatuses.includes(statusFilter as "AKTIF" | "NON_AKTIF" | "ALL")
        ? statusFilter === "ALL"
          ? undefined
          : (statusFilter as "AKTIF" | "NON_AKTIF")
        : undefined;

    let gusdepKodeList: string[] = [];
    
    if (session.user.role === "USER_GUSDEP") {
      if (!session.user.kode_gusdep) {
        return NextResponse.json({ message: "Kode gugus depan tidak ditemukan di session" }, { status: 404 });
      }
      // gugus depan hanya bisa melihat anggotanya sendiri
      gusdepKodeList = [session.user.kode_gusdep];

    } else if (session.user.role === "USER_KWARAN") {
      if (!session.user.kode_kwaran) {
        return NextResponse.json({ message: "Kode kwaran tidak ditemukan di session" }, { status: 404 });
      }
      // kwaran bisa melihat anggota dari gugus depan di bawah naungannya
      gusdepKodeList = await getGusdepKodeByRegion(session.user.kode_kwaran, true);
    
    } else if (session.user.role === "USER_KWARCAB") {
      if (!session.user.kode_kwarcab) {
        return NextResponse.json({ message: "Kode kwarcab tidak ditemukan di session" }, { status: 404 });
      }
      // kwarcab bisa melihat anggota dari gugus depan di bawah naungannya
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

    const whereClause = generateWhereClause(
      allowedKode ? { gusdepKode: allowedKode } : { gusdepKode: { in: gusdepKodeList } },
      filterStatus,
      searchQuery
    );

    const anggota = await prisma.anggota.findMany({
      where: whereClause,
      orderBy: { nama_agt: "asc" },
      include: {
        gugusDepan: {
          select: { nama_gusdep: true },
        },
      },
      skip: (page - 1) * limit,
      take: limit
    });

    const result = anggota.map((agt) => ({
      id_anggota: agt.id_anggota,
      nama_agt: agt.nama_agt,
      nta: agt.nta,
      tgl_lahir: agt.tgl_lahir,
      tahun_gabung: agt.tahun_gabung,
      gender: agt.gender,
      agama: agt.agama,
      alamat: agt.alamat,
      no_telp: agt.no_telp,
      status_agt: agt.status_agt,
      jenjang_agt: agt.jenjang_agt,
      gugus_depan: agt.gugusDepan?.nama_gusdep ?? null,
    }));

    console.log(`Role: ${session.user.role} | Total members found: ${result.length}`);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error retrieving data:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
