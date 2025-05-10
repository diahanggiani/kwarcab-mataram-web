import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// keperluan testing (nanti dihapus)
// import { getSessionOrToken } from "@/lib/getSessionOrToken";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    // keperluan testing (nanti dihapus)
    // const session = await getSessionOrToken(req);
    // console.log("SESSION DEBUG:", session);

    // session yang asli (nanti uncomment)
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role === "USER_SUPERADMIN") {
        return NextResponse.json({ message: "Unauthorized: Only 'Kwarcab/Kwaran/Gusdep' users can retrieve data" }, { status: 403 });
    }

    const { id } = await params;

    try {
      const { searchParams } = new URL(req.url);
      
      // pagination
      const page = parseInt(searchParams.get("page") || "1");  // default page is 1
      const limit = parseInt(searchParams.get("limit") || "10"); // default limit is 10

      const kegiatan = await prisma.partisipan.findMany({
        where: { anggotaId: id },
        orderBy: { kegiatan: { tanggal: "asc" } },
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
        skip: (page - 1) * limit,
        take: limit
      });
  
      return NextResponse.json(kegiatan.map(p => p.kegiatan));
    } catch (err) {
      console.error(err);
      return NextResponse.json({ message: "Error fetching kegiatan" }, { status: 500 });
    }
  }
  