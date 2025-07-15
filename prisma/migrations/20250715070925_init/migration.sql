/*
  Warnings:

  - You are about to drop the column `nama_ajuan` on the `Ajuan` table. All the data in the column will be lost.
  - You are about to drop the column `tingkat` on the `Ajuan` table. All the data in the column will be lost.
  - Added the required column `gender` to the `Ajuan` table without a default value. This is not possible if the table is not empty.
  - Added the required column `jenjang_agt` to the `Ajuan` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nama_agt` to the `Ajuan` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Ajuan_nama_ajuan_idx";

-- AlterTable
ALTER TABLE "Ajuan" DROP COLUMN "nama_ajuan",
DROP COLUMN "tingkat",
ADD COLUMN     "gender" "Gender" NOT NULL,
ADD COLUMN     "jenjang_agt" "JenjangAnggota" NOT NULL,
ADD COLUMN     "nama_agt" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "Ajuan_nama_agt_idx" ON "Ajuan"("nama_agt");

-- CreateIndex
CREATE INDEX "Ajuan_createdAt_idx" ON "Ajuan"("createdAt");
