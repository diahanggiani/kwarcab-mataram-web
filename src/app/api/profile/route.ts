import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import supabase from "@/lib/supabase";
import path from "path";
import { hash } from "bcrypt";
import { compare } from "bcrypt";
import { randomUUID } from "crypto";

// keperluan testing (nanti dihapus)
// import { getSessionOrToken } from "@/lib/getSessionOrToken";

export async function GET(req: NextRequest) {
  // keperluan testing (nanti dihapus)
  // const session = await getSessionOrToken(req);

  // session yang asli (nanti uncomment)
  const session = await getServerSession(authOptions);

  try {
    const { searchParams } = new URL(req.url);
    const kode_gusdep = searchParams.get("kode_gusdep");
    const kode_kwaran = searchParams.get("kode_kwaran");
    const kode_kwarcab = searchParams.get("kode_kwarcab");

    if (kode_gusdep) {
      const gusdep = await prisma.gugusDepan.findUnique({
        where: { kode_gusdep },
        select: {
          kode_gusdep: true,
          nama_gusdep: true,
          alamat: true,
          kepala_sekolah: true,
          npsn: true,
          nama_sekolah: true,
          foto_gusdep: true,
          kwaran: {
            select: { nama_kwaran: true },
          },
        },
      });
      if (!gusdep)
        return NextResponse.json({ message: "Gugus depan not found" }, { status: 404 });
      return NextResponse.json(gusdep, { status: 200 });
    }

    if (kode_kwaran) {
      const kwaran = await prisma.kwaran.findUnique({
        where: { kode_kwaran },
        select: {
          kode_kwaran: true,
          nama_kwaran: true,
          alamat: true,
          foto_kwaran: true,
          kwarcab: {
            select: { nama_kwarcab: true },
          },
        },
      });
      if (!kwaran)
        return NextResponse.json({ message: "Kwaran not found" }, { status: 404 });
      return NextResponse.json(kwaran, { status: 200 });
    }

    if (kode_kwarcab) {
      const kwarcab = await prisma.kwarcab.findUnique({
        where: { kode_kwarcab },
        select: {
          kode_kwarcab: true,
          nama_kwarcab: true,
          alamat: true,
          foto_kwarcab: true,
        },
      });
      if (!kwarcab)
        return NextResponse.json({ message: "Kwarcab not found" }, { status: 404 });
      return NextResponse.json(kwarcab, { status: 200 });
    }

    if (!session || session.user.role === "USER_SUPERADMIN") {
      return NextResponse.json({ message: "Unauthorized: Only 'Kwarcab/Kwaran/Gusdep' users can see profile" }, { status: 403 });
    }

    let profile;

    // cek role dan pastikan kode yang sesuai ada dalam token
    if (session.user.role === "USER_GUSDEP") {
      if (!session.user.kode_gusdep) {
        return NextResponse.json({ message: "Gugus depan code not found in token" }, { status: 400 });
      }
      profile = await prisma.gugusDepan.findUnique({
        where: { kode_gusdep: session.user.kode_gusdep },
      });

    } else if (session.user.role === "USER_KWARAN") {
      if (!session.user.kode_kwaran) {
        return NextResponse.json({ message: "Kwaran code not found in token" }, { status: 400 });
      }
      profile = await prisma.kwaran.findUnique({
        where: { kode_kwaran: session.user.kode_kwaran },
      });

    } else if (session.user.role === "USER_KWARCAB") {
      if (!session.user.kode_kwarcab) {
        return NextResponse.json({ message: "Kwarcab code not found in token" }, { status: 400 });
      }
      profile = await prisma.kwarcab.findUnique({
        where: { kode_kwarcab: session.user.kode_kwarcab },
      });

    } else {
      return NextResponse.json({ message: "Role not recognized" }, { status: 403 });
    }

    if (!profile) {
      return NextResponse.json({ message: "Profile not found" }, { status: 404 });
    }
    return NextResponse.json(profile, { status: 200 });
  } catch (error) {
    console.error("Error retrieving data:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  // keperluan testing (nanti dihapus)
  // const session = await getSessionOrToken(req);
  // console.log("SESSION DEBUG:", session);

  // session yang asli (nanti uncomment)
  const session = await getServerSession(authOptions);

  if (!session || session.user.role === "USER_SUPERADMIN") {
    return NextResponse.json({ message: "Unauthorized: Only 'Kwarcab/Kwaran/Gusdep' users can edit profile" }, { status: 403 });
  }

  try {
    const formData = await req.formData();

    const alamat = formData.get("alamat")?.toString().trim();
    const nama_sekolah = formData.get("nama_sekolah")?.toString().trim();
    const npsn = formData.get("npsn")?.toString().trim();

    const kepala_sekolah = formData.get("kepala_sekolah")?.toString().trim();
    const kepala_kwaran = formData.get("kepala_kwaran")?.toString().trim();
    const kepala_kwarcab = formData.get("kepala_kwarcab")?.toString().trim();

    const foto = formData.get("foto") as File | null;

    const role = session.user.role;
    let newFotoUrl: string | undefined = undefined;

    if (foto && foto.size > 0) {
      console.log("FOTO SIZE:", foto?.size);

      // validasi file
      if (!["image/jpeg", "image/png", "image/jpg"].includes(foto.type)) {
        return NextResponse.json({ message: "Only JPG, JPEG, or PNG files are allowed" }, { status: 400 });
      }

      const buffer = Buffer.from(await foto.arrayBuffer());
      const maxSize = 500 * 1024;
      if (buffer.length > maxSize) {
        return NextResponse.json({ message: "File size must be less than 500KB" }, { status: 400 });
      }

      // tentukan ekstensi dan path
      const ext = path.extname(foto.name) || ".jpg" || ".jpeg" || ".png";
      const filename = `${randomUUID()}${ext}`;
      const storagePath = `foto-profil/${filename}`;

      // ambil URL foto lama berdasarkan role
      let oldFotoUrl: string | null | undefined;

      if (role === "USER_GUSDEP") {
        const gusdep = await prisma.gugusDepan.findUnique({
          where: { kode_gusdep: session.user.kode_gusdep },
          select: { foto_gusdep: true },
        });
        oldFotoUrl = gusdep?.foto_gusdep;
      } else if (role === "USER_KWARAN") {
        const kwaran = await prisma.kwaran.findUnique({
          where: { kode_kwaran: session.user.kode_kwaran },
          select: { foto_kwaran: true },
        });
        oldFotoUrl = kwaran?.foto_kwaran;
      } else if (role === "USER_KWARCAB") {
        const kwarcab = await prisma.kwarcab.findUnique({
          where: { kode_kwarcab: session.user.kode_kwarcab },
          select: { foto_kwarcab: true },
        });
        oldFotoUrl = kwarcab?.foto_kwarcab;
      }

      // hapus foto lama dari storage jika ada
      if (oldFotoUrl) {
        const path = oldFotoUrl.split("/").slice(-2).join("/"); // ambil path file
        await supabase.storage.from("image-bucket-nextjs").remove([path]);
      }

      // upload foto baru ke storage
      const { error: uploadError } = await supabase.storage
        .from("image-bucket-nextjs")
        .upload(storagePath, buffer, {
          contentType: foto.type,
          upsert: false,
        });

      if (uploadError) {
        return NextResponse.json(
          { message: "Failed to upload photo", error: uploadError },
          { status: 500 }
        );
      }

      const { data: publicUrlData } = supabase.storage
        .from("image-bucket-nextjs")
        .getPublicUrl(storagePath);

      newFotoUrl = publicUrlData?.publicUrl;
      console.log("Public URL:", newFotoUrl);
    }

    let updated;

    if (role === "USER_GUSDEP") {
      const updateData = {
        alamat,
        npsn,
        nama_sekolah,
        kepala_sekolah,
        ...(newFotoUrl && { foto_gusdep: newFotoUrl }),
      };

      updated = await prisma.gugusDepan.update({
        where: { kode_gusdep: session.user.kode_gusdep },
        data: updateData,
      });

    } else if (role === "USER_KWARAN") {
      const updateData = {
        alamat,
        kepala_kwaran,
        ...(newFotoUrl && { foto_kwaran: newFotoUrl }),
      };

      updated = await prisma.kwaran.update({
        where: { kode_kwaran: session.user.kode_kwaran },
        data: updateData,
      });

    } else if (role === "USER_KWARCAB") {
      const updateData = {
        alamat,
        kepala_kwarcab,
        ...(newFotoUrl && { foto_kwarcab: newFotoUrl }),
      };

      updated = await prisma.kwarcab.update({
        where: { kode_kwarcab: session.user.kode_kwarcab },
        data: updateData,
      });

    } else {
      return NextResponse.json({ message: "Role not recognized" }, { status: 403 });
    }

    return NextResponse.json({ message: "Profile updated successfully", profile: updated }, { status: 200 });
  } catch (error) {
    console.error("Error updating data:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

// handler untuk ubah password
export async function POST(req: NextRequest) {
  // keperluan testing (nanti dihapus)
  // const session = await getSessionOrToken(req);
  // console.log("SESSION DEBUG:", session);

  // session yang asli (nanti uncomment)
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ message: "Unauthorized: Session not found or user is not authenticated" }, { status: 403 });
  }

  try {
    const { currentPassword, newPassword } = await req.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ message: "All fields are required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const passwordMatch = await compare(currentPassword, user.password);
    if (!passwordMatch) {
      return NextResponse.json({ message: "Current password is incorrect" }, { status: 400 });
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return NextResponse.json({ message: "Password must be at least 8 characters long, contain uppercase, lowercase letters, and numbers." }, { status: 400 });
    }

    const hashedPassword = await hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    return NextResponse.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Error updating password:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
