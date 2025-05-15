import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// keperluan testing (nanti dihapus)
// import { getSessionOrToken } from "@/lib/getSessionOrToken";
// import { NextRequest } from "next/server";

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string; riwayatId: string }> }) {
    // keperluan testing (nanti dihapus)
    // const session = await getSessionOrToken(new NextRequest(req));
    // console.log("SESSION DEBUG:", session);

    // session yang asli (nanti uncomment)
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "USER_GUSDEP") {
        return NextResponse.json({ message: "Unauthorized: Only 'Gugus Depan' users can delete riwayat jenjang" }, { status: 403 });
    }

    const user = session.user as { kode_gusdep: string };
    const { id: anggotaId, riwayatId } = await params;

  try {
    // memastikan bahwa anggota milik user gusdep yang sedang login
    const anggota = await prisma.anggota.findUnique({
      where: { id_anggota: anggotaId },
      select: { gusdepKode: true },
    });

    if (!anggota) {
      return NextResponse.json({ message: "Member not found" }, { status: 404 });
    }

    if (anggota.gusdepKode !== user.kode_gusdep) {
      return NextResponse.json({ message: "You do not have the right to delete this data" }, { status: 403 });
    }

    // validasi riwayat milik anggota yang dimaksud
    const riwayat = await prisma.riwayatJenjang.findUnique({
      where: { id_riwayat: riwayatId },
    });

    if (!riwayat || riwayat.anggotaId !== anggotaId) {
      return NextResponse.json({ message: "Riwayat jenjang not found or invalid" }, { status: 404 });
    }

    // hapus riwayat
    await prisma.riwayatJenjang.delete({
      where: { id_riwayat: riwayatId },
    });

    return NextResponse.json({ message: "Riwayat jenjang successfully deleted" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting data:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
