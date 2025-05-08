import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Tingkat } from "@prisma/client";

// keperluan testing (nanti dihapus)
// import { getSessionOrToken } from "@/lib/getSessionOrToken";

export async function GET() {
  // keperluan testing (nanti dihapus)
//   const session = await getSessionOrToken(req);
//   console.log("SESSION DEBUG:", session);

  // session yang asli (nanti uncomment)
  const session = await getServerSession(authOptions);

  if (
    !session ||
    !["USER_KWARCAB", "USER_KWARAN"].includes(session.user.role)
  ) {
    return NextResponse.json(
      {
        message:
          "Unauthorized: Only 'Kwaran' & 'Kwarcab' users can access this data",
      },
      { status: 403 }
    );
  }

  try {
    const result = {
      kegiatan_gusdep: { SIAGA: 0, PENGGALANG: 0, PENEGAK: 0, PANDEGA: 0 },
      kegiatan_kwaran: { SIAGA: 0, PENGGALANG: 0, PENEGAK: 0, PANDEGA: 0 },
    };

    let kegiatanList: {
      tingkat_kegiatan: Tingkat | null;
      gusdepKode: string | null;
      kwaranKode: string | null;
    }[] = [];

    if (session.user.role === "USER_KWARAN") {
      kegiatanList = await prisma.kegiatan.findMany({
        where: {
          OR: [
            { gugusDepan: { kwaranKode: session.user.kode_kwaran } },
            { kwaranKode: session.user.kode_kwaran },
          ],
        },
        select: {
          tingkat_kegiatan: true,
          gusdepKode: true,
          kwaranKode: true,
        },
      });
    } else if (session.user.role === "USER_KWARCAB") {
      const kwaranList = await prisma.kwaran.findMany({
        where: { kwarcabKode: session.user.kode_kwarcab },
        select: { kode_kwaran: true },
      });
      const kodeKwaranList = kwaranList.map((k) => k.kode_kwaran);

      const gusdepList = await prisma.gugusDepan.findMany({
        where: { kwaranKode: { in: kodeKwaranList } },
        select: { kode_gusdep: true },
      });
      const kodeGusdepList = gusdepList.map((g) => g.kode_gusdep);

      kegiatanList = await prisma.kegiatan.findMany({
        where: {
          OR: [
            { gusdepKode: { in: kodeGusdepList } },
            { kwaranKode: { in: kodeKwaranList } },
          ],
        },
        select: {
          tingkat_kegiatan: true,
          gusdepKode: true,
          kwaranKode: true,
        },
      });
    }

    for (const kegiatan of kegiatanList) {
      const jenjang = kegiatan.tingkat_kegiatan;
      if (!jenjang) continue;

      if (kegiatan.gusdepKode) {
        result.kegiatan_gusdep[jenjang]++;
      } else if (kegiatan.kwaranKode) {
        result.kegiatan_kwaran[jenjang]++;
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching kegiatan per jenjang:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
