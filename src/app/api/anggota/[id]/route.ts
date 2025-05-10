import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isValidEnum } from "@/lib/helpers/enumValidator";

// keperluan testing (nanti dihapus)
// import { getSessionOrToken } from "@/lib/getSessionOrToken";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    // keperluan testing (nanti dihapus)
    // const session = await getSessionOrToken(req);
    // console.log("SESSION DEBUG:", session);

    // session yang asli (nanti uncomment)
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "USER_GUSDEP") {
        return NextResponse.json({ message: "Unauthorized: Only 'Gugus Depan' users edit add member" }, { status: 403 });
    }

    const { id } = await params;

    try {
        const body = await req.json();
        const user = session.user as { id: string; role: string; kode_gusdep: string };

        // ambil data anggota berdasarkan id
        const anggota = await prisma.anggota.findUnique({
            where: { id_anggota: id },
            select: { gusdepKode: true, nta: true }, // gusdepKode dan nta untuk validasi
        });

        if (!anggota) {
            return NextResponse.json({ message: "Member not found" }, { status: 404 });
        }

        // validasi apakah anggota berada di gugus depan yang sama dengan user yang sedang login
        if (anggota.gusdepKode !== user.kode_gusdep) {
            return NextResponse.json({ message: "You can only edit members from your own Gugus Depan" }, { status: 403 });
        }

        // validasi jika user mengganti nta, pastikan tidak ada duplikasi
        if (body.nta && body.nta !== anggota.nta) {
            const existingNTA = await prisma.anggota.findUnique({ where: { nta: body.nta } });
            if (existingNTA) {
                return NextResponse.json({ message: "NTA already registered" }, { status: 400 });
            }
        }

        const { gender, agama, status_agt } = body;
        
        if (gender && !isValidEnum("Gender", gender)) {
            return NextResponse.json({ message: "Invalid gender" }, { status: 400 });
        }

        if (agama && !isValidEnum("Agama", agama)) {
            return NextResponse.json({ message: "Invalid agama" }, { status: 400 });
        }
        
        if (status_agt && !isValidEnum("StatusKeaktifan", status_agt)) {
            return NextResponse.json({ message: "Invalid status keaktifan" }, { status: 400 });
        }

        // update data anggota hanya jika field ada dalam request body
        const updatedAnggota = await prisma.anggota.update({
            where: { id_anggota: id },
            data: {
                ...(body.nama_agt?.trim() && { nama_agt: body.nama_agt.trim() }),
                ...(body.nta?.trim() && { nta: body.nta.trim() }),
                ...(body.alamat?.trim() && { alamat: body.alamat.trim() }),
                ...(body.tgl_lahir && { tgl_lahir: new Date(body.tgl_lahir) }),
                ...(body.gender && { gender: body.gender }),
                ...(body.agama && { agama: body.agama }),
                ...(body.status_agt && { status_agt: body.status_agt }),
                ...(body.tahun_gabung && !isNaN(parseInt(body.tahun_gabung)) && { tahun_gabung: parseInt(body.tahun_gabung) }),
            },
        });

        return NextResponse.json({ message: "Member successfully updated", data: updatedAnggota }, { status: 200 });
    } catch (error) {
        console.error("Error adding data:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    // keperluan testing (nanti dihapus)
    // const session = await getSessionOrToken(req);
    // console.log("SESSION DEBUG:", session);

    // session yang asli (nanti uncomment)
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "USER_GUSDEP") {
        return NextResponse.json({ message: "Unauthorized: Only 'Gugus Depan' users can delete members" }, { status: 403 });
    }

    const user = session.user as { id: string; role: string; kode_gusdep: string };
    const { id } = await params;

    try {
        // ambil data anggota berdasarkan id
        const anggota = await prisma.anggota.findUnique({
            where: { id_anggota: id },
            select: { gusdepKode: true },
        });

        if (!anggota) {
            return NextResponse.json({ message: "Member not found" }, { status: 404 });
        }

        if (anggota.gusdepKode !== user.kode_gusdep) {
            return NextResponse.json({ message: "You can only delete members from your own Gugus Depan" }, { status: 403 });
        }

        // hapus anggota
        await prisma.anggota.delete({ where: { id_anggota: id } });

        return NextResponse.json({ message: "Member successfully deleted" }, { status: 200 });
    } catch (error) {
        console.error("DELETE error:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}
