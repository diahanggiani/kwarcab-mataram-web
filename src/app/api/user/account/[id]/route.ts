import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { Role } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// keperluan testing (nanti dihapus)
// import { getSessionOrToken } from "@/lib/getSessionOrToken";

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    // keperluan testing (nanti dihapus)
    // const session = await getSessionOrToken(req);
    // console.log("SESSION DEBUG:", session);

    // session yang asli (nanti uncomment)
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role === "USER_SUPERADMIN") {
        return NextResponse.json({ message: "Unauthorized: Only 'Kwarcab/Kwaran/Gusdep' users can delete account" }, { status: 403 });
    }

    try {
        // const userIdToDelete = params.id;
        const { id } = await params;

        const targetUser = await prisma.user.findUnique({
            where: { id },
            include: {
                kwarcab: true,
                kwaran: {
                    include: { kwarcab: true }
                },
                gugusDepan: {
                    include: {
                        kwaran: {
                            include: { kwarcab: true }
                        }
                    }
                }
            },
        });

        if (!targetUser) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        // hanya bisa hapus user yang dibuat oleh dirinya
        if (targetUser.createdById !== session.user.id) {
            return NextResponse.json({ message: "Not creator of this account" }, { status: 403 });
        }

        // cek hierarki role
        const canDelete = (
            // kwarcab dapat menghapus akun role kwaran yang berada di bawah naungannya
            (session.user.role === Role.USER_KWARCAB && targetUser.role === Role.USER_KWARAN && targetUser.kwaran?.kwarcabKode === session.user.kode_kwarcab)
            ||
            // kwaran dapat menghapus akun role gusdep yang berada di bawah naungannya
            (session.user.role === Role.USER_KWARAN && targetUser.role === Role.USER_GUSDEP && targetUser.gugusDepan?.kwaranKode === session.user.kode_kwaran)
        );

        if (!canDelete) {
            return NextResponse.json({ message: 'You are not authorized to delete this user' }, { status: 403 });
        }

        // hapus user
        await prisma.user.delete({ where: { id } });

        return NextResponse.json({ message: 'User deleted successfully' });

    } catch (error) {
        console.error('Error deleting user:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
