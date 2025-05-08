"use client";
import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Search } from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSession } from "next-auth/react";

type KwartirCabangData = {
  kode_kwarcab: string;
  nama_kwarcab: string;
  alamat: string;
  kepala_kwarcab: string;
  foto_kwarcab: string ;
  userId: string;
};

type GugusDepan = {
  kode_gusdep: string;
  nama_gusdep: string;
  alamat: string;
  foto_gusdep: string | null;
};

export default function GugusDepan() {
  const { data: session } = useSession();
  const [gugusDepan, setGugusDepan] = useState<GugusDepan[]>([]);
  const [profile, setProfile] = useState<KwartirCabangData | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (session) {
        const res = await fetch("/api/profile");
        if (res.ok) {
          const data = await res.json();
          console.log("Profile Data: ", data);
          setProfile(data);
        }
      }
    };

    const fetchGugusDepan = async () => {
      if (session) {
        const res = await fetch(`/api/gusdep?search=${debouncedSearch}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });
        if (res.ok) {
          const data = await res.json();
          setGugusDepan(data);
        }
      }
    };
    setMounted(true);
    fetchGugusDepan();
    fetchProfile();
  }, [session, debouncedSearch]);

  if (!mounted || !session || !profile || !gugusDepan) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Card className="p-6 flex items-center gap-4">
          <Loader2 className="animate-spin w-6 h-6" />
          <CardContent className="text-lg font-semibold">
            Memuat data Gugus Depan...
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full mx-auto p-6 bg-gray-150 rounded-lg shadow-lg">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4 uppercase">
          DAFTAR GUGUS DEPAN {profile?.nama_kwarcab}
        </h1>
        <h2 className="text-xl font-semibold capitalize">
          Temukan Berbagai Gugus Depan {profile?.nama_kwarcab}
        </h2>
      </div>

      <div className="flex justify-between items-center mb-8 w-full">
        <div className="relative w-120">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            type="search"
            placeholder="Search gugus depan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 shadow-sm"
          />
        </div>
      </div>

      <div className="space-y-8">
        {gugusDepan.map((gusdep) => (
          <Link
            href={`/kwartir-cabang/gugus-depan/${gusdep.kode_gusdep}`}
            key={gusdep.kode_gusdep}
          >
            <Card className="bg-amber-950 text-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 mb-4">
              <CardContent className="flex items-center w-full gap-4">
                <Avatar className="h-36 w-36">
                  <AvatarImage
                    src={gusdep.foto_gusdep || "https://github.com/shadcn.png"}
                  />
                  <AvatarFallback>GugusDepanProfile</AvatarFallback>
                </Avatar>
                <div className="ml-4">
                  <h2 className="text-3xl font-bold">{gusdep.nama_gusdep}</h2>
                  <p className="text-xl">{gusdep.alamat}</p>
                  <p className="text-xl">{gusdep.kode_gusdep}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
