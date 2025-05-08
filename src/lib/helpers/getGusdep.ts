import { prisma } from "@/lib/db";

// dapatkan daftar kode gugus depan berdasarkan kwaran/kwarcab
export async function getGusdepKodeByRegion(regionKode: string, isKwaran: boolean) {
    if (isKwaran) {
        // mendapatkan kode gugus depan berdasarkan kwaran
        const gusdepList = await prisma.gugusDepan.findMany({
            where: { kwaranKode: regionKode },
            select: { kode_gusdep: true },
        });
        return gusdepList.map(g => g.kode_gusdep);
    }

    // mendapatkan kode gugus depan berdasarkan kwarcab (mendapatkan semua kwaran di bawah kwarcab)
    const kwaranList = await prisma.kwaran.findMany({
        where: { kwarcabKode: regionKode },
        select: { kode_kwaran: true },
    });

    const kwaranKodeList = kwaranList.map(k => k.kode_kwaran);

    // mendapatkan semua gugus depan yang terkait dengan kwaran-kwaran tersebut
    const gusdepList = await prisma.gugusDepan.findMany({
        where: { kwaranKode: { in: kwaranKodeList } },
        select: { kode_gusdep: true },
    });

    return gusdepList.map(g => g.kode_gusdep);
}
