import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { Prisma, Role, User } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hash } from "bcrypt";

// keperluan testing (nanti dihapus)
// import { getSessionOrToken } from "@/lib/getSessionOrToken";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // keperluan testing (nanti dihapus)
  // const session = await getSessionOrToken(req);
  // console.log("SESSION DEBUG:", session);

  // session yang asli (nanti uncomment)
  const session = await getServerSession(authOptions);

  if (!session || session.user.role === "USER_SUPERADMIN") {
    return NextResponse.json(
      {
        message:
          "Unauthorized: Only 'Kwarcab/Kwaran/Gusdep' users can delete account",
      },
      { status: 403 }
    );
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const { username, password, kode } = body;
    const nama = body.nama?.trim();

    if (!username && !password && !nama && !kode) {
      return NextResponse.json(
        { message: "At least one field is required" },
        { status: 400 }
      );
    }

    const targetUser = await prisma.user.findUnique({
      where: { id },
      include: {
        kwaran: true,
        gugusDepan: true,
      },
    });

    if (!targetUser) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    if (username && !/^\S+$/.test(username)) {
      return NextResponse.json(
        { message: "Username cannot contain spaces" },
        { status: 400 }
      );
    }

    if (kode && !/^\S+$/.test(kode)) {
      return NextResponse.json(
        { message: "Kode cannot contain spaces" },
        { status: 400 }
      );
    }

    if (
      password &&
      !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,}$/.test(password)
    ) {
      return NextResponse.json(
        {
          message:
            "Password must be at least 8 characters long, contain uppercase, lowercase letters, and numbers.",
        },
        { status: 400 }
      );
    }

    // validasi username
    if (username) {
      const existingUser = await prisma.user.findUnique({
        where: { username },
      });
      if (existingUser && existingUser.id !== id) {
        // supaya tidak menolak jika user tetap pakai username miliknya sendiri (saat tidak mengubah username)
        return NextResponse.json(
          { message: "Username already exists" },
          { status: 400 }
        );
      }
    }

    // validasi nama & kode
    if ((nama || kode) && targetUser.role === Role.USER_KWARAN) {
      const orClause: Prisma.KwaranWhereInput[] = [];

      if (nama) orClause.push({ nama_kwaran: nama });
      if (kode) orClause.push({ kode_kwaran: kode });

      const existingKwaran = await prisma.kwaran.findFirst({
        where: {
          OR: orClause,
          NOT: { kode_kwaran: targetUser.kwaran?.kode_kwaran }, // exclude current record
        },
      });

      if (existingKwaran) {
        return NextResponse.json(
          {
            message:
              "This code and name are already taken. Please use different values.",
          },
          { status: 400 }
        );
      }
    }

    if ((nama || kode) && targetUser.role === Role.USER_GUSDEP) {
      const orClause: Prisma.GugusDepanWhereInput[] = [];

      if (nama) orClause.push({ nama_gusdep: nama });
      if (kode) orClause.push({ kode_gusdep: kode });

      const existingGusdep = await prisma.gugusDepan.findFirst({
        where: {
          OR: orClause,
          NOT: { kode_gusdep: targetUser.gugusDepan?.kode_gusdep },
        },
      });

      if (existingGusdep) {
        return NextResponse.json(
          {
            message:
              "This code and name are already taken. Please use different values.",
          },
          { status: 400 }
        );
      }
    }

    // hanya creator yang bisa edit akun
    if (targetUser.createdById !== session.user.id) {
      return NextResponse.json(
        { message: "Not creator of this account" },
        { status: 403 }
      );
    }

    // const updateData: Partial<{ username: string; password: string }> = {};
    const updateData: Partial<User> = {};
    // let updateData: any = {};
    if (username) updateData.username = username;

    if (password) {
      const hashed = await hash(password, 10);
      updateData.password = hashed;
    }

    // update entitas terkait
    if (session.user.role === Role.USER_KWARCAB && targetUser.kwaran) {
      await prisma.kwaran.update({
        where: { kode_kwaran: targetUser.kwaran.kode_kwaran },
        data: {
          ...(nama && { nama_kwaran: nama }),
          ...(kode && { kode_kwaran: kode }),
        },
      });
    } else if (
      session.user.role === Role.USER_KWARAN &&
      targetUser.gugusDepan
    ) {
      await prisma.gugusDepan.update({
        where: { kode_gusdep: targetUser.gugusDepan.kode_gusdep },
        data: {
          ...(nama && { nama_gusdep: nama }),
          ...(kode && { kode_gusdep: kode }),
        },
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      message: "User updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // keperluan testing (nanti dihapus)
  // const session = await getSessionOrToken(req);
  // console.log("SESSION DEBUG:", session);

  // session yang asli (nanti uncomment)
  const session = await getServerSession(authOptions);

  if (!session || session.user.role === "USER_SUPERADMIN") {
    return NextResponse.json(
      {
        message:
          "Unauthorized: Only 'Kwarcab/Kwaran/Gusdep' users can delete account",
      },
      { status: 403 }
    );
  }

  try {
    // const userIdToDelete = params.id;
    const { id } = await params;

    const targetUser = await prisma.user.findUnique({
      where: { id },
      include: {
        kwarcab: true,
        kwaran: {
          include: { kwarcab: true },
        },
        gugusDepan: {
          include: {
            kwaran: {
              include: { kwarcab: true },
            },
          },
        },
      },
    });

    if (!targetUser) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // hanya bisa hapus user yang dibuat oleh dirinya
    if (targetUser.createdById !== session.user.id) {
      return NextResponse.json(
        { message: "Not creator of this account" },
        { status: 403 }
      );
    }

    // cek hierarki role
    const canDelete =
      // kwarcab dapat menghapus akun role kwaran yang berada di bawah naungannya
      (session.user.role === Role.USER_KWARCAB &&
        targetUser.role === Role.USER_KWARAN &&
        targetUser.kwaran?.kwarcabKode === session.user.kode_kwarcab) ||
      // kwaran dapat menghapus akun role gusdep yang berada di bawah naungannya
      (session.user.role === Role.USER_KWARAN &&
        targetUser.role === Role.USER_GUSDEP &&
        targetUser.gugusDepan?.kwaranKode === session.user.kode_kwaran);

    if (!canDelete) {
      return NextResponse.json(
        { message: "You are not authorized to delete this user" },
        { status: 403 }
      );
    }

    // hapus user
    await prisma.user.delete({ where: { id } });

    return NextResponse.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
