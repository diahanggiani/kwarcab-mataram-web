-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER_SUPERADMIN', 'USER_KWARCAB', 'USER_KWARAN', 'USER_GUSDEP');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('LAKI_LAKI', 'PEREMPUAN');

-- CreateEnum
CREATE TYPE "Agama" AS ENUM ('HINDU', 'KATOLIK', 'KRISTEN', 'ISLAM', 'BUDDHA', 'KONGHUCU');

-- CreateEnum
CREATE TYPE "StatusKeaktifan" AS ENUM ('AKTIF', 'NON_AKTIF');

-- CreateEnum
CREATE TYPE "JenjangAnggota" AS ENUM ('SIAGA_MULA', 'SIAGA_BANTU', 'SIAGA_TATA', 'PENGGALANG_RAMU', 'PENGGALANG_RAKIT', 'PENGGALANG_TERAP', 'PENEGAK_BANTARA', 'PENEGAK_LAKSANA', 'PANDEGA');

-- CreateEnum
CREATE TYPE "JenjangPembina" AS ENUM ('SIAGA', 'PENGGALANG', 'PENEGAK_PANDEGA');

-- CreateEnum
CREATE TYPE "Tingkat" AS ENUM ('SIAGA', 'PENGGALANG', 'PENEGAK', 'PANDEGA');

-- CreateEnum
CREATE TYPE "Status" AS ENUM ('DITERIMA', 'DITOLAK', 'MENUNGGU');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Kwarcab" (
    "kode_kwarcab" TEXT NOT NULL,
    "nama_kwarcab" TEXT NOT NULL,
    "alamat" TEXT,
    "kepala_kwarcab" TEXT,
    "foto_kwarcab" TEXT,
    "userId" TEXT,
    "createdById" TEXT,

    CONSTRAINT "Kwarcab_pkey" PRIMARY KEY ("kode_kwarcab")
);

-- CreateTable
CREATE TABLE "Kwaran" (
    "kode_kwaran" TEXT NOT NULL,
    "nama_kwaran" TEXT NOT NULL,
    "alamat" TEXT,
    "kepala_kwaran" TEXT,
    "foto_kwaran" TEXT,
    "kwarcabKode" TEXT NOT NULL,
    "userId" TEXT,
    "createdById" TEXT,

    CONSTRAINT "Kwaran_pkey" PRIMARY KEY ("kode_kwaran")
);

-- CreateTable
CREATE TABLE "GugusDepan" (
    "kode_gusdep" TEXT NOT NULL,
    "nama_gusdep" TEXT NOT NULL,
    "npsn" TEXT,
    "nama_sekolah" TEXT,
    "alamat" TEXT,
    "kepala_sekolah" TEXT,
    "foto_gusdep" TEXT,
    "kwaranKode" TEXT,
    "userId" TEXT,
    "createdById" TEXT,

    CONSTRAINT "GugusDepan_pkey" PRIMARY KEY ("kode_gusdep")
);

-- CreateTable
CREATE TABLE "Anggota" (
    "id_anggota" TEXT NOT NULL,
    "nta" TEXT NOT NULL,
    "nama_agt" TEXT NOT NULL,
    "tgl_lahir" TIMESTAMP(3) NOT NULL,
    "tahun_gabung" INTEGER,
    "gender" "Gender" NOT NULL,
    "agama" "Agama" NOT NULL,
    "alamat" TEXT NOT NULL,
    "status_agt" "StatusKeaktifan" NOT NULL,
    "jenjang_agt" "JenjangAnggota",
    "gusdepKode" TEXT NOT NULL,

    CONSTRAINT "Anggota_pkey" PRIMARY KEY ("id_anggota")
);

-- CreateTable
CREATE TABLE "Pembina" (
    "id_pembina" TEXT NOT NULL,
    "nta" TEXT NOT NULL,
    "nama_pbn" TEXT NOT NULL,
    "tgl_lahir" TIMESTAMP(3) NOT NULL,
    "gender" "Gender" NOT NULL,
    "agama" "Agama" NOT NULL,
    "alamat" TEXT NOT NULL,
    "jenjang_pbn" "JenjangPembina" NOT NULL,
    "gusdepKode" TEXT NOT NULL,

    CONSTRAINT "Pembina_pkey" PRIMARY KEY ("id_pembina")
);

-- CreateTable
CREATE TABLE "Kegiatan" (
    "id_kegiatan" TEXT NOT NULL,
    "nama_kegiatan" TEXT NOT NULL,
    "deskripsi" TEXT NOT NULL,
    "lokasi" TEXT NOT NULL,
    "tingkat_kegiatan" "Tingkat" NOT NULL,
    "laporan" TEXT NOT NULL,
    "tanggal" TIMESTAMP(3) NOT NULL,
    "gusdepKode" TEXT,
    "kwaranKode" TEXT,
    "kwarcabKode" TEXT,

    CONSTRAINT "Kegiatan_pkey" PRIMARY KEY ("id_kegiatan")
);

