/**
- cek apakah user sudah login (via session)
- debug di frontend sebelum fetch data
- basic route auth check
*/
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

// export const GET = async (req: Request) => {
export const GET = async () => {
    const session = await getServerSession(authOptions);

    return NextResponse.json({ authenticated: !!session }, { status: 200 });
}
