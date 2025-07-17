import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isValidEnum } from "@/lib/helpers/enumValidator";
import { getGusdepKodeByRegion } from "@/lib/helpers/getGusdep";
import supabase from "@/lib/supabase";
import { randomUUID } from "crypto";
import path from "path";
import { Prisma } from "@prisma/client";

// keperluan testing (nanti dihapus)
// import { getSessionOrToken } from "@/lib/getSessionOrToken";

export async function POST(req: NextRequest) {
  // keperluan testing (nanti dihapus)
    // const session = await getSessionOrToken(req);
  //   console.log("SESSION DEBUG:", session);

  // session yang asli (nanti uncomment)
  const session = await getServerSession(authOptions);

  if (!session || session.user.role === "USER_SUPERADMIN") {
    return NextResponse.json({ message: "Unauthorized: Only 'Kwarcab/Kwaran/Gusdep' users can add activity" }, { status: 403 });
  }

  try {
    // const { searchParams } = new URL(req.url);
    // const page = parseInt(searchParams.get("page") || "1");
    // const limit = parseInt(searchParams.get("limit") || "10");

    const formData = await req.formData();

    const nama_kegiatan = formData.get("nama_kegiatan")?.toString().trim();
    const deskripsi = formData.get("deskripsi")?.toString().trim();
    const lokasi = formData.get("lokasi")?.toString().trim();
    const tingkat_kegiatan = formData.get("tingkat_kegiatan")?.toString().trim();
    const tanggal = formData.get("tanggal")?.toString().trim();
    const pesertaRaw = formData.get("pesertaIds")?.toString().trim();
    const laporanFile = formData.get("laporan") as File;

    if (!nama_kegiatan || !deskripsi || !lokasi || !tingkat_kegiatan || !tanggal || !laporanFile || !pesertaRaw) {
      return NextResponse.json({ message: "All fields are required" }, { status: 400 });
    }

    if (!isValidEnum("Tingkat", tingkat_kegiatan)) {
      return NextResponse.json({ message: "Invalid tingkat kegiatan" }, { status: 400 });
    }

    if (deskripsi.split(/\s+/).length > 300) {
      return NextResponse.json({ message: "The description is too long (max 300 words)" }, { status: 400 });
    }

    if (laporanFile.type !== "application/pdf") {
      return NextResponse.json({ message: "Only PDF files are allowed" }, { status: 400 });
    }

    const buffer = Buffer.from(await laporanFile.arrayBuffer());
    const maxSize = 2 * 1024 * 1024;

    if (buffer.length > maxSize) {
      return NextResponse.json({ message: "File size must be less than 2MB" }, { status: 400 });
    }

    let pesertaIds: string[];

    try {
      pesertaIds = JSON.parse(pesertaRaw);
      if (!Array.isArray(pesertaIds) || pesertaIds.length === 0) {
        return NextResponse.json({ message: "At least one participant must be selected" }, { status: 400 });
      }
    } catch (error) {
      return NextResponse.json(
        { message: "Invalid peserta format", error },
        { status: 400 }
      );
    }

    // validasi anggota berdasarkan role user
    let anggotaValid: string[] = [];

    if (session.user.role === "USER_GUSDEP" && session.user.kode_gusdep) {
      anggotaValid = (
        await prisma.anggota.findMany({
          where: {
            gusdepKode: session.user.kode_gusdep,
            id_anggota: { in: pesertaIds },
          },
          select: { id_anggota: true },
          orderBy: { nama_agt: "asc" },
          // skip: (page - 1) * limit,
          // take: limit
        })
      ).map((a) => a.id_anggota);

    } else if (session.user.role === "USER_KWARAN" && session.user.kode_kwaran) {
      const allowedGusdepKode = await getGusdepKodeByRegion(session.user.kode_kwaran, true);
      anggotaValid = (
        await prisma.anggota.findMany({
          where: {
            gusdepKode: { in: allowedGusdepKode },
            id_anggota: { in: pesertaIds },
          },
          select: { id_anggota: true },
          orderBy: { nama_agt: "asc" },
          // skip: (page - 1) * limit,
          // take: limit
        })
      ).map((a) => a.id_anggota);

    } else if (session.user.role === "USER_KWARCAB" && session.user.kode_kwarcab) {
      const allowedGusdepKode = await getGusdepKodeByRegion(session.user.kode_kwarcab, false);
      anggotaValid = (
        await prisma.anggota.findMany({
          where: {
            gusdepKode: { in: allowedGusdepKode },
            id_anggota: { in: pesertaIds },
          },
          select: { id_anggota: true },
          orderBy: { nama_agt: "asc" },
          // skip: (page - 1) * limit,
          // take: limit
        })
      ).map((a) => a.id_anggota);
    }

    if (anggotaValid.length !== pesertaIds.length) {
      return NextResponse.json({ message: "some participants are not valid or outside your area" }, { status: 403 });
    }

    // upload laporan kegiatan (pdf) ke supabase storage bucket
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
      console.error("Upload error:", uploadError);
      return NextResponse.json({ message: "Failed to upload laporan kegiatan" }, { status: 500 });
    }

    const { data: publicUrlData } = supabase.storage
      .from("file-bucket-nextjs")
      .getPublicUrl(storagePath);

    const laporanPath = publicUrlData?.publicUrl;

    let gusdepKode: string | undefined = undefined;
    let kwaranKode: string | undefined = undefined;
    let kwarcabKode: string | undefined = undefined;

    if (session.user.role === "USER_GUSDEP") {
      gusdepKode = session.user.kode_gusdep;
      kwaranKode = session.user.kode_kwaran;
      kwarcabKode = session.user.kode_kwarcab;
    } else if (session.user.role === "USER_KWARAN") {
      kwaranKode = session.user.kode_kwaran;
      kwarcabKode = session.user.kode_kwarcab;
    } else if (session.user.role === "USER_KWARCAB") {
      kwarcabKode = session.user.kode_kwarcab;
    }

    // simpan kegiatan
    const kegiatan = await prisma.kegiatan.create({
      data: {
        nama_kegiatan,
        deskripsi,
        lokasi,
        tingkat_kegiatan,
        tanggal: new Date(tanggal),
        laporan: laporanPath,
        gusdepKode,
        kwaranKode,
        kwarcabKode,
      },
    });

    // simpan partisipan
    await prisma.partisipan.createMany({
      data: anggotaValid.map((id) => ({
        anggotaId: id,
        kegiatanId: kegiatan.id_kegiatan,
      })),
    });

    return NextResponse.json({ message: "Activity data successfully added", kegiatan }, { status: 201 });
  } catch (error) {
    console.error("Error adding activity:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  // keperluan testing (nanti dihapus)
    // const session = await getSessionOrToken(req);
  //   console.log("SESSION DEBUG:", session);

  // session yang asli (nanti uncomment)
  const session = await getServerSession(authOptions);

  if (!session || session.user.role === "USER_SUPERADMIN") {
    return NextResponse.json({ message: "Unauthorized: Only 'Kwarcab/Kwaran/Gusdep' users can retrieve activities" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const searchQuery = searchParams.get("search") || undefined;
        
    // pagination
    // const page = parseInt(searchParams.get("page") || "1");
    // const limit = parseInt(searchParams.get("limit") || "10");

    let kode_kwaran: string | null = null;
    let kode_gusdep: string | null = null;
    let detail: string | null = null;

    if (req.url.includes("?")) {
      const parts = req.url.split("?");

      // process each part after the first question mark
      for (let i = 1; i < parts.length; i++) {
        const paramParts = parts[i].split("=");
        if (paramParts.length === 2) {
          const paramName = paramParts[0];
          const paramValue = paramParts[1];

          if (paramName === "kode_kwaran") {
            kode_kwaran = paramValue;
          } else if (paramName === "kode_gusdep") {
            kode_gusdep = paramValue;
          } else if (paramName === "detail") {
            detail = paramValue;
          }
        }
      }
    }

    // if no parameters were found with custom parsing, try standard URL parsing as fallback
    if (!kode_kwaran && !kode_gusdep && !detail) {
      try {
        const searchParams = new URL(req.url).searchParams;
        kode_kwaran = searchParams.get("kode_kwaran");
        kode_gusdep = searchParams.get("kode_gusdep");
        detail = searchParams.get("detail");
      } catch (error) {
        console.error("Error parsing URL:", error);
      }
    }

    // jika detail parameter ada, tampilkan detail kegiatan
    if (detail) {
      // cari kegiatan berdasarkan ID
      const kegiatan = await prisma.kegiatan.findUnique({
        where: { id_kegiatan: detail },
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
        return NextResponse.json({ message: "Activity not found" }, { status: 404 });
      }

      // validasi akses wilayah
      const user = session.user;
      const { kode_gusdep, kode_kwaran, kode_kwarcab } = user;

      let isAllowed = false;

      if (user.role === "USER_GUSDEP" && kode_gusdep === kegiatan.gusdepKode) {
        isAllowed = true;
        console.log("USER_GUSDEP: ", kode_gusdep, kegiatan.gusdepKode);

      } else if (user.role === "USER_KWARAN") {
        const gusdepList = await getGusdepKodeByRegion(kode_kwaran!, true);
        isAllowed =
          kegiatan.kwaranKode === kode_kwaran ||
          (!!kegiatan.gusdepKode && gusdepList.includes(kegiatan.gusdepKode));

      } else if (user.role === "USER_KWARCAB") {
        const gusdepList = await getGusdepKodeByRegion(kode_kwarcab!, false);
        isAllowed =
          kegiatan.kwarcabKode === kode_kwarcab ||
          (kegiatan.kwaranKode &&
            kegiatan.kwaranKode.startsWith(kode_gusdep || "")) ||
          (!!kegiatan.gusdepKode && gusdepList.includes(kegiatan.gusdepKode));
      }

      if (!isAllowed) {
        return NextResponse.json({ message: "You do not have permission to view this activity" }, { status: 403 });
      }

      return NextResponse.json(kegiatan);
    }

    // kode yang sudah ada untuk menampilkan daftar kegiatan
    const whereClause: Prisma.KegiatanWhereInput = {};

    // Validasi akses berdasarkan query
    if (kode_kwaran) {
      if (session.user.role !== "USER_KWARCAB") {
        return NextResponse.json({ message: "Forbidden: Only KWARCAB can access kode_kwaran" }, { status: 403 });
      }
      whereClause.kwaranKode = kode_kwaran;
    }

    if (kode_gusdep) {
      if (session.user.role === "USER_KWARCAB") {
        if (!session.user.kode_kwarcab) {
          return NextResponse.json({ message: "Missing kode_kwarcab in session" }, { status: 400 });
        }
        const gusdepList = await getGusdepKodeByRegion(session.user.kode_kwarcab, false);
        if (!gusdepList.includes(kode_gusdep)) {
          return NextResponse.json({ message: "Forbidden: Gusdep not in your wilayah" }, { status: 403 });
        }
        whereClause.gusdepKode = kode_gusdep;

      } else if (session.user.role === "USER_KWARAN") {
        if (!session.user.kode_kwaran) {
          return NextResponse.json({ message: "Missing kode_kwaran in session" }, { status: 400 });
        }
        const gusdepList = await getGusdepKodeByRegion(session.user.kode_kwaran, true);
        if (!gusdepList.includes(kode_gusdep)) {
          return NextResponse.json({ message: "Forbidden: Gusdep not in your wilayah" }, { status: 403 });
        }
        whereClause.gusdepKode = kode_gusdep;

      } else if (session.user.role === "USER_GUSDEP") {
        if (kode_gusdep !== session.user.kode_gusdep) {
          return NextResponse.json({ message: "Forbidden: Can only access your own gusdep" }, { status: 403 });
        }
        whereClause.gusdepKode = kode_gusdep;
      }
    }

    // jika tidak pakai query param, tampilkan data milik sendiri
    if (!kode_kwaran && !kode_gusdep) {
      if (session.user.role === "USER_GUSDEP") {
        whereClause.gusdepKode = session.user.kode_gusdep;
      } else if (session.user.role === "USER_KWARAN") {
        whereClause.kwaranKode = session.user.kode_kwaran;
      } else if (session.user.role === "USER_KWARCAB") {
        whereClause.kwarcabKode = session.user.kode_kwarcab;
      }
    }

    const kegiatanList = await prisma.kegiatan.findMany({
      where: {
        ...whereClause,
        ...(searchQuery && {
          OR: [
            { nama_kegiatan: { contains: searchQuery, mode: "insensitive" } },
            { lokasi: { contains: searchQuery, mode: "insensitive" } },
          ],
        }),
      },
      select: {
        id_kegiatan: true,
        nama_kegiatan: true,
        lokasi: true,
        tanggal: true,
        tingkat_kegiatan: true,
      },
      orderBy: { tanggal: "desc" },
      // skip: (page - 1) * limit,
      // take: limit
    });

    return NextResponse.json(kegiatanList);
  } catch (error) {
    console.error("Error retrieving activity:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
