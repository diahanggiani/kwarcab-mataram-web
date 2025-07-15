import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isValidEnum } from "@/lib/helpers/enumValidator";

// keperluan testing (nanti dihapus)
// import { getSessionOrToken } from "@/lib/getSessionOrToken";
// import { NextRequest } from "next/server";

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
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");

        const riwayat = await prisma.riwayatJenjang.findMany({
            where: { anggotaId: id },
            orderBy: { tgl_perubahan: "asc" },
            skip: (page - 1) * limit,
            take: limit
        });
  
        return NextResponse.json(riwayat);
    } catch (err) {
        console.error(err);
        return NextResponse.json({ message: "Error fetching riwayat jenjang" }, { status: 500 });
    }
}
  
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    // keperluan testing (nanti dihapus)
    // const session = await getSessionOrToken(new NextRequest(req));
    // console.log("SESSION DEBUG:", session);

    // session yang asli (nanti uncomment)
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "USER_GUSDEP") {
        return NextResponse.json({ message: "Unauthorized: Only 'Gugus Depan' users can add riwayat jenjang" }, { status: 403 });
    }

    const { id } = await params;
  
    try {
        const body = await req.json();
        const { jenjang_agt, tgl_perubahan } = body;

        if (!jenjang_agt || !tgl_perubahan ) {
            return NextResponse.json({ message: "All fields are required" }, { status: 400 });
        }
  
        if (!isValidEnum("JenjangAnggota", jenjang_agt)) {
            return NextResponse.json({ message: "Invalid jenjang" }, { status: 400 });
        }

        const newEntry = await prisma.riwayatJenjang.create({
            data: {
                anggotaId: id,
                jenjang_agt,
                tgl_perubahan: new Date(tgl_perubahan),
            },
        });
  
        return NextResponse.json(newEntry, { status: 201 });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ message: "Error adding riwayat jenjang" }, { status: 500 });
    }
}
