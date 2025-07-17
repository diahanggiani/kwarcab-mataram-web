import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// keperluan testing (nanti dihapus)
// import { getSessionOrToken } from "@/lib/getSessionOrToken";

export async function GET() {
// export async function GET(req: Request) {
    // keperluan testing (nanti dihapus)
    // const session = await getSessionOrToken(req);

    // session yang asli (nanti uncomment)
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "USER_KWARCAB") {
        return NextResponse.json({ message: "Unauthorized: Only 'Kwarcab' users can retrieve data" }, { status: 403 });
    }
    try {
        // const { searchParams } = new URL(req.url);

        // pagination
        // const page = parseInt(searchParams.get("page") || "1");
        // const limit = parseInt(searchParams.get("limit") || "10");

        const kodeKwarcab = session.user.kode_kwarcab;

        const listKwaran = await prisma.kwaran.findMany({
            where: {
                kwarcabKode: kodeKwarcab,
            },
            select: {
                kode_kwaran: true,
                nama_kwaran: true,
                alamat: true,
                foto_kwaran: true,
                kwarcab: {
                    select: {
                        nama_kwarcab: true,
                    },
                },
            },
            orderBy: { nama_kwaran: "asc" },
            // skip: (page - 1) * limit,
            // take: limit
        });

    return NextResponse.json(listKwaran);
  } catch (error) {
    console.error("Error fetching kwaran:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
