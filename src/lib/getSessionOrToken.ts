import { getServerSession } from "next-auth";
import { getToken } from "next-auth/jwt";
import { authOptions } from "./auth";
import { NextRequest } from "next/server";

export async function getSessionOrToken(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (session) return session;

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) return null;

  return {
    user: {
      id: token.id,
      username: token.username,
      role: token.role,
      kode_kwarcab: token.kode_kwarcab,
      kode_kwaran: token.kode_kwaran,
      kode_gusdep: token.kode_gusdep,
    },
    expires: token.exp ? new Date(Number(token.exp) * 1000).toISOString() : null,
  };
}
