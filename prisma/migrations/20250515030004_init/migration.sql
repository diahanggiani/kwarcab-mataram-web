-- CreateIndex
CREATE INDEX "Ajuan_nama_ajuan_idx" ON "Ajuan"("nama_ajuan");

-- CreateIndex
CREATE INDEX "Ajuan_status_idx" ON "Ajuan"("status");

-- CreateIndex
CREATE INDEX "Ajuan_gusdepKode_idx" ON "Ajuan"("gusdepKode");

-- CreateIndex
CREATE INDEX "Ajuan_kwarcabKode_idx" ON "Ajuan"("kwarcabKode");

-- CreateIndex
CREATE INDEX "Anggota_nama_agt_idx" ON "Anggota"("nama_agt");

-- CreateIndex
CREATE INDEX "Anggota_status_agt_idx" ON "Anggota"("status_agt");

-- CreateIndex
CREATE INDEX "Anggota_gender_idx" ON "Anggota"("gender");

-- CreateIndex
CREATE INDEX "Anggota_tahun_gabung_idx" ON "Anggota"("tahun_gabung");

-- CreateIndex
CREATE INDEX "Anggota_gusdepKode_idx" ON "Anggota"("gusdepKode");

-- CreateIndex
CREATE INDEX "Anggota_gusdepKode_id_anggota_idx" ON "Anggota"("gusdepKode", "id_anggota");

-- CreateIndex
CREATE INDEX "GugusDepan_kwaranKode_idx" ON "GugusDepan"("kwaranKode");

-- CreateIndex
CREATE INDEX "GugusDepan_nama_gusdep_idx" ON "GugusDepan"("nama_gusdep");

-- CreateIndex
CREATE INDEX "GugusDepan_alamat_idx" ON "GugusDepan"("alamat");

-- CreateIndex
CREATE INDEX "Kegiatan_tanggal_idx" ON "Kegiatan"("tanggal");

-- CreateIndex
CREATE INDEX "Kegiatan_gusdepKode_idx" ON "Kegiatan"("gusdepKode");

-- CreateIndex
CREATE INDEX "Kegiatan_kwaranKode_idx" ON "Kegiatan"("kwaranKode");

-- CreateIndex
CREATE INDEX "Kegiatan_kwarcabKode_idx" ON "Kegiatan"("kwarcabKode");

-- CreateIndex
CREATE INDEX "Kwaran_kwarcabKode_idx" ON "Kwaran"("kwarcabKode");

-- CreateIndex
CREATE INDEX "Kwaran_nama_kwaran_idx" ON "Kwaran"("nama_kwaran");

-- CreateIndex
CREATE INDEX "Kwarcab_nama_kwarcab_idx" ON "Kwarcab"("nama_kwarcab");

-- CreateIndex
CREATE INDEX "Kwarcab_alamat_idx" ON "Kwarcab"("alamat");

-- CreateIndex
CREATE INDEX "Partisipan_anggotaId_idx" ON "Partisipan"("anggotaId");

-- CreateIndex
CREATE INDEX "Partisipan_kegiatanId_idx" ON "Partisipan"("kegiatanId");

-- CreateIndex
CREATE INDEX "Partisipan_anggotaId_kegiatanId_idx" ON "Partisipan"("anggotaId", "kegiatanId");

-- CreateIndex
CREATE INDEX "Pembina_nama_pbn_idx" ON "Pembina"("nama_pbn");

-- CreateIndex
CREATE INDEX "Pembina_gusdepKode_idx" ON "Pembina"("gusdepKode");

-- CreateIndex
CREATE INDEX "RiwayatJenjang_anggotaId_idx" ON "RiwayatJenjang"("anggotaId");

-- CreateIndex
CREATE INDEX "RiwayatJenjang_tgl_perubahan_idx" ON "RiwayatJenjang"("tgl_perubahan");

-- CreateIndex
CREATE INDEX "RiwayatJenjang_anggotaId_tgl_perubahan_idx" ON "RiwayatJenjang"("anggotaId", "tgl_perubahan");

-- CreateIndex
CREATE INDEX "RiwayatJenjang_jenjang_agt_idx" ON "RiwayatJenjang"("jenjang_agt");

-- CreateIndex
CREATE INDEX "User_createdById_role_idx" ON "User"("createdById", "role");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");

-- CreateIndex
CREATE INDEX "User_createdById_idx" ON "User"("createdById");
