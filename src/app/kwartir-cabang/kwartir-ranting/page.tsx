"use client";
import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSession } from "next-auth/react";

type KwartirCabangData = {
  kode_kwarcab: string;
  nama_kwarcab: string;
  alamat: string;
  kepala_kwarcab: string;
  foto_kwarcab: string;
  userId: string;
};

type KwartirRanting = {
  kode_kwaran: string;
  nama_kwaran: string;
  alamat: string;
  kepala_kwaran: string;
  foto_kwaran: string | null;
  userId: string;
};

export default function KwartirRanting() {
  const { data: session } = useSession();
  const [kwaran, setKwaran] = useState<KwartirRanting[]>([]);
  const [profile, setProfile] = useState<KwartirCabangData | null>(null);
  const [mounted, setMounted] = useState(false);

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
        const res = await fetch("/api/kwaran", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });
        if (res.ok) {
          const data = await res.json();
          setKwaran(data);
        }
      }
    };
    setMounted(true);
    fetchGugusDepan();
    fetchProfile();
  }, [session]);

  if (!mounted || !session || !profile || !kwaran) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Card className="p-6 flex items-center gap-4">
          <Loader2 className="animate-spin w-6 h-6" />
          <CardContent className="text-lg font-semibold">
            Memuat data Kwartir Ranting...
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full mx-auto p-6 bg-gray-150 rounded-lg shadow-lg">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4 uppercase">
          DAFTAR KWARTIR RANTING {profile?.nama_kwarcab}
        </h1>
        <h2 className="text-xl font-semibold capitalize">
          Temukan Berbagai Kwartir Ranting {profile?.nama_kwarcab}
        </h2>
      </div>
      <div className="space-y-8">
        {kwaran.map((kwaran) => (
          <Link
            href={`/kwartir-cabang/kwartir-ranting/${kwaran.kode_kwaran}`}
            key={kwaran.kode_kwaran}
          >
            <Card className="bg-amber-950 text-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 mb-4">
              <CardContent className="flex items-center w-full gap-4">
                <Avatar className="h-36 w-36">
                  <AvatarImage
                    src={kwaran.foto_kwaran || "https://github.com/shadcn.png"}
                  />
                  <AvatarFallback>KwartirRantingProfile</AvatarFallback>
                </Avatar>
                <div className="ml-4">
                  <h2 className="text-3xl font-bold">{kwaran.nama_kwaran}</h2>
                  <p className="text-xl">{kwaran.alamat}</p>
                  <p className="text-xl">{kwaran.kode_kwaran}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
