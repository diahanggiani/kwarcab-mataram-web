/**
handler utama NextAuth. semua request auth seperti:
- login (POST /api/auth/callback/credentials)
- logout (GET /api/auth/signout)
- ambil session (GET /api/auth/session) … akan diarahkan ke file ini
*/

import { authOptions } from "@/lib/auth";
import NextAuth from "next-auth";

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };