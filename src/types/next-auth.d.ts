/**
extend typing bawaan NextAuth, supaya session.user dan token bisa menyimpan properti tambahan seperti:
- username
- nanti bisa ditambah role, kodeKwarcab, dsb.
*/

// deklarasi tipe next-auth
// import NextAuth from "next-auth"
import { DefaultSession, DefaultUser } from "next-auth";
import { JWT as DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  // data yang direturn dari authorize() di credentials provider (lib/auth.ts)
  interface User extends DefaultUser {
    id: string;
    username: string;
    role: string;
    kode_kwarcab?: string;
    kode_kwaran?: string;
    kode_gusdep?: string;
  }
  // data yang akan muncul saat akses session, baik di server maupun client
  interface Session extends DefaultSession {
    user: User;
    // user: User & {
    //     id: string
    //     username: string
    // }
    // token: {
    //     id: string
    //     username: string
    // }
  }
}

// keperluan testing (nanti dihapus)
declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string;
    username: string;
    role: string;
    kode_kwarcab?: string;
    kode_kwaran?: string;
    kode_gusdep?: string;
  }
} // batas keperluan testing
