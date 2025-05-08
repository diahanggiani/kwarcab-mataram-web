import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// keperluan testing (nanti dihapus)
// import { getSessionOrToken } from "@/lib/getSessionOrToken";
import { getGusdepKodeByRegion } from "@/lib/helpers/getGusdep";

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
    type chartItem = {
      label: string;
      value: number;
    };

    let result: chartItem[] = [];

    if (session.user.role === "USER_KWARCAB") {
      if (!session.user.kode_kwarcab) {
        return NextResponse.json(
          { message: "Missing kwarcab code in session" },
          { status: 400 }
        );
      }

      // ambil semua gusdep di bawah kwaran-kwaran tersebut
      const kodeGusdepList = await getGusdepKodeByRegion(
        session.user.kode_kwarcab,
        false
      );

      // ambil semua kwaran di bawah kwarcab
      const kwaranList = await prisma.kwaran.findMany({
        where: { kwarcabKode: session.user.kode_kwarcab },
        select: { kode_kwaran: true },
      });
      const kodeKwaranList = kwaranList.map((k) => k.kode_kwaran);

      // total kegiatan dari gusdep
      const totalFromGusdep = await prisma.kegiatan.count({
        where: { gusdepKode: { in: kodeGusdepList } },
      });

      // total kegiatan dari kwaran
      const totalFromKwaran = await prisma.kegiatan.count({
        where: { kwaranKode: { in: kodeKwaranList } },
      });

      result = [
        { label: "Total kegiatan seluruh kwaran", value: totalFromKwaran },
        { label: "Total kegiatan seluruh gugus depan", value: totalFromGusdep },
      ];
    } else if (session.user.role === "USER_KWARAN") {
      if (!session.user.kode_kwaran) {
        return NextResponse.json(
          { message: "Missing kwaran code in session" },
          { status: 400 }
        );
      }

      // ambil semua gusdep di bawah kwaran
      const kodeGusdepList = await getGusdepKodeByRegion(
        session.user.kode_kwaran,
        true
      );

      // total kegiatan dari semua gusdep
      const total = await prisma.kegiatan.count({
        where: { gusdepKode: { in: kodeGusdepList } },
      });

      result = [{ label: "Total kegiatan seluruh gugus depan", value: total }];
    } else if (session.user.role === "USER_GUSDEP") {
      const count = await prisma.kegiatan.count({
        where: { gusdepKode: session.user.kode_gusdep },
      });
      result = [{ label: "Total Kegiatan gugus depan", value: count }];
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching chart data:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
