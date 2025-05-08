"use client";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent } from "@/components/ui/card";
import { Eye, Loader2 } from "lucide-react";
import Link from "next/link";

type KwartirRanting = {
  kode_kwaran: string;
  nama_kwaran: string;
  alamat: string | null;
  kepala_kwaran: string | null;
  foto_kwaran: string | null;
  userId: string;
};

type KegiatanData = {
  id_kegiatan: string;
  nama_kegiatan: string;
  lokasi: string;
  tingkat_kegiatan: string;
};

export default function DetailGugusDepan() {
  const { id } = useParams();
  const { data: session } = useSession();
  const [profile, setProfile] = useState<KwartirRanting | null>(null);
  const [kegiatan, setKegiatan] = useState<KegiatanData[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (session) {
        const response = await fetch(`/api/profile?kode_kwaran=${id}`);
        if (response.ok) {
          const data: KwartirRanting = await response.json();
          setProfile(data);
        }
      }
    };

    const fethKegiatan = async () => {
      if (session) {
        const response = await fetch(`/api/kegiatan?kode_kwaran=${id}`);
        if (response.ok) {
          const data = await response.json();
          setKegiatan(data);
        }
      }
    };
    setMounted(true);
    fetchProfile();
    fethKegiatan();
  }, [id, session]);

  if (!mounted || !session || !profile || !kegiatan) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Card className="p-6 flex items-center gap-4">
          <Loader2 className="animate-spin w-6 h-6" />
          <CardContent className="text-lg font-semibold">
            Memuat detail Kwartir Ranting...
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-12 mb-6">
        <Avatar className="h-48 w-48">
          <AvatarImage
            src={profile?.foto_kwaran || "https://github.com/shadcn.png"}
          />
          <AvatarFallback>CN</AvatarFallback>
        </Avatar>
        <div className="flex flex-col uppercase leading-tight gap-1">
          <span className="font-bold text-2xl tracking-wide">
            {profile?.kode_kwaran}
          </span>
          <span className="font-bold text-3xl tracking-wide">
            {profile?.nama_kwaran}
          </span>
          <span className="text-base tracking-widest">
            {profile?.alamat || "Alamat Kwartir Ranting"}
          </span>
          <span className="text-base tracking-widest">
            {profile?.kepala_kwaran || "Kepala Kwartir Ranting"}
          </span>
        </div>
      </div>

      <Accordion type="multiple">
        <AccordionItem value="kegiatan">
          <AccordionTrigger className="text-xl font-bold">
            DAFTAR KEGIATAN
          </AccordionTrigger>
          <AccordionContent>
            {kegiatan.length > 0 ? (
              kegiatan.map((kegiatan, index) => (
                <Card
                  key={index}
                  className="bg-amber-950 text-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 mb-4"
                >
                  <CardContent className="flex justify-between items-center w-full">
                    <div>
                      <h2 className="text-2xl font-bold">
                        {kegiatan.nama_kegiatan}
                      </h2>
                      <h3 className="text-lg">{kegiatan.lokasi}</h3>
                      <h3 className="text-md">{kegiatan.tingkat_kegiatan}</h3>
                    </div>
                    <div className="flex gap-4">
                      <Link
                        href={`/kwartir-cabang/kwartir-ranting/${id}/${kegiatan.id_kegiatan}`}
                        className="text-white hover:text-gray-300"
                      >
                        <Eye className="h-6 w-6 cursor-pointer text-white hover:text-gray-300" />
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <p className="text-center text-gray-500">
                Tidak ada kegiatan yang tersedia.
              </p>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
