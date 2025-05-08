import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// keperluan testing (nanti dihapus)
// import { getSessionOrToken } from "@/lib/getSessionOrToken";

export async function GET() {
  // keperluan testing (nanti dihapus)
  //   const session = await getSessionOrToken(req);
  //   console.log("SESSION DEBUG:", session);

  // session asli (nanti aktifkan kalau sudah siap)
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "USER_KWARCAB") {
    return NextResponse.json(
      { message: "Unauthorized: Only 'USER_KWARCAB' can access this data" },
      { status: 403 }
    );
  }

  try {
    const kwarcabKode = session.user.kode_kwarcab;

    // ambil semua gusdep sama nama kwaran-nya
    const gudepList = await prisma.gugusDepan.findMany({
      where: {
        kwaran: {
          kwarcabKode: kwarcabKode,
        },
      },
      select: {
        kwaran: {
          select: {
            nama_kwaran: true,
          },
        },
      },
    });

    // hitung jumlah gusdep per kwaran
    const countByKwaran: Record<string, number> = {};
    for (const item of gudepList) {
      const nama = item.kwaran?.nama_kwaran ?? "Tidak diketahui";
      countByKwaran[nama] = (countByKwaran[nama] || 0) + 1;
    }

    const result = Object.entries(countByKwaran).map(
      ([nama_kwaran, jumlahGudep]) => ({
        nama_kwaran,
        jumlahGudep,
      })
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Gagal ambil data jumlah naungan:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
