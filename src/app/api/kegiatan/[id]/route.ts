import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { Tingkat } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isValidEnum } from "@/lib/helpers/enumValidator";
import { getGusdepKodeByRegion } from "@/lib/helpers/getGusdep";
import supabase from "@/lib/supabase";
import { randomUUID } from "crypto";
import path from "path";

// keperluan testing (nanti dihapus)
// import { getSessionOrToken } from "@/lib/getSessionOrToken";

// handler untuk lihat detail data kegiatan
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  // keperluan testing (nanti dihapus)
//   const session = await getSessionOrToken(req);
//   console.log("SESSION DEBUG:", session);

  // session yang asli (nanti uncomment)
  const session = await getServerSession(authOptions);

  if (!session || session.user.role === "USER_SUPERADMIN") {
    return NextResponse.json(
      {
        message:
          "Unauthorized: Only 'Kwarcab/Kwaran/Gusdep' users can view activity",
      },
      { status: 403 }
    );
  }

  // id anggota dari parameter url
  const { id } = await context.params;

  try {
    // cari kegiatan berdasarkan ID
    const kegiatan = await prisma.kegiatan.findUnique({
      where: { id_kegiatan: id },
      include: {
        partisipan: {
          include: {
            anggota: {
              select: {
                nta: true,
                nama_agt: true,
                jenjang_agt: true,
              },
            },
          },
        },
      },
    });

    if (!kegiatan) {
      return NextResponse.json(
        { message: "Activity not found" },
        { status: 404 }
      );
    }

    // validasi akses wilayah
    const user = session.user;
    const { kode_gusdep, kode_kwaran, kode_kwarcab } = user;

    let isAllowed = false;

    if (user.role === "USER_GUSDEP" && kode_gusdep === kegiatan.gusdepKode) {
      isAllowed = true;
    } else if (user.role === "USER_KWARAN") {
      const gusdepList = await getGusdepKodeByRegion(kode_kwaran!, true);
      isAllowed =
        kegiatan.kwaranKode === kode_kwaran ||
        (!!kegiatan.gusdepKode && gusdepList.includes(kegiatan.gusdepKode));
    } else if (user.role === "USER_KWARCAB") {
      const gusdepList = await getGusdepKodeByRegion(kode_kwarcab!, true);
      isAllowed =
        kegiatan.kwarcabKode === kode_kwarcab ||
        (kegiatan.kwaranKode &&
          kegiatan.kwaranKode.startsWith(kode_kwarcab || "")) ||
        (!!kegiatan.gusdepKode && gusdepList.includes(kegiatan.gusdepKode));
    }

    if (!isAllowed) {
      return NextResponse.json(
        { message: "You do not have permission to view this activity" },
        { status: 403 }
      );
    }

    // mengambil URL public file laporan dari Supabase
    const fileUrl = kegiatan.laporan;

    // pastikan file berada dalam folder 'laporan-kegiatan'
    const filePath = `laporan-kegiatan/${fileUrl}`;

    // ambil file dari Supabase menggunakan path yang benar
    const { data, error } = await supabase.storage
      .from("file-bucket-nextjs")
      .download(filePath);

    if (error || !data) {
      return NextResponse.json(
        { message: "Failed to download file" },
        { status: 500 }
      );
    }

    // Membaca data file dan mengirimkan sebagai stream
    const fileBuffer = await data.arrayBuffer(); // pastikan ini mengonversi data ke buffer
    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${path.basename(filePath)}"`,
      },
    });

    // return NextResponse.json(kegiatan);
    // Mengatur header untuk file yang akan didownload
    return new NextResponse(data, {
      headers: {
        "Content-Type": "application/pdf", // Ubah jika file selain PDF
        "Content-Disposition": `attachment; filename="${path.basename(filePath)}"`,
      },
    });
  } catch (error) {
    console.error("Error retrieving activity details:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// handler untuk edit data kegiatan
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  // keperluan testing (nanti dihapus)
//   const session = await getSessionOrToken(req);
//   console.log("SESSION DEBUG:", session);

  // session yang asli (nanti uncomment)
  const session = await getServerSession(authOptions);

  if (!session || session.user.role === "USER_SUPERADMIN") {
    return NextResponse.json(
      {
        message:
          "Unauthorized: Only 'Kwarcab/Kwaran/Gusdep' users can edit activity",
      },
      { status: 403 }
    );
  }

  // id anggota dari parameter url
  const { id } = await context.params;

  try {
    const kegiatan = await prisma.kegiatan.findUnique({
      where: { id_kegiatan: id },
    });
    if (!kegiatan) {
      return NextResponse.json(
        { message: "Activity not found" },
        { status: 404 }
      );
    }

    const formData = await req.formData();

    const nama_kegiatan = formData.get("nama_kegiatan")?.toString().trim();
    const deskripsi = formData.get("deskripsi")?.toString().trim();
    const lokasi = formData.get("lokasi")?.toString().trim();
    const tingkat_kegiatan = formData
      .get("tingkat_kegiatan")
      ?.toString()
      .trim();
    const tanggal = formData.get("tanggal")?.toString().trim();
    const pesertaRaw = formData.get("pesertaIds")?.toString().trim();
    const laporanFile = formData.get("laporan") as File | null;

    // validasi enum jika diberikan
    if (tingkat_kegiatan && !isValidEnum("Tingkat", tingkat_kegiatan)) {
      return NextResponse.json(
        { message: "Invalid tingkat kegiatan" },
        { status: 400 }
      );
    }

    // atur max kata deskripsi
    if (deskripsi && deskripsi.split(/\s+/).length > 300) {
      return NextResponse.json(
        { message: "The description is too long (max 300 words)" },
        { status: 400 }
      );
    }

    let newLaporanUrl: string | undefined = undefined;

    if (laporanFile && laporanFile.size > 0) {
      if (laporanFile.type !== "application/pdf") {
        return NextResponse.json(
          { message: "Only PDF files are allowed" },
          { status: 400 }
        );
      }

      const buffer = Buffer.from(await laporanFile.arrayBuffer());
      const maxSize = 2 * 1024 * 1024;
      if (buffer.length > maxSize) {
        return NextResponse.json(
          { message: "File size must be less than 2MB" },
          { status: 400 }
        );
      }

      const ext = path.extname(laporanFile.name) || ".pdf";
      const fileName = `${randomUUID()}${ext}`;
      const storagePath = `laporan-kegiatan/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("file-bucket-nextjs")
        .upload(storagePath, buffer, {
          contentType: laporanFile.type,
          upsert: false,
        });

      if (uploadError) {
        return NextResponse.json(
          { message: "Failed to upload laporan kegiatan" },
          { status: 500 }
        );
      }

      // delete laporan lama dari Supabase
      if (kegiatan.laporan) {
        const oldPath = kegiatan.laporan.split("/").slice(-2).join("/");
        await supabase.storage.from("file-bucket-nextjs").remove([oldPath]);
      }

      const { data: publicUrlData } = supabase.storage
        .from("file-bucket-nextjs")
        .getPublicUrl(storagePath);
      newLaporanUrl = publicUrlData?.publicUrl || "";
    }

    // validasi: hanya user pembuat yang bisa edit
    const role = session.user.role;

    const isCreator =
      (role === "USER_GUSDEP" &&
        kegiatan.gusdepKode === session.user.kode_gusdep) ||
      (role === "USER_KWARAN" &&
        kegiatan.kwaranKode === session.user.kode_kwaran) ||
      (role === "USER_KWARCAB" &&
        kegiatan.kwarcabKode === session.user.kode_kwarcab);

    if (!isCreator) {
      return NextResponse.json(
        { message: "Forbidden: You are not the creator of this activity" },
        { status: 403 }
      );
    }
    
    // validasi partisipan jika ada
    let anggotaValid: string[] = [];
    if (pesertaRaw) {
      let pesertaIds: string[];
      try {
        pesertaIds = JSON.parse(pesertaRaw);
        if (!Array.isArray(pesertaIds) || pesertaIds.length === 0) {
          return NextResponse.json(
            { message: "At least one participant must be selected" },
            { status: 400 }
          );
        }
      } catch {
        return NextResponse.json(
          { message: "Invalid peserta format" },
          { status: 400 }
        );
      }

      if (session.user.role === "USER_GUSDEP" && session.user.kode_gusdep) {
        anggotaValid = (
          await prisma.anggota.findMany({
            where: {
              gusdepKode: session.user.kode_gusdep,
              id_anggota: { in: pesertaIds },
            },
            select: { id_anggota: true },
          })
        ).map((a) => a.id_anggota);
      } else if (
        session.user.role === "USER_KWARAN" &&
        session.user.kode_kwaran
      ) {
        const allowedGusdepKode = await getGusdepKodeByRegion(
          session.user.kode_kwaran,
          true
        );
        anggotaValid = (
          await prisma.anggota.findMany({
            where: {
              gusdepKode: { in: allowedGusdepKode },
              id_anggota: { in: pesertaIds },
            },
            select: { id_anggota: true },
          })
        ).map((a) => a.id_anggota);
      } else if (
        session.user.role === "USER_KWARCAB" &&
        session.user.kode_kwarcab
      ) {
        const allowedGusdepKode = await getGusdepKodeByRegion(
          session.user.kode_kwarcab,
          false
        );
        anggotaValid = (
          await prisma.anggota.findMany({
            where: {
              gusdepKode: { in: allowedGusdepKode },
              id_anggota: { in: pesertaIds },
            },
            select: { id_anggota: true },
          })
        ).map((a) => a.id_anggota);
      }

      if (anggotaValid.length !== pesertaIds.length) {
        return NextResponse.json(
          { message: "some participants are not valid or outside your area" },
          { status: 403 }
        );
      }

      // hapus semua partisipan lama dan insert baru
      await prisma.partisipan.deleteMany({ where: { kegiatanId: id } });
      await prisma.partisipan.createMany({
        data: anggotaValid.map((id_anggota) => ({
          kegiatanId: id,
          anggotaId: id_anggota,
        })),
      });
    }

    const updatedKegiatan = await prisma.kegiatan.update({
      where: { id_kegiatan: id },
      data: {
        ...(nama_kegiatan && { nama_kegiatan }),
        ...(deskripsi && { deskripsi }),
        ...(lokasi && { lokasi }),
        ...(tingkat_kegiatan && {
          tingkat_kegiatan: tingkat_kegiatan as Tingkat,
        }),
        ...(tanggal && { tanggal: new Date(tanggal) }),
        ...(newLaporanUrl && { laporan: newLaporanUrl }),
      },
    });

    return NextResponse.json({
      message: "Activity updated successfully",
      updatedKegiatan,
    });
  } catch (error) {
    console.error("Error updating activity:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// handler untuk hapus data kegiatan
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  // keperluan testing (nanti dihapus)
//   const session = await getSessionOrToken(req);
//   console.log("SESSION DEBUG:", session);

  // session yang asli (nanti uncomment)
  const session = await getServerSession(authOptions);

  if (!session || session.user.role === "USER_SUPERADMIN") {
    return NextResponse.json(
      {
        message:
          "Unauthorized: Only 'Kwarcab/Kwaran/Gusdep' users can delete activity",
      },
      { status: 403 }
    );
  }

  // id anggota dari parameter url
  const { id } = await context.params;

  try {
    const kegiatan = await prisma.kegiatan.findUnique({
      where: { id_kegiatan: id },
    });

    if (!kegiatan) {
      return NextResponse.json(
        { message: "Activity not found" },
        { status: 404 }
      );
    }

    // validasi wilayah
    const user = session.user;
    const { kode_gusdep, kode_kwaran, kode_kwarcab } = user;

    let isAllowed = false;

    if (user.role === "USER_GUSDEP" && kode_gusdep === kegiatan.gusdepKode) {
      isAllowed = true;
    } else if (user.role === "USER_KWARAN") {
      const gusdepList = await getGusdepKodeByRegion(kode_kwaran!, true);
      isAllowed =
        kegiatan.kwaranKode === kode_kwaran ||
        (!!kegiatan.gusdepKode && gusdepList.includes(kegiatan.gusdepKode));
    } else if (user.role === "USER_KWARCAB") {
      const gusdepList = await getGusdepKodeByRegion(kode_kwarcab!, true);
      isAllowed =
        kegiatan.kwarcabKode === kode_kwarcab ||
        (kegiatan.kwaranKode &&
          kegiatan.kwaranKode.startsWith(kode_kwarcab || "")) ||
        (!!kegiatan.gusdepKode && gusdepList.includes(kegiatan.gusdepKode));
    }

    if (!isAllowed) {
      return NextResponse.json(
        { message: "You do not have permission to delete this activity" },
        { status: 403 }
      );
    }

    // hapus file laporan jika ada
    if (kegiatan.laporan) {
      const oldPath = kegiatan.laporan.split("/").slice(-2).join("/");
      // await supabase.storage.from("file-bucket-nextjs").remove([oldPath]);

      const { error: deleteError } = await supabase.storage
        .from("file-bucket-nextjs")
        .remove([oldPath]);
      if (deleteError) {
        console.warn("Failed to delete old file:", deleteError.message);
      }
    }

    // hapus partisipan dulu agar tidak gagal karena constraint
    await prisma.partisipan.deleteMany({ where: { kegiatanId: id } });

    // hapus kegiatan
    await prisma.kegiatan.delete({ where: { id_kegiatan: id } });

    return NextResponse.json({ message: "Activity deleted successfully" });
  } catch (error) {
    console.error(`Error deleting activity with ID ${id}:`, error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
