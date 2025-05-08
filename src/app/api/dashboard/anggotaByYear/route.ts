import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Prisma } from '@prisma/client';

// keperluan testing (nanti dihapus)
// import { getSessionOrToken } from "@/lib/getSessionOrToken";

export async function GET() {
  // keperluan testing (nanti dihapus)
  // const session = await getSessionOrToken(req);
  // console.log("SESSION DEBUG:", session);

  // session yang asli (nanti uncomment)
    const session = await getServerSession(authOptions);

  if (!session || session.user.role === "USER_SUPERADMIN") {
    return NextResponse.json({ message: "Unauthorized: Only 'Kwarcab/Kwaran/Gusdep' users can retrieve data" }, { status: 403 });
  }

  try {
    const whereClause: Prisma.AnggotaWhereInput = {};

    // batasi wilayah berdasarkan role
    if (session.user.role === "USER_GUSDEP") {
      whereClause.gusdepKode = session.user.kode_gusdep;
    } else if (session.user.role === "USER_KWARAN") {
      whereClause.gugusDepan = { kwaranKode: session.user.kode_kwaran };
    } else if (session.user.role === "USER_KWARCAB") {
      whereClause.gugusDepan = { kwaran: { kwarcabKode: session.user.kode_kwarcab } };
    }

    const grouped = await prisma.anggota.groupBy({
      by: ["tahun_gabung"],
      _count: { id_anggota: true },
      orderBy: { tahun_gabung: "asc" },
      where: {
        tahun_gabung: { not: null }, // hanya data yang sudah punya tahun gabung
        ...whereClause, // tambahkan whereClause untuk pembatasan wilayah
      },
    });

    const data = grouped.map((item) => ({
      tahun: item.tahun_gabung,
      jumlah: item._count.id_anggota,
    }));

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching chart data:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
