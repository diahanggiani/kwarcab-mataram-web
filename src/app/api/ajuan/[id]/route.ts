import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import supabase from "@/lib/supabase";
import path from "path";
import { randomUUID } from "crypto";
import { Gender, JenjangAnggota } from "@prisma/client";
import { isValidEnum } from "@/lib/helpers/enumValidator";

// keperluan testing (nanti dihapus)
// import { getSessionOrToken } from "@/lib/getSessionOrToken";
// import { NextRequest } from "next/server";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  // keperluan testing (nanti dihapus)
    // const session = await getSessionOrToken(req);
    // console.log("SESSION DEBUG:", session);

  // session yang asli (nanti uncomment)
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "USER_GUSDEP") {
    return NextResponse.json({ message: "Unauthorized: Only 'Gusdep' users can edit data ajuan" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const formData = await req.formData();
    const nama_agt = formData.get("nama_agt")?.toString().trim();
    const jenjang_agt = formData.get("jenjang_agt")?.toString().trim();
    const gender = formData.get("gender")?.toString().trim();
    const file = formData.get("formulir") as File | null;

    if (gender && !isValidEnum("Gender", gender)) {
      return NextResponse.json({ message: "Invalid gender" }, { status: 400 });
    }

    if (jenjang_agt && !isValidEnum("JenjangAnggota", jenjang_agt)) {
      return NextResponse.json({ message: "Invalid jenjang anggota" }, { status: 400 });
    }

    const ajuan = await prisma.ajuan.findUnique({ where: { id_ajuan: id } });
    if (!ajuan) {
      return NextResponse.json({ message: "Ajuan not found" }, { status: 404 });
    }

    // pastikan hanya bisa mengedit ajuan milik dirinya
    if (ajuan.gusdepKode !== session.user.kode_gusdep) {
      return NextResponse.json({ message: "You do not have permission to edit this ajuan" }, { status: 403 });
    }

    let newFormulirUrl = ajuan.formulir;

    // jika ada file baru dikirim
    if (file) {
      if (file.type !== "application/pdf") {
        return NextResponse.json({ message: "Only PDF files are allowed" }, { status: 400 });
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const maxSize = 2 * 1024 * 1024;
      if (buffer.length > maxSize) {
        return NextResponse.json({ message: "File size must be less than 2MB" }, { status: 400 });
      }

      // hapus file lama dari supabase (jika ada)
      if (ajuan.formulir) {
        const oldPath = ajuan.formulir.split("/").slice(-2).join("/");
        await supabase.storage.from("file-bucket-nextjs").remove([oldPath]);
      }

      // upload file baru
      const ext = path.extname(file.name) || ".pdf";
      const filename = `${randomUUID()}${ext}`;
      const storagePath = `formulir-ajuan/${filename}`;

      const { error: uploadError } = await supabase.storage
        .from("file-bucket-nextjs")
        .upload(storagePath, buffer, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        return NextResponse.json({ message: "Failed to upload new file" }, { status: 500 });
      }

      const { data: publicUrlData } = supabase.storage
        .from("file-bucket-nextjs")
        .getPublicUrl(storagePath);

      newFormulirUrl = publicUrlData?.publicUrl;
    }

    // update ajuan
    const updated = await prisma.ajuan.update({
      where: { id_ajuan: id },
      data: {
        ...(nama_agt && { nama_agt }),
        ...(gender && { gender: gender as Gender }),
        ...(jenjang_agt && { jenjang_agt: jenjang_agt as JenjangAnggota }),
        formulir: newFormulirUrl,
      },
    });

    return NextResponse.json({ message: "Ajuan successfully updated", updated }, { status: 200 });
    
  } catch (error) {
      console.error("Update ajuan failed:", error);
      return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  // keperluan testing (nanti dihapus)
  //   const session = await getSessionOrToken(req);
  //   console.log("SESSION DEBUG:", session);

  // session yang asli (nanti uncomment)
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "USER_GUSDEP") {
    return NextResponse.json({ message: "Unauthorized: Only 'Gugus Depan' users can delete data ajuan" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const ajuan = await prisma.ajuan.findUnique({ where: { id_ajuan: id } });
    if (!ajuan) {
      return NextResponse.json({ message: "Ajuan not found" }, { status: 404 });
    }

    // pastikan user adalah pemilik ajuan
    if (ajuan.gusdepKode !== session.user.kode_gusdep) {
      return NextResponse.json({ message: "You do not have permission to delete this ajuan" }, { status: 403 });
    }

    // hapus file formulir dari Supabase jika masih ada
    if (ajuan.formulir) {
      const pathParts = ajuan.formulir.split("/");
      const filePath = pathParts.slice(-2).join("/");

      const { error: deleteError } = await supabase.storage
        .from("file-bucket-nextjs")
        .remove([filePath]);

      if (deleteError) {
        console.error("Failed delete file:", deleteError);
      }
    }

    // hapus data ajuan dari DB
    await prisma.ajuan.delete({
      where: { id_ajuan: id },
    });

    return NextResponse.json({ message: "Ajuan successfully deleted" }, { status: 200 });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
