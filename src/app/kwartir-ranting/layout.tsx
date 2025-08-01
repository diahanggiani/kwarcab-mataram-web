"use client";
import { Geist, Geist_Mono } from "next/font/google";
import { useSession } from "next-auth/react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
} from "@/components/ui/breadcrumb";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { KwaranSidebar } from "@/components/kwartir-ranting-sidebar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

type KwartriRantingData = {
  kode_kwaran: string;
  nama_kwaran: string;
  alamat: string;
  kepala_kwaran: string;
  foto_kwaran: string;
  userId: string;
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { data: session } = useSession();
  const [profile, setProfile] = useState<KwartriRantingData | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (session) {
        const res = await fetch("/api/profile", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (res.ok) {
          const data = await res.json();
          console.log("Profile data:", data);
          setProfile(data);
        }
      }
    };

    fetchProfile();
  }, [session]);
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {" "}
        {/* ⬅️ Langsung bungkus di sini */}
        <SidebarProvider
          style={
            {
              "--sidebar-width": "20rem",
            } as React.CSSProperties
          }
        >
          <KwaranSidebar />
          <SidebarInset>
            <header className="flex justify-between h-16 shrink-0 items-center gap-5 px-4">
              <div className="flex items-center gap-">
                <SidebarTrigger className="ml-2 mr-2" />
                <Breadcrumb>
                  <BreadcrumbList className="text-base ">
                    <BreadcrumbItem className="hidden md:block">
                      <BreadcrumbLink href="#">Kwartir Ranting</BreadcrumbLink>
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="overflow-hidden rounded-full h-12 w-12"
                  >
                    <Avatar className="h-16 w-16 ring-gray-100">
                      <AvatarImage
                        src={
                          profile?.foto_kwaran ||
                          "https://github.com/shadcn.png"
                        }
                        alt="Foto Profil"
                        className="object=cover"
                      />
                      <AvatarFallback className="font-semibold text-gray-500 bg-gray-100">
                        CN
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="flex flex-col items-center h-90 w-105 bg-amber-950"
                >
                  <DropdownMenuLabel>
                    <Avatar className="h-24 w-24 mt-4">
                      <AvatarImage
                        src={
                          profile?.foto_kwaran ||
                          "https://github.com/shadcn.png"
                        }
                      />
                      <AvatarFallback>CN</AvatarFallback>
                    </Avatar>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-semibold text-lg uppercase text-center text-white pointer-events-none">
                    {profile?.nama_kwaran}
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-semibold text-lg uppercase text-center text-white pointer-events-none">
                    {profile?.kode_kwaran}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Link href="/kwartir-ranting/profile">
                      <Button
                        variant="default"
                        size="sm"
                        className="w-36 bg-white hover:bg-gray-200 text-black transition-colors duration-200"
                      >
                        Lihat Profil
                      </Button>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Button
                      variant="default"
                      size="sm"
                      className="w-36 bg-white hover:bg-gray-200 text-black transition-colors duration-200"
                      onClick={() => signOut({ callbackUrl: "/login" })}
                    >
                      Keluar
                    </Button>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </header>
            <hr className="border-t border-gray-300" />
            <div>
              <main className="m-8">{children}</main>
            </div>
          </SidebarInset>
        </SidebarProvider>
      </body>
    </html>
  );
}
