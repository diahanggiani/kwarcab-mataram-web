import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getGusdepKodeByRegion } from "@/lib/helpers/getGusdep";
import { isValidEnum } from "@/lib/helpers/enumValidator";
import { generateWhereClause } from "@/lib/helpers/queryClause";

// keperluan testing (nanti dihapus)
// import { getSessionOrToken } from "@/lib/getSessionOrToken";
import { Prisma } from "@prisma/client";

// handler untuk tambah data anggota oleh role gusdep
export async function POST(req: NextRequest) {
  // keperluan testing (nanti dihapus)
//   const session = await getSessionOrToken(req);
//   console.log("SESSION DEBUG:", session);

  // session yang asli (nanti uncomment)
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "USER_GUSDEP") {
    return NextResponse.json(
      { message: "Unauthorized: Only 'Gugus Depan' users can add member" },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const {
      tgl_lahir,
      gender,
      agama,
      status_agt,
      tahun_gabung,
      jenjang_agt,
      tgl_perubahan,
    } = body;
    const nama_agt = body.nama_agt?.trim(),
      nta = body.nta?.trim(),
      alamat = body.alamat?.trim();

    if (
      !nama_agt ||
      !nta ||
      !tgl_lahir ||
      !alamat ||
      !gender ||
      !agama ||
      !status_agt ||
      !tahun_gabung ||
      !jenjang_agt ||
      !tgl_perubahan
    ) {
      return NextResponse.json(
        { message: "All fields are required" },
        { status: 400 }
      );
    }

    if (!isValidEnum("Gender", gender)) {
      return NextResponse.json({ message: "Invalid gender" }, { status: 400 });
    }
    if (!isValidEnum("Agama", agama)) {
      return NextResponse.json({ message: "Invalid agama" }, { status: 400 });
    }
    if (!isValidEnum("StatusKeaktifan", status_agt)) {
      return NextResponse.json(
        { message: "Invalid status keaktifan" },
        { status: 400 }
      );
    }
    if (!isValidEnum("JenjangAnggota", jenjang_agt)) {
      return NextResponse.json(
        { message: "Invalid jenjang anggota" },
        { status: 400 }
      );
    }

    const existingAnggota = await prisma.anggota.findUnique({ where: { nta } });
    if (existingAnggota) {
      return NextResponse.json({ message: "NTA already registered" }, { status: 400 }
      );
    }

    if (!session.user.kode_gusdep) {
      throw new Error("Missing kwaran data in token");
    }

    const anggota = await prisma.$transaction([
      prisma.anggota.create({
        data: {
          nama_agt,
          nta,
          alamat,
          tgl_lahir: new Date(tgl_lahir),
          gender,
          agama,
          status_agt,
          tahun_gabung: parseInt(tahun_gabung),
          jenjang_agt,
          gusdepKode: session.user.kode_gusdep,
        },
      }),
      prisma.riwayatJenjang.create({
        data: {
          anggota: { connect: { nta: nta.trim() } },
          jenjang_agt,
          tgl_perubahan: new Date(tgl_perubahan),
        },
      }),
    ]);

    return NextResponse.json(
      { message: "Member successfully added", anggota }, { status: 201 }
    );
  } catch (error) {
    console.error("Error adding member:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 }
    );
  }
}

