import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import supabase from "@/lib/supabase";
import { Prisma } from "@prisma/client";
import { isValidEnum } from "@/lib/helpers/enumValidator";
import { formatNta } from "@/lib/helpers/format";

// keperluan testing (nanti dihapus)
// import { getSessionOrToken } from "@/lib/getSessionOrToken";
// import { NextRequest } from "next/server";

// verifikasi ajuan oleh kwarcab
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  // keperluan testing (nanti dihapus)
    // const session = await getSessionOrToken(req);
    // console.log("SESSION DEBUG:", session);

  // session yang asli (nanti uncomment)
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "USER_KWARCAB") {
    return NextResponse.json({ message: "Unauthorized: Only 'Kwarcab' users can edit data ajuan" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const ajuan = await prisma.ajuan.findUnique({ where: { id_ajuan: id } });
    if (!ajuan) {
      return NextResponse.json({ message: "Ajuan not found" }, { status: 404 });
    }

    // cuma kwarcab yang naungi gusdep tersebut yang bisa verifikasi ajuan
    if (ajuan.kwarcabKode !== session.user.kode_kwarcab) {
      return NextResponse.json({ message: "You do not have permission to edit this ajuan" }, { status: 403 });
    }

    const body = await req.json();
    const { status } = body;
    const rawNta = body.nta?.replace(/\D/g, ""), keterangan = body.keterangan?.trim();
    
    const updateData: Partial<Prisma.AjuanUpdateInput> = {};

    if (!isValidEnum("Status", status)) {
      return NextResponse.json({ message: "Invalid status" }, { status: 400 });
    }

    if (keterangan) {
      if (keterangan.split(/\s+/).length > 300) {
        return NextResponse.json({ message: "The note is too long (max 300 words)" }, { status: 400 });
      }
      updateData.keterangan = keterangan;
    }

    if (status) updateData.status = status;
    // if (rawNta) updateData.nta = rawNta;

    // jika status DITERIMA
    if (status === "DITERIMA") {
      if (!rawNta) {
        return NextResponse.json({ message: "Field 'NTA' is required" }, { status: 400 });
      }

      if (rawNta.length < 14 || rawNta.length > 16) {
        return NextResponse.json({ message: "NTA must be 14–16 digit numbers" }, { status: 400 });
      }
      
      const formattedNta = formatNta(rawNta);
      updateData.nta = formattedNta;

      const existing = await prisma.anggota.findUnique({ where: { nta: formattedNta } });
      if (existing) {
        return NextResponse.json({ message: "NTA already registered" }, { status: 409 });
      }

      // status diterima & nta terisi = otomatis masuk ke daftar anggota
      await prisma.$transaction([
        prisma.anggota.create({
          data: {
            nta: formattedNta,
            nama_agt: ajuan.nama_agt,
            gender: ajuan.gender,
            jenjang_agt: ajuan.jenjang_agt,
            status_agt: "AKTIF",
            gusdepKode: ajuan.gusdepKode,
          },
        }),
        prisma.riwayatJenjang.create({
          data: {
            anggota: { connect: { nta: formattedNta } },
            jenjang_agt: ajuan.jenjang_agt!,
            tgl_perubahan: new Date(),
          },
        }),
      ]);
      
      // hapus file ajuan dari db jika ada (supaya db ga penuh krn status jg sudah diterima)
      if (ajuan.formulir) {
        const pathParts = ajuan.formulir.split("/");
        const filePath = pathParts.slice(-2).join("/"); // folder/filename.pdf

        const { error: deleteError } = await supabase.storage
          .from("file-bucket-nextjs")
          .remove([filePath]);

        if (deleteError) {
          console.error("Failed to remove file:", deleteError);
          return NextResponse.json({ message: "Failed to remove file from storage" }, { status: 500 });
        }

        updateData.formulir = ""; // hapus juga link formulir di db
      }
    }

    // update data ajuan
    const updated = await prisma.ajuan.update({
      where: { id_ajuan: id },
      data: updateData,
    });

    return NextResponse.json({ message: "Ajuan successfully updated", updated }, { status: 200 });
  } catch (error) {
    console.error("Update error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}