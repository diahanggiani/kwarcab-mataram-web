"use client";
import { Geist, Geist_Mono } from "next/font/google";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
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
import { SuperAdminSidebar } from "@/components/super-admin-sidebar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
          <SuperAdminSidebar />
          <SidebarInset>
            <header className="flex justify-between h-16 shrink-0 items-center gap-5 px-4">
              <div className="flex items-center gap-">
                <SidebarTrigger className="ml-2 mr-2" />
                <Breadcrumb>
                  <BreadcrumbList className="text-base ">
                    <BreadcrumbItem className="hidden md:block">
                      <BreadcrumbLink href="#">Super Admin</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator className="hidden md:block" />
                    <BreadcrumbItem>
                      <BreadcrumbPage>Data Fetching</BreadcrumbPage>
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
                        src="https://github.com/shadcn.png"
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
                  className="flex flex-col items-center h-75 w-80 bg-amber-950 text-white"
                >
                  <DropdownMenuLabel>
                    <Avatar className="h-24 w-24 mt-4">
                      <AvatarImage src="https://github.com/shadcn.png" />
                      <AvatarFallback>CN</AvatarFallback>
                    </Avatar>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-bold text-xl capitalize text-center">
                    Super Admin
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Button
                      variant="default"
                      size="sm"
                      className="w-36  bg-white hover:bg-gray-100 text-black "
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