-- CreateTable
CREATE TABLE "Partisipan" (
    "anggotaId" TEXT NOT NULL,
    "kegiatanId" TEXT NOT NULL,

    CONSTRAINT "Partisipan_pkey" PRIMARY KEY ("anggotaId","kegiatanId")
);

-- CreateTable
CREATE TABLE "RiwayatJenjang" (
    "id_riwayat" TEXT NOT NULL,
    "anggotaId" TEXT NOT NULL,
    "jenjang_agt" "JenjangAnggota" NOT NULL,
    "tgl_perubahan" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RiwayatJenjang_pkey" PRIMARY KEY ("id_riwayat")
);

-- CreateTable
CREATE TABLE "Ajuan" (
    "id_ajuan" TEXT NOT NULL,
    "nama_ajuan" TEXT NOT NULL,
    "tingkat" "Tingkat" NOT NULL,
    "formulir" TEXT NOT NULL,
    "status" "Status" DEFAULT 'MENUNGGU',
    "nta" TEXT,
    "gusdepKode" TEXT NOT NULL,
    "kwarcabKode" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Ajuan_pkey" PRIMARY KEY ("id_ajuan")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Kwarcab_nama_kwarcab_key" ON "Kwarcab"("nama_kwarcab");

-- CreateIndex
CREATE UNIQUE INDEX "Kwarcab_userId_key" ON "Kwarcab"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Kwaran_nama_kwaran_key" ON "Kwaran"("nama_kwaran");

-- CreateIndex
CREATE UNIQUE INDEX "Kwaran_userId_key" ON "Kwaran"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "GugusDepan_nama_gusdep_key" ON "GugusDepan"("nama_gusdep");

-- CreateIndex
CREATE UNIQUE INDEX "GugusDepan_npsn_key" ON "GugusDepan"("npsn");

-- CreateIndex
CREATE UNIQUE INDEX "GugusDepan_userId_key" ON "GugusDepan"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Anggota_nta_key" ON "Anggota"("nta");

-- CreateIndex
CREATE UNIQUE INDEX "Pembina_nta_key" ON "Pembina"("nta");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Kwarcab" ADD CONSTRAINT "Kwarcab_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Kwarcab" ADD CONSTRAINT "Kwarcab_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Kwaran" ADD CONSTRAINT "Kwaran_kwarcabKode_fkey" FOREIGN KEY ("kwarcabKode") REFERENCES "Kwarcab"("kode_kwarcab") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Kwaran" ADD CONSTRAINT "Kwaran_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Kwaran" ADD CONSTRAINT "Kwaran_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GugusDepan" ADD CONSTRAINT "GugusDepan_kwaranKode_fkey" FOREIGN KEY ("kwaranKode") REFERENCES "Kwaran"("kode_kwaran") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GugusDepan" ADD CONSTRAINT "GugusDepan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GugusDepan" ADD CONSTRAINT "GugusDepan_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Anggota" ADD CONSTRAINT "Anggota_gusdepKode_fkey" FOREIGN KEY ("gusdepKode") REFERENCES "GugusDepan"("kode_gusdep") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pembina" ADD CONSTRAINT "Pembina_gusdepKode_fkey" FOREIGN KEY ("gusdepKode") REFERENCES "GugusDepan"("kode_gusdep") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Kegiatan" ADD CONSTRAINT "Kegiatan_gusdepKode_fkey" FOREIGN KEY ("gusdepKode") REFERENCES "GugusDepan"("kode_gusdep") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Kegiatan" ADD CONSTRAINT "Kegiatan_kwaranKode_fkey" FOREIGN KEY ("kwaranKode") REFERENCES "Kwaran"("kode_kwaran") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Kegiatan" ADD CONSTRAINT "Kegiatan_kwarcabKode_fkey" FOREIGN KEY ("kwarcabKode") REFERENCES "Kwarcab"("kode_kwarcab") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Partisipan" ADD CONSTRAINT "Partisipan_anggotaId_fkey" FOREIGN KEY ("anggotaId") REFERENCES "Anggota"("id_anggota") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Partisipan" ADD CONSTRAINT "Partisipan_kegiatanId_fkey" FOREIGN KEY ("kegiatanId") REFERENCES "Kegiatan"("id_kegiatan") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiwayatJenjang" ADD CONSTRAINT "RiwayatJenjang_anggotaId_fkey" FOREIGN KEY ("anggotaId") REFERENCES "Anggota"("id_anggota") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ajuan" ADD CONSTRAINT "Ajuan_gusdepKode_fkey" FOREIGN KEY ("gusdepKode") REFERENCES "GugusDepan"("kode_gusdep") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ajuan" ADD CONSTRAINT "Ajuan_kwarcabKode_fkey" FOREIGN KEY ("kwarcabKode") REFERENCES "Kwarcab"("kode_kwarcab") ON DELETE CASCADE ON UPDATE CASCADE;
