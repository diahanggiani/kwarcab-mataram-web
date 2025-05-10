import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import supabase from "@/lib/supabase";
import { randomUUID } from "crypto";
import { isValidEnum } from "@/lib/helpers/enumValidator";
import { Ajuan } from "@prisma/client";
import path from "path";
import { generateAjuanWhereClause } from "@/lib/helpers/queryClause";

// keperluan testing (nanti dihapus)
// import { getSessionOrToken } from "@/lib/getSessionOrToken";

export async function POST(req: NextRequest) {
  // keperluan testing (nanti dihapus)
  //   const session = await getSessionOrToken(req);
  //   console.log("SESSION DEBUG:", session);

  // session yang asli (nanti uncomment)
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "USER_GUSDEP") {
    return NextResponse.json({ message: "Unauthorized: Only 'Gugus Depan' users can submit form" }, { status: 403 });
  }

  try {
    const formData = await req.formData();
    const nama_ajuan = formData.get("nama_ajuan")?.toString().trim();
    const tingkat = formData.get("tingkat")?.toString().trim();
    const file = formData.get("formulir") as File;

    // query untuk mencari kode_kwarcab berdasarkan kode_gusdep
    const gusdep = await prisma.gugusDepan.findUnique({
      where: { kode_gusdep: session.user.kode_gusdep },
      include: {
        kwaran: {
          include: {
            kwarcab: true,
          },
        },
      },
    });

    // memastikan kode_kwarcab ditemukan
    const kode_kwarcab = gusdep?.kwaran?.kwarcab?.kode_kwarcab;

    if (!kode_kwarcab) {
      return NextResponse.json({ error: "Kode kwarcab tidak ditemukan" }, { status: 400 });
    }

    if (!nama_ajuan || !tingkat || !file) {
      return NextResponse.json({ message: "All fields are required" }, { status: 400 });
    }

    if (!isValidEnum("Tingkat", tingkat)) {
      return NextResponse.json({ message: "Invalid jenjang anggota" }, { status: 400 });
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json({ message: "Only PDF files are allowed" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const maxSize = 2 * 1024 * 1024;

    if (buffer.length > maxSize) {
      return NextResponse.json({ message: "File size must be less than 2MB" }, { status: 400 });
    }

    // upload file ke supabase storage
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
      return NextResponse.json({ message: "Failed to upload formulir ajuan" }, { status: 500 });
    }

    const { data: publicUrlData } = supabase.storage
      .from("file-bucket-nextjs")
      .getPublicUrl(storagePath);

    const url = publicUrlData?.publicUrl;

    const newAjuan = await prisma.ajuan.create({
      data: {
        nama_ajuan,
        tingkat,
        formulir: url,
        gusdepKode: session.user.kode_gusdep!,
        kwarcabKode: kode_kwarcab,
      },
    });

    return NextResponse.json({ message: "Ajuan successfully added", newAjuan }, { status: 200 });
  } catch (error) {
    console.error("Error submiting form:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  // keperluan testing (nanti dihapus)
  //   const session = await getSessionOrToken(req);
  //   console.log("SESSION DEBUG:", session);

  // session yang asli (nanti uncomment)
  const session = await getServerSession(authOptions);

  if (!session || !["USER_GUSDEP", "USER_KWARCAB"].includes(session.user.role)) {
    return NextResponse.json(
      { message: "Unauthorized: Only 'Gugus Depan' & 'Kwarcab' users can view data ajuan"}, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const searchQuery = searchParams.get("search") || undefined;
    const statusFilter = searchParams.get("status");

    // pagination
    const page = parseInt(searchParams.get("page") || "1");  // default page is 1
    const limit = parseInt(searchParams.get("limit") || "10"); // default limit is 10

    const validStatuses: ("DITERIMA" | "DITOLAK" | "MENUNGGU" | "ALL")[] = [
      "DITERIMA", "DITOLAK", "MENUNGGU", "ALL",
    ];

    const filterStatus: "DITERIMA" | "DITOLAK" | "MENUNGGU" | undefined =
      validStatuses.includes(
        statusFilter as "DITERIMA" | "DITOLAK" | "MENUNGGU" | "ALL"
      )
        ? statusFilter === "ALL"
          ? undefined
          : (statusFilter as "DITERIMA" | "DITOLAK" | "MENUNGGU")
        : undefined;

    let ajuanList: Ajuan[] = [];

    // user gusdep hanya lihat ajuan milik sendiri
    if (session.user.role === "USER_GUSDEP") {
      const whereClause = generateAjuanWhereClause(
        { gusdepKode: session.user.kode_gusdep },
        filterStatus,
        searchQuery
      );

      ajuanList = await prisma.ajuan.findMany({
        where: whereClause,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit, // skip berdasarkan halaman yang diminta
        take: limit, // ambil data sesuai limit
      });

    // user kwarcab lihat semua ajuan yang ditujukan untuknya (gusdep di bawah naungannya)
    } else if (session.user.role === "USER_KWARCAB") {
      const whereClause = generateAjuanWhereClause(
        { kwarcabKode: session.user.kode_kwarcab },
        filterStatus,
        searchQuery
      );

      ajuanList = await prisma.ajuan.findMany({
        where: whereClause,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit
      });
    }

    return NextResponse.json({ajuanList, page, limit});
  } catch (error) {
    console.error("Error viewing form:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
