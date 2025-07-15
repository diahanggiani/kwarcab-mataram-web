import { Prisma } from "@prisma/client";

// filter & search anggota
export const generateWhereClause = (
    base: Prisma.AnggotaWhereInput,
    statusFilter?: "AKTIF" | "NON_AKTIF",
    searchQuery?: string
): Prisma.AnggotaWhereInput => ({
    ...base,
    ...(statusFilter ? { status_agt: statusFilter } : {}),
    // ...(searchQuery ? { nama_agt: { contains: searchQuery, mode: "insensitive" } } : {}),
    ...(searchQuery ? {
        OR: [
            { nama_agt: { contains: searchQuery, mode: "insensitive" } },
            { nta: { contains: searchQuery, mode: "insensitive" } },
        ],
        } : {}),
});

// search pembina
export const generatePembinaWhereClause = (
    base: Prisma.PembinaWhereInput,
    searchQuery?: string
): Prisma.PembinaWhereInput => ({
    ...base,
    ...(searchQuery ? { nama_pbn: { contains: searchQuery, mode: "insensitive" } } : {}),
});

// filter & search ajuan
export const generateAjuanWhereClause = (
    base: Prisma.AjuanWhereInput,
    statusFilter?: "DITERIMA" | "DITOLAK" | "MENUNGGU",
    searchQuery?: string
): Prisma.AjuanWhereInput => ({
    ...base,
    ...(statusFilter ? { status: statusFilter } : {}),
    ...(searchQuery ? { nama_agt: { contains: searchQuery, mode: "insensitive" } } : {}),
});

// search nama akun
export const generateAkunWhereClause = (
  base: Prisma.UserWhereInput,
  searchQuery?: string
): Prisma.UserWhereInput => ({
  ...base,
  ...(searchQuery
    ? {
        OR: [
          { kwaran: { nama_kwaran: { contains: searchQuery, mode: "insensitive" } } },
          { gugusDepan: { nama_gusdep: { contains: searchQuery, mode: "insensitive" } } },
        ],
      }
    : {}),
});
