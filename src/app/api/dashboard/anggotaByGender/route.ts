import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Prisma } from "@prisma/client";

// keperluan testing (nanti dihapus)
// import { getSessionOrToken } from "@/lib/getSessionOrToken";

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

    const anggota = await prisma.anggota.findMany({
      where: whereClause,
      select: {
        gender: true,
        // gusdepKode: true,
        // gugusDepan: {
        //   select: {
        //     kwaranKode: true
        //   }
        // }
        gugusDepan: {
          select: {
            nama_gusdep: true,
            kwaran: {
              select: {
                nama_kwaran: true,
              },
            },
          },
        },
      },
    });

    let data: Record<string, number> | Record<string, Record<string, number>> =
      {};
    // gender : jumlah | kwaran/gusdep -> gender -> jumlah

    if (session.user.role === "USER_GUSDEP") {
      // gender count only
      data = anggota.reduce((acc: Record<string, number>, item) => {
        acc[item.gender] = (acc[item.gender] || 0) + 1;
        return acc;
      }, {});
    } else if (session.user.role === "USER_KWARAN") {
      // group by gusdep → gender
      data = anggota.reduce(
        (acc: Record<string, Record<string, number>>, item) => {
          // const gd = item.gusdepKode;
          const namaGusdep = item.gugusDepan?.nama_gusdep || "Tidak diketahui";
          const gender = item.gender;

          // if (!acc[gd]) acc[gd] = {};
          // acc[gd][gender] = (acc[gd][gender] || 0) + 1;

          if (!acc[namaGusdep]) acc[namaGusdep] = {};
          acc[namaGusdep][gender] = (acc[namaGusdep][gender] || 0) + 1;

          return acc;
        },
        {}
      );
    } else if (session.user.role === "USER_KWARCAB") {
      // group by kwaran → gender
      data = anggota.reduce(
        (acc: Record<string, Record<string, number>>, item) => {
          // const kwaran = item.gugusDepan?.kwaranKode;
          const namaKwaran =
            item.gugusDepan?.kwaran?.nama_kwaran || "Tidak diketahui";
          const gender = item.gender;

          // if (!kwaran) return acc;
          // if (!acc[kwaran]) acc[kwaran] = {};
          // acc[kwaran][gender] = (acc[kwaran][gender] || 0) + 1;

          if (!acc[namaKwaran]) acc[namaKwaran] = {};
          acc[namaKwaran][gender] = (acc[namaKwaran][gender] || 0) + 1;

          return acc;
        },
        {}
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching chart data:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
