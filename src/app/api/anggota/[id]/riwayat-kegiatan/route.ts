import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// keperluan testing (nanti dihapus)
// import { getSessionOrToken } from "@/lib/getSessionOrToken";

// handler untuk lihat riwayat partisipasi kegiatan anggota
export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
    // keperluan testing (nanti dihapus)
    // const session = await getSessionOrToken(req);
    // console.log("SESSION DEBUG:", session);

    // session yang asli (nanti uncomment)
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role === "USER_SUPERADMIN") {
        return NextResponse.json({ message: "Unauthorized: Only 'Kwarcab/Kwaran/Gusdep' users can retrieve data" }, { status: 403 });
    }

    // id anggota dari parameter url
    const { id } = await context.params;

    try {
      const kegiatan = await prisma.partisipan.findMany({
        where: { anggotaId: id },
        select: {
          kegiatan: {
            select: {
              id_kegiatan: true,
              nama_kegiatan: true,
              lokasi: true,
              tanggal: true,
              tingkat_kegiatan: true,
            },
          },
        },
      });
  
      return NextResponse.json(kegiatan.map(p => p.kegiatan));
    } catch (err) {
      console.error(err);
      return NextResponse.json({ message: "Error fetching kegiatan" }, { status: 500 });
    }
  }
  