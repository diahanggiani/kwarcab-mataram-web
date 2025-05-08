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
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Eye, Loader2 } from "lucide-react";
import Link from "next/link";

type GugusDepanData = {
  kode_gusdep: string;
  nama_gusdep: string;
  alamat: string | null;
  npsn: string | null;
  nama_sekolah: string | null;
  kepala_sekolah: string | null;
  foto_gusdep: string | null;
};

type AnggotaData = {
  id_anggota: string;
  nta: string;
  nama_agt: string;
  tgl_lahir: string;
  tahun_gabung: number;
  gender: "LAKI_LAKI" | "PEREMPUAN";
  agama: string;
  alamat: string;
  status_agt: string;
  jenjang_agt: string;
};

type PembinaData = {
  id_pembina: string;
  nta: string;
  nama_pbn: string;
  tgl_lahir: string;
  gender: "LAKI_LAKI" | "PEREMPUAN";
  agama: string;
  alamat: string;
  jenjang_pbn: string;
};

type KegiatanData = {
  id_kegiatan: string;
  nama_kegiatan: string;
  lokasi: string;
  tingkat_kegiatan: string;
};

function DetailGugusDepan() {
  const { id } = useParams();
  const { data: session } = useSession();
  const [profile, setProfile] = useState<GugusDepanData | null>(null);
  const [anggota, setAnggota] = useState<AnggotaData[]>([]);
  const [pembina, setPembina] = useState<PembinaData[]>([]);
  const [kegiatan, setKegiatan] = useState<KegiatanData[]>([]);
  const [jenjang, setJenjang] = useState<{ [key: string]: string }>({});
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (session) {
        const response = await fetch(`/api/profile?kode_gusdep=${id}`);
        if (response.ok) {
          const data: GugusDepanData = await response.json();
          setProfile(data);
        }
      }
    };

    const fetchMembers = async () => {
      const res = await fetch(`/api/anggota?kode_gusdep=${id}`);
      if (res.ok) {
        const data = await res.json();
        setAnggota(data);
        data.forEach((anggotaItem: AnggotaData) => {
          if (anggotaItem.id_anggota) {
            fetchJenjang(anggotaItem.id_anggota);
          }
        });
      }
    };

    const fetchJenjang = async (id_anggota: string) => {
      try {
        const res = await fetch(`/api/anggota/${id_anggota}/riwayat-jenjang`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            const sortedJenjang = data.sort(
              (a, b) =>
                new Date(b.tgl_perubahan).getTime() -
                new Date(a.tgl_perubahan).getTime()
            );
            setJenjang((prev) => ({
              ...prev,
              [id_anggota]: sortedJenjang[0]?.jenjang_agt || "-",
            }));
          }
        }
      } catch (error) {
        console.error("Fetch jenjang error", error);
      }
    };

    const fetchPembina = async () => {
      if (session) {
        const response = await fetch(`/api/pembina?kode_gusdep=${id}`);
        if (response.ok) {
          const data = await response.json();
          setPembina(data);
        }
      }
    };

    const fethKegiatan = async () => {
      if (session) {
        const response = await fetch(`/api/kegiatan?kode_gusdep=${id}`);
        if (response.ok) {
          const data = await response.json();
          setKegiatan(data);
        }
      }
    };

    setMounted(true);
    fetchProfile();
    fetchMembers();
    fetchPembina();
    fethKegiatan();
  }, [id, session]);

  
  if (
    !mounted ||
    !session ||
    !profile ||
    !anggota ||
    !pembina ||
    !kegiatan ||
    !jenjang
  ) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Card className="p-6 flex items-center gap-4">
          <Loader2 className="animate-spin w-6 h-6" />
          <CardContent className="text-lg font-semibold">
            Memuat detail Gugus Depan...
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
            src={profile?.foto_gusdep || "https://github.com/shadcn.png"}
          />
          <AvatarFallback>CN</AvatarFallback>
        </Avatar>
        <div className="flex flex-col uppercase leading-tight gap-1">
          <span className="font-bold text-2xl tracking-wide">
            {profile?.kode_gusdep}
          </span>
          <span className="font-bold text-3xl tracking-wide">
            {profile?.nama_gusdep}
          </span>
          <span className="text-2xl font-bold">
            {profile?.nama_sekolah || "Nama Sekolah"}
          </span>
          <span className="text-base tracking-widest">
            {profile?.alamat || "Alamat Sekolah"}
          </span>
          <span className="text-base tracking-widest">
            {profile?.kepala_sekolah || "Kepala Sekolah"}
          </span>
          <span className="text-base tracking-widest">
            {profile?.npsn || "NPSN"}
          </span>
        </div>
      </div>

      <Accordion type="multiple">
        <AccordionItem value="pembina">
          <AccordionTrigger className="text-xl font-bold">
            PEMBINA GUGUS DEPAN
          </AccordionTrigger>
          <AccordionContent>
            <Table className="border rounded-lg overflow-hidden">
              <TableHeader>
                <TableRow>
                  <TableHead className="text-center font-bold">Nama</TableHead>
                  <TableHead className="text-center font-bold">NTA</TableHead>
                  <TableHead className="text-center font-bold">
                    Tanggal Lahir
                  </TableHead>
                  <TableHead className="text-center font-bold">
                    Gender
                  </TableHead>
                  <TableHead className="text-center font-bold">Agama</TableHead>
                  <TableHead className="text-center font-bold">
                    Jenjang
                  </TableHead>
                  <TableHead className="text-center font-bold">
                    Alamat
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pembina.length > 0 ? (
                  pembina.map((pembina, index) => (
                    <TableRow
                      key={index}
                      className={index % 2 === 0 ? "bg-gray-300" : "bg-white"}
                    >
                      <TableCell className="text-center font-medium">
                        {pembina.nama_pbn}
                      </TableCell>
                      <TableCell className="text-center">
                        {pembina.nta}
                      </TableCell>
                      <TableCell className="text-center">
                        {new Date(pembina.tgl_lahir).toLocaleDateString(
                          "id-ID"
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {pembina.gender}
                      </TableCell>
                      <TableCell className="text-center">
                        {pembina.agama}
                      </TableCell>
                      <TableCell className="text-center">
                        {pembina.jenjang_pbn}
                      </TableCell>
                      <TableCell className="text-center">
                        {pembina.alamat}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center font-medium text-gray-500"
                    >
                      Tidak ada data pembina.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="anggota">
          <AccordionTrigger className="text-xl font-bold">
            DAFTAR ANGGOTA GUGUS DEPAN
          </AccordionTrigger>
          <AccordionContent>
            <Table className="border rounded-lg overflow-hidden">
              <TableHeader>
                <TableRow>
                  <TableHead className="text-center font-bold">Nama</TableHead>
                  <TableHead className="text-center font-bold">NTA</TableHead>
                  <TableHead className="text-center font-bold">
                    Tanggal Lahir
                  </TableHead>
                  <TableHead className="text-center font-bold">
                    Gender
                  </TableHead>
                  <TableHead className="text-center font-bold">Agama</TableHead>
                  <TableHead className="text-center font-bold">
                    Jenjang
                  </TableHead>
                  <TableHead className="text-center font-bold">
                    Alamat
                  </TableHead>
                  <TableHead className="text-center font-bold">
                    Tahun Gabung
                  </TableHead>
                  <TableHead className="text-center font-bold">
                    Status
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {anggota.length > 0 ? (
                  anggota.map((anggota, index) => (
                    <TableRow
                      key={index}
                      className={index % 2 === 0 ? "bg-gray-300" : "bg-white"}
                    >
                      <TableCell className="text-center font-medium">
                        {anggota.nama_agt}
                      </TableCell>
                      <TableCell className="text-center">
                        {anggota.nta}
                      </TableCell>
                      <TableCell className="text-center">
                        {new Date(anggota.tgl_lahir).toLocaleDateString(
                          "id-ID"
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {anggota.gender}
                      </TableCell>
                      <TableCell className="text-center">
                        {anggota.agama}
                      </TableCell>
                      <TableCell className="text-center">
                        {jenjang[anggota.id_anggota] || "-"}
                      </TableCell>
                      <TableCell className="text-center">
                        {anggota.alamat}
                      </TableCell>
                      <TableCell className="text-center">
                        {anggota.tahun_gabung}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center">
                          <Badge
                            className={`w-24 text-center capitalize ${
                              anggota.status_agt === "AKTIF"
                                ? "bg-green-500 text-white"
                                : "bg-red-500 text-white"
                            }`}
                          >
                            {anggota.status_agt}
                          </Badge>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      className="text-center font-medium text-gray-500"
                    >
                      Tidak ada data anggota.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </AccordionContent>
        </AccordionItem>
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
                        href={`/kwartir-ranting/gugus-depan/${id}/${kegiatan.id_kegiatan}`}
                        className="text-white hover:text-gray-300"
                      >
                        <Eye
                          href={`/kwartir-ranting/gugus-depan/${id}/${kegiatan.id_kegiatan}`}
                          className="h-6 w-6 cursor-pointer text-white hover:text-gray-300"
                        />
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center font-medium text-gray-500">
                Tidak ada data kegiatan.
              </div>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

export default DetailGugusDepan;