// handler untuk lihat data anggota (all roles with access restrictions)
export async function GET(req: NextRequest) {
  // keperluan testing (nanti dihapus)
//   const session = await getSessionOrToken(req);
//   console.log("SESSION DEBUG:", session);

  // session yang asli (nanti uncomment)
  const session = await getServerSession(authOptions);

  if (!session || session.user.role === "USER_SUPERADMIN") {
    return NextResponse.json(
      {
        message:
          "Unauthorized: Only 'Kwarcab/Kwaran/Gusdep' users can retrieve members",
      },
      { status: 403 }
    );
  }

  try {
    // ambil kode_gusdep dari query string (jika ada)
    const { searchParams } = new URL(req.url);
    const kode_gusdep = searchParams.get("kode_gusdep");

    const searchQuery = searchParams.get("search") || undefined;
    const statusFilter = searchParams.get("status");

    const validStatuses: ("AKTIF" | "NON_AKTIF" | "ALL")[] = [
      "AKTIF",
      "NON_AKTIF",
      "ALL",
    ];

    const filterStatus: "AKTIF" | "NON_AKTIF" | undefined =
      validStatuses.includes(statusFilter as "AKTIF" | "NON_AKTIF" | "ALL")
        ? statusFilter === "ALL"
          ? undefined
          : (statusFilter as "AKTIF" | "NON_AKTIF")
        : undefined;

    // tambahan
    const getAnggota = async (whereClause: Prisma.AnggotaWhereInput) => {
      const anggota = await prisma.anggota.findMany({
        where: whereClause,
        include: {
          RiwayatJenjang: {
            orderBy: { tgl_perubahan: "desc" },
            take: 1,
            select: { jenjang_agt: true },
          },
          gugusDepan: {
            select: { nama_gusdep: true },
          },
        },
      });

      // mapping untuk ambil jenjang terbaru dari RiwayatJenjang
      return anggota.map((agt) => ({
        id_anggota: agt.id_anggota,
        nama_agt: agt.nama_agt,
        nta: agt.nta,
        tgl_lahir: agt.tgl_lahir,
        tahun_gabung: agt.tahun_gabung,
        gender: agt.gender,
        agama: agt.agama,
        alamat: agt.alamat,
        status_agt: agt.status_agt,
        jenjang_agt:
          agt.RiwayatJenjang[0]?.jenjang_agt ?? agt.jenjang_agt ?? null,
        gugus_depan: agt.gugusDepan?.nama_gusdep ?? null,
      }));
    };
    // batas tambahan

    if (kode_gusdep) {
      let allowed = false;

      // cek akses berdasarkan role
      if (session.user.role === "USER_GUSDEP") {
        allowed = session.user.kode_gusdep === kode_gusdep;
      } else if (session.user.role === "USER_KWARAN") {
        const gusdepKodeList = await getGusdepKodeByRegion(
          session.user.kode_kwaran!,
          true
        );
        allowed = gusdepKodeList.includes(kode_gusdep);
      } else if (session.user.role === "USER_KWARCAB") {
        const gusdepKodeList = await getGusdepKodeByRegion(
          session.user.kode_kwarcab!,
          false
        );
        allowed = gusdepKodeList.includes(kode_gusdep);
      }

      if (!allowed) {
        return NextResponse.json(
          { message: "Forbidden: Anda tidak punya akses ke gugus depan ini" },
          { status: 403 }
        );
      }

      // bangun klausa where berdasarkan status dan query
      const whereClause = generateWhereClause(
        { gusdepKode: kode_gusdep },
        filterStatus,
        searchQuery
      );

      // perubahan
      const anggota = await getAnggota(whereClause);
      return NextResponse.json(anggota);
    }

    let anggota;

    // gugus depan hanya bisa melihat anggotanya sendiri
    if (session.user.role === "USER_GUSDEP") {
      const whereClause = generateWhereClause(
        { gusdepKode: session.user.kode_gusdep },
        filterStatus,
        searchQuery
      );
      anggota = await getAnggota(whereClause);

      // kwaran bisa melihat anggota dari gugus depan di bawah naungannya
    } else if (session.user.role === "USER_KWARAN") {
      if (!session.user.kode_kwaran) {
        return NextResponse.json(
          { message: "Kode kwaran tidak ditemukan di session" },
          { status: 400 }
        );
      }
      const gusdepKodeList = await getGusdepKodeByRegion(
        session.user.kode_kwaran,
        true
      );
      if (gusdepKodeList.length === 0) {
        console.log(
          `There are no Gugus Depan registered under Kwaran ${session.user.kode_kwaran}`
        );
        return NextResponse.json([]);
      }

      const whereClause = generateWhereClause(
        { gusdepKode: { in: gusdepKodeList } },
        filterStatus,
        searchQuery
      );
      anggota = await getAnggota(whereClause);

      // kwarcab bisa melihat anggota dari gugus depan di bawah naungannya
    } else if (session.user.role === "USER_KWARCAB") {
      if (!session.user.kode_kwarcab) {
        return NextResponse.json(
          { message: "Kode kwarcab tidak ditemukan di session" },
          { status: 400 }
        );
      }
      const gusdepKodeList = await getGusdepKodeByRegion(
        session.user.kode_kwarcab,
        false
      );
      if (gusdepKodeList.length === 0) {
        console.log(
          `There are no Gugus Depan registered under Kwarcab ${session.user.kode_kwarcab}`
        );
        return NextResponse.json([]);
      }

      const whereClause = generateWhereClause(
        { gusdepKode: { in: gusdepKodeList } },
        filterStatus,
        searchQuery
      );
      anggota = await getAnggota(whereClause);
    } else {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    console.log(
      `Role: ${session.user.role} | Total members found: ${anggota.length}`
    );
    return NextResponse.json(anggota);
  } catch (error) {
    console.error("Error retrieving data:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
