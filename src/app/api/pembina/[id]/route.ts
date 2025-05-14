import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isValidEnum } from "@/lib/helpers/enumValidator";

// keperluan testing (nanti dihapus)
// import { getSessionOrToken } from "@/lib/getSessionOrToken";

// handler untuk tambah data pembina oleh role gusdep
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    // keperluan testing (nanti dihapus)
    // const session = await getSessionOrToken(req);
    // console.log("SESSION DEBUG:", session);

    // session yang asli (nanti uncomment)
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "USER_GUSDEP") {
        return NextResponse.json({ message: "Unauthorized: Only 'Gugus Depan' users edit add mentor" }, { status: 403 });
    }

    const { id } = await params;
    
    try {
        const body = await req.json();
        const user = session.user as { id: string; role: string; kode_gusdep: string };

        // ambil data pembina berdasarkan id
        const pembina = await prisma.pembina.findUnique({
            where: { id_pembina: id },
            select: { gusdepKode: true, nta: true }, // gusdepKode dan nta untuk validasi
        });

        if (!pembina) {
            return NextResponse.json({ message: "Mentor not found" }, { status: 404 });
        }

        // validasi apakah pembina berada di gugus depan yang sama dengan user yang login
        if (pembina.gusdepKode !== user.kode_gusdep) {
            return NextResponse.json({ message: "You can only edit mentors from your own Gugus Depan" }, { status: 403 });
        }

        // validasi jika user mengganti nta, pastikan tidak ada duplikasi
        if (body.nta && body.nta !== pembina.nta) {
            const existingNTA = await prisma.pembina.findUnique({ where: { nta: body.nta } });
            if (existingNTA) {
                return NextResponse.json({ message: "NTA already registered" }, { status: 400 });
            }
        }

        const { gender, agama, jenjang_pbn } = body;

        if (gender && !isValidEnum("Gender", gender)) {
            return NextResponse.json({ message: "Invalid gender" }, { status: 400 });
        }

        if (agama && !isValidEnum("Agama", agama)) {
            return NextResponse.json({ message: "Invalid agama" }, { status: 400 });
        }
        
        if (jenjang_pbn && !isValidEnum("JenjangPembina", jenjang_pbn)) {
            return NextResponse.json({ message: "Invalid jenjang pembina" }, { status: 400 });
        }

        // update data pembina hanya jika field ada dalam request body
        const updatedPembina = await prisma.pembina.update({
            where: { id_pembina: id },
            data: {
                ...(body.nama_pbn?.trim() && { nama_pbn: body.nama_pbn.trim() }),
                ...(body.nta?.trim() && { nta: body.nta.trim() }),
                ...(body.tgl_lahir && { tgl_lahir: new Date(body.tgl_lahir) }),
                ...(body.alamat?.trim() && { alamat: body.alamat.trim() }),
                ...(body.gender && { gender: body.gender }),
                ...(body.agama && { agama: body.agama }),
                ...(body.jenjang_pbn && { jenjang_pbn: body.jenjang_pbn }),
            },
        });

        return NextResponse.json({ message: "Mentor successfully updated", data: updatedPembina }, { status: 200 });
    } catch (error) {
        console.error("Error updating data:", error);
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
        return NextResponse.json({ message: "Unauthorized: Only 'Gugus Depan' users can delete mentors" }, { status: 403 });
    }

    const user = session.user as { id: string; role: string; kode_gusdep: string };
    const { id } = await params;

    try {
        // ambil data pembina berdasarkan id
        const pembina = await prisma.pembina.findUnique({
            where: { id_pembina: id },
            select: { gusdepKode: true },
        });

        if (!pembina) {
            return NextResponse.json({ message: "Mentor not found" }, { status: 404 });
        }

        if (pembina.gusdepKode !== user.kode_gusdep) {
            return NextResponse.json({ message: "You can only delete mentors from your own Gugus Depan" }, { status: 403 });
        }

        // hapus pembina
        await prisma.pembina.delete({ where: { id_pembina: id } });

        return NextResponse.json({ message: "Mentor successfully deleted" }, { status: 200 });
    } catch (error) {
        console.error("DELETE error:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}
