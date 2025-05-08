/**
config utama NextAuth untuk setup:
- provider (CredentialsProvider)
- logic login (authorize)
- adapter ke Prisma
- session strategy (jwt)
- custom callback (jwt, session)
- halaman login custom (signIn)
*/

import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./db";
import { compare } from "bcrypt";

// konfigurasi next-auth
export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(prisma),
    secret: process.env.NEXTAUTH_SECRET,
    session: {
        strategy: "jwt",
        maxAge: 60*60,
        updateAge: 60*60
    },
    pages: {
        signIn: "/login",
    },
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                username: { label: "Username", type: "text", placeholder: "jsmith" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if(!credentials?.username || !credentials?.password) {
                    console.log("Username or password not provided");
                    return null
                }

                const existingUser = await prisma.user.findUnique({
                    where: { username: credentials?.username },
                    // keperluan testing (nanti dihapus)
                    include: {
                        kwarcab: true,
                        kwaran: true,
                        gugusDepan: true
                    // batas keperluan testing
                    }

                    // select: {
                    //     id: true,
                    //     username: true,
                    //     password: true,
                    //     role: true,
                    //     kwarcab: { select: { kode_kwarcab: true } },
                    //     kwaran: { select: { kode_kwaran: true } },
                    //     gugusDepan: { select: { kode_gusdep: true } }
                    // }
                });
                if(!existingUser) {
                    console.log("User not found");
                    return null;
                }

                const passwordMatch = await compare(credentials.password, existingUser.password);
                if(!passwordMatch) {
                    console.log("Password not match");
                    return null;
                }

                return {
                    id: existingUser.id,
                    username: existingUser.username,
                    role: existingUser.role,
                    // keperluan testing (nanti dihapus)
                    kode_kwarcab: existingUser.kwarcab?.kode_kwarcab || undefined,
                    kode_kwaran: existingUser.kwaran?.kode_kwaran || undefined,
                    kode_gusdep: existingUser.gugusDepan?.kode_gusdep || undefined,
                    // batas keperluan testing
                }
            }
        })
    ],
    callbacks: {
        async jwt({ token, user }) {
            console.log(token, user);
            if(user) {
                return {
                    ...token,
                    id: user.id,
                    username: user.username,
                    role: user.role,
                    kode_kwarcab: user.kode_kwarcab,
                    kode_kwaran: user.kode_kwaran,
                    kode_gusdep: user.kode_gusdep,
                }
            }

            // keperluan testing (nanti dihapus)
            else if (token.sub) {
                const existingUser = await prisma.user.findUnique({
                    where: { id: token.sub },
                    select: {
                        id: true,
                        username: true,
                        role: true,
                        kwarcab: true,
                        kwaran: true,
                        gugusDepan: true
                    }
                });

                if (existingUser) {
                    token.id = existingUser.id;
                    token.username = existingUser.username;
                    token.role = existingUser.role;
                    token.kode_kwarcab = existingUser.kwarcab?.kode_kwarcab;
                    token.kode_kwaran = existingUser.kwaran?.kode_kwaran;
                    token.kode_gusdep = existingUser.gugusDepan?.kode_gusdep;
                }
            } // batas keperluan testing

            return token
        },
        async session({ session, token }) {
            console.log(token);
            return {
                ...session,
                user: {
                    ...session.user,
                    id: token.id,
                    username: token.username,
                    role: token.role,
                    kode_kwarcab: token.kode_kwarcab,
                    kode_kwaran: token.kode_kwaran,
                    kode_gusdep: token.kode_gusdep,
                }
            }
            return session
        },
    }
}
