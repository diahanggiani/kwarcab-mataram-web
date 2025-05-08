import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import supabase from "@/lib/supabase";
import { Prisma } from "@prisma/client";
import { isValidEnum } from "@/lib/helpers/enumValidator";

// keperluan testing (nanti dihapus)
// import { getSessionOrToken } from "@/lib/getSessionOrToken";

// handler untuk mengedit data ajuan oleh user kwarcab
// export async function PATCH(req: NextRequest, context: { params: Promise<Record<string, string>> }) {
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }) {
  // keperluan testing (nanti dihapus)
//   const session = await getSessionOrToken(req);
//   console.log("SESSION DEBUG:", session);

  // session yang asli (nanti uncomment)
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "USER_KWARCAB") {
    return NextResponse.json(
      { message: "Unauthorized: Only 'Kwarcab' users can edit data ajuan" },
      { status: 403 }
    );
  }

  // id anggota dari parameter url
  // const { id } = await context.params;
  const { id } = await context.params;

  try {
    const ajuan = await prisma.ajuan.findUnique({ where: { id_ajuan: id } });
    if (!ajuan) {
      return NextResponse.json({ message: "Ajuan not found" }, { status: 404 });
    }

    const body = await req.json();
    const { status, nta } = body;
    
    const existingAnggota = await prisma.anggota.findUnique({ where: { nta } });
    if (existingAnggota) {
      return NextResponse.json(
        { message: "NTA already registered" },
        { status: 400 }
      );
    }
    if (status === "DITERIMA" && !nta) {
      return NextResponse.json(
        { message: "Field 'NTA' is required if the status is 'DITERIMA'" },
        { status: 400 }
      );
    }

    // validasi enum
    if (!isValidEnum("Status", status)) {
      return NextResponse.json({ message: "Invalid status" }, { status: 400 });
    }

    if (ajuan.kwarcabKode !== session.user.kode_kwarcab) {
      return NextResponse.json(
        { message: "You do not have permission to edit this ajuan" },
        { status: 403 }
      );
    }

    const updateData: Partial<Prisma.AjuanUpdateInput> = {};
    if (status) updateData.status = status;
    if (nta) updateData.nta = nta;

    // jika status diubah jadi 'DITERIMA' dan ajuan punya file, hapus dari Supabase
    if (status === "DITERIMA" && nta && ajuan.formulir) {
      const pathParts = ajuan.formulir.split("/");
      const filePath = pathParts.slice(-2).join("/"); // folder/filename.pdf

      const { error: deleteError } = await supabase.storage
        .from("file-bucket-nextjs")
        .remove([filePath]);

      if (deleteError) {
        console.error("Gagal hapus file:", deleteError);
        return NextResponse.json(
          { message: "Failed to remove old file from storage" },
          { status: 500 }
        );
      }

      updateData.formulir = ""; // kosongkan di DB juga
    }

    const updated = await prisma.ajuan.update({
      where: { id_ajuan: id },
      data: updateData,
    });

    return NextResponse.json(
      { message: "Ajuan successfully updated", updated },
      { status: 200 }
    );
  } catch (error) {
    console.error("Update error:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// handler untuk mengedit data ajuan oleh user kwarcab
export async function DELETE(
  req: NextRequest,
  // { params }: { params: { id: string } }) {
  context: { params: Promise<{ id: string }> }) {
  // keperluan testing (nanti dihapus)
//   const session = await getSessionOrToken(req);
//   console.log("SESSION DEBUG:", session);

  // session yang asli (nanti uncomment)
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "USER_GUSDEP") {
    return NextResponse.json(
      {
        message: "Unauthorized: Only 'Gugus Depan' users can delete data ajuan",
      },
      { status: 403 }
    );
  }

  // id anggota dari parameter url
  const { id } = await context.params;
  console.log(id);

  try {
    const ajuan = await prisma.ajuan.findUnique({ where: { id_ajuan: id } });
    if (!ajuan) {
      return NextResponse.json({ message: "Ajuan not found" }, { status: 404 });
    }

    // pastikan user adalah pemilik ajuan
    if (ajuan.gusdepKode !== session.user.kode_gusdep) {
      return NextResponse.json(
        { message: "You do not have permission to delete this ajuan" },
        { status: 403 }
      );
    }

    // hapus file formulir dari Supabase jika masih ada
    if (ajuan.formulir) {
      const pathParts = ajuan.formulir.split("/");
      const filePath = pathParts.slice(-2).join("/");

      const { error: deleteError } = await supabase.storage
        .from("file-bucket-nextjs")
        .remove([filePath]);

      if (deleteError) {
        console.error("Gagal hapus file:", deleteError);
      }
    }

    // hapus data ajuan dari DB
    await prisma.ajuan.delete({
      where: { id_ajuan: id },
    });

    return NextResponse.json(
      { message: "Ajuan successfully deleted" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
