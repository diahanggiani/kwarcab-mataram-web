import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "USER_KWARCAB") {
    return NextResponse.json(
      { message: "Unauthorized: Only 'USER_KWARCAB' can access this data" },
      { status: 403 }
    );
  }

  const jenjangGroups = {
    SIAGA: ["SIAGA_MULA", "SIAGA_BANTU", "SIAGA_TATA"],
    PENGGALANG: ["PENGGALANG_RAMU", "PENGGALANG_RAKIT", "PENGGALANG_TERAP"],
    PENEGAK: ["PENEGAK_BANTARA", "PENEGAK_LAKSANA"],
    PANDEGA: ["PANDEGA"],
  };

  function getJenjangGroup(jenjang: string): keyof typeof jenjangGroups | null {
    for (const [group, list] of Object.entries(jenjangGroups)) {
      if (list.includes(jenjang)) return group as keyof typeof jenjangGroups;
    }
    return null;
  }

  try {
    const kwaranList = await prisma.kwaran.findMany({
      where: { kwarcabKode: session.user.kode_kwarcab },
      select: { kode_kwaran: true, nama_kwaran: true },
    });

    const result = await Promise.all(
      kwaranList.map(async (kwaran) => {
        const anggotaList = await prisma.anggota.findMany({
          where: {
            gugusDepan: { kwaranKode: kwaran.kode_kwaran },
          },
          select: {
            RiwayatJenjang: {
              orderBy: { tgl_perubahan: "desc" },
              take: 1,
              select: { jenjang_agt: true },
            },
          },
        });

        const countPerJenjang: Record<string, number> = {
          SIAGA: 0,
          PENGGALANG: 0,
          PENEGAK: 0,
          PANDEGA: 0,
        };

        for (const anggota of anggotaList) {
          const latestJenjang = anggota.RiwayatJenjang[0]?.jenjang_agt;
          if (!latestJenjang) continue;

          const jenjangBesar = getJenjangGroup(latestJenjang);
          if (jenjangBesar) countPerJenjang[jenjangBesar]++;
        }

        return {
          kwaran: kwaran.nama_kwaran,
          ...countPerJenjang,
        };
      })
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching anggota by jenjang per kwaran:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
