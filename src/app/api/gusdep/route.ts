import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// keperluan testing (nanti dihapus)
// import { getSessionOrToken } from "@/lib/getSessionOrToken";

export async function GET(req: Request) {
  // keperluan testing (nanti dihapus)
  // const session = await getSessionOrToken(req);

  // session yang asli (nanti uncomment)
  const session = await getServerSession(authOptions);

  if (!session || !["USER_KWARAN", "USER_KWARCAB"].includes(session.user.role)) {
    return NextResponse.json({ message: "Unauthorized: Only 'Kwaran' & 'Kwarcab' users can view data" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);

    // pagination
    // const page = parseInt(searchParams.get("page") || "1");
    // const limit = parseInt(searchParams.get("limit") || "10");

    let kode_kwaran = searchParams.get("kode_kwaran");
    const searchQuery = searchParams.get("search") || undefined;

    // jika yang login adalah user kwarcab
    if (session.user.role === "USER_KWARCAB") {
        // ambil semua kode kwaran yang berada di bawah kwarcab
        const allowedKwaran = await prisma.kwaran.findMany({
          where: { kwarcabKode: session.user.kode_kwarcab },
          select: { kode_kwaran: true },
        });
        const allowedKode = allowedKwaran.map((k) => k.kode_kwaran);

        // kalo ga ada kode kwaran di query param (?kode_kwaran=...)
        if (!kode_kwaran) {
          // ambil semua gusdep yang ada di bawah kwaran-kwaran tersebut
          const gusdepList = await prisma.gugusDepan.findMany({
            where: {
              kwaranKode: { in: allowedKode },
              ...(searchQuery && {
                OR: [
                  { nama_gusdep: { contains: searchQuery, mode: "insensitive" } },
                  { alamat: { contains: searchQuery, mode: "insensitive" } },
                ],
              }),
            },
            select: {
              kode_gusdep: true,
              nama_gusdep: true,
              alamat: true,
              foto_gusdep: true,
              kwaran: { select: { nama_kwaran: true } },
            },
            orderBy: { nama_gusdep: "asc" },
            // skip: (page - 1) * limit,
            // take: limit
          });
        return NextResponse.json(gusdepList);
      }

      // kalo ada kode_kwaran di query param (?kode_kwaran=...) -> validasi dulu
      if (!allowedKode.includes(kode_kwaran)) {
        return NextResponse.json({ message: "Forbidden: Bukan kwaran di bawah naungan Anda" }, { status: 403 });
      }
    }

    // jika yang login adalah user kwaran
    if (session.user.role === "USER_KWARAN") {
      if (!kode_kwaran) {
        kode_kwaran = session.user.kode_kwaran ?? null;
      }

      if (!kode_kwaran || kode_kwaran !== session.user.kode_kwaran) {
        return NextResponse.json({ message: "Forbidden: Anda hanya bisa mengakses kwaran Anda sendiri" }, { status: 403 });
      }
    }

    if (!kode_kwaran) {
      return NextResponse.json({ message: "kode_kwaran in query param is required" }, { status: 400 });
    }

    const gusdepList = await prisma.gugusDepan.findMany({
      where: {
        kwaranKode: kode_kwaran,
        ...(searchQuery && {
          OR: [
            { nama_gusdep: { contains: searchQuery, mode: "insensitive" } },
            { alamat: { contains: searchQuery, mode: "insensitive" } },
          ],
        }),
      },
      select: {
        kode_gusdep: true,
        nama_gusdep: true,
        alamat: true,
        foto_gusdep: true,
        kwaran: { select: { nama_kwaran: true } },
      },
      orderBy: { nama_gusdep: "asc" },
      // skip: (page - 1) * limit,
      // take: limit
    });

    return NextResponse.json(gusdepList);
  } catch (error) {
    console.error("Error fetching gugus depan:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
