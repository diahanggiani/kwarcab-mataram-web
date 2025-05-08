import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Prisma } from "@prisma/client";

// keperluan testing (nanti dihapus)
// import { getSessionOrToken } from "@/lib/getSessionOrToken";

const jenjangGroups = {
  siaga: ["SIAGA_MULA", "SIAGA_BANTU", "SIAGA_TATA"],
  penggalang: ["PENGGALANG_RAMU", "PENGGALANG_RAKIT", "PENGGALANG_TERAP"],
  penegak: ["PENEGAK_BANTARA", "PENEGAK_LAKSANA"],
  pandega: ["PANDEGA"],
};

export async function GET() {
  // keperluan testing (nanti dihapus)
  // const session = await getSessionOrToken(req);
  // console.log("SESSION DEBUG:", session);

  // session yang asli (nanti uncomment)
  const session = await getServerSession(authOptions);

  if (!session || session.user.role === "USER_SUPERADMIN") {
    return NextResponse.json(
      {
        message:
          "Unauthorized: Only 'Kwarcab/Kwaran/Gusdep' users can retrieve data",
      },
      { status: 403 }
    );
  }

  try {
    const whereClause: Prisma.AnggotaWhereInput = {};

    // batasi wilayah berdasarkan role
    if (session.user.role === "USER_GUSDEP") {
      whereClause.gusdepKode = session.user.kode_gusdep;
    } else if (session.user.role === "USER_KWARAN") {
      whereClause.gugusDepan = { kwaranKode: session.user.kode_kwaran };
    } else if (session.user.role === "USER_KWARCAB") {
      whereClause.gugusDepan = {
        kwaran: { kwarcabKode: session.user.kode_kwarcab },
      };
    }

    // ambil daftar anggota dengan riwayat jenjang (latest)
    const anggotaList = await prisma.anggota.findMany({
      where: whereClause,
      select: {
        id_anggota: true,
        gender: true,
        RiwayatJenjang: {
          orderBy: { tgl_perubahan: "desc" },
          take: 1,
          select: { jenjang_agt: true },
        },
      },
    });

    // hasil yang akan dikembalikan
    const result: Record<string, { LAKI_LAKI: number; PEREMPUAN: number }> = {
      siaga: { LAKI_LAKI: 0, PEREMPUAN: 0 },
      penggalang: { LAKI_LAKI: 0, PEREMPUAN: 0 },
      penegak: { LAKI_LAKI: 0, PEREMPUAN: 0 },
      pandega: { LAKI_LAKI: 0, PEREMPUAN: 0 },
    };

    let total_anggota = 0;

    // looping lewat anggota dan hitung berdasarkan latest riwayat jenjang
    for (const anggota of anggotaList) {
      const latestJenjang = anggota.RiwayatJenjang[0]?.jenjang_agt;
      const gender = anggota.gender;

      if (!latestJenjang) continue; // skip anggota tanpa jenjang terbaru

      // kelompokkan anggota berdasarkan jenjang mereka
      for (const [group, jenjangList] of Object.entries(jenjangGroups)) {
        if (jenjangList.includes(latestJenjang)) {
          result[group][gender]++;
          total_anggota++;
          break;
        }
      }
    }

    return NextResponse.json({ ...result, total_anggota });
  } catch (error) {
    console.error("Error fetching chart data:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
