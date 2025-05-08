import * as React from "react";
import { icons } from "lucide-react";
import Link from "next/link";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import Image from "next/image";

const data = {
  navMain: [
    {
      title: "Dashboard",
      icons: icons.Gauge,
      url: "/gugus-depan/dashboard",
    },
    {
      title: "Pembina",
      icons: icons.User,
      url: "/gugus-depan/pembina",
    },
    {
      title: "Anggota",
      icons: icons.UsersRound,
      url: "/gugus-depan/anggota",
    },
    {
      title: "Kegiatan",
      icons: icons.Tent,
      url: "/gugus-depan/kegiatan",
    },
    {
      title: "Nomor Tanda Anggota",
      url: "/gugus-depan/pengajuan/formulir",
      icons: icons.ClipboardList,
      items: [
        {
          title: "Formulir NTA",
          url: "/gugus-depan/pengajuan/formulir",
        },
        {
          title: "Status NTA",
          url: "/gugus-depan/pengajuan/status",
        },
      ],
    },
  ],
};

export function GugusDepanSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar variant="sidebar" collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link
                href="/gugus-depan/dashboard"
                className="flex items-center gap-3 px-4 py-2 rounded-lg"
              >
                <div className="flex items-center gap-2 text-white">
                  {/* Logo seperti ikon */}
                  <div className="h-8 w-8 flex items-center justify-center rounded">
                    <Image
                      src="/Pramuka.png"
                      alt="Logo"
                      width={18}
                      height={18}
                      className="object-contain"
                    />
                  </div>

                  {/* Teks seperti title */}
                  <span className="flex flex-col uppercase leading-tight">
                    <span className="font-bold text-lg tracking-wide">
                      KWARCAB
                    </span>
                    <span className="text-sm tracking-widest">MATARAM</span>
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu className="gap-2 mt-4">
            {data.navMain.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild>
                  <Link
                    href={item.url}
                    className="text-base flex items-center gap-2"
                  >
                    <item.icons className="h-5 w-5" /> {item.title}
                  </Link>
                </SidebarMenuButton>
                {item.items?.length ? (
                  <SidebarMenuSub className="ml-6 border-l-0 px-1.5">
                    {item.items.map((subItem) => (
                      <SidebarMenuSubItem key={subItem.title}>
                        <SidebarMenuSubButton asChild>
                          <Link href={subItem.url} className="text-sm">
                            {subItem.title}
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                ) : null}
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
