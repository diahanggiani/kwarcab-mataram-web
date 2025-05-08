import { Prisma } from "@prisma/client";

// filter anggota
export const generateWhereClause = (
    base: Prisma.AnggotaWhereInput,
    statusFilter?: "AKTIF" | "NON_AKTIF",
    searchQuery?: string
): Prisma.AnggotaWhereInput => ({
    ...base,
    ...(statusFilter ? { status_agt: statusFilter } : {}),
    ...(searchQuery ? { nama_agt: { contains: searchQuery, mode: "insensitive" } } : {}),
});

// filter ajuan
export const generateAjuanWhereClause = (
    base: Prisma.AjuanWhereInput,
    statusFilter?: "DITERIMA" | "DITOLAK" | "MENUNGGU",
    searchQuery?: string
): Prisma.AjuanWhereInput => ({
    ...base,
    ...(statusFilter ? { status: statusFilter } : {}),
    ...(searchQuery ? { nama_ajuan: { contains: searchQuery, mode: "insensitive" } } : {}),
});