"use client";
import React from "react";
import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
// import Link from "next/link";
import { Loader2, Upload } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";

type KegiatanData = {
  id_kegiatan: string;
  nama_kegiatan: string;
  deskripsi: string;
  lokasi: string;
  tingkat_kegiatan: string;
  laporan: string;
  tanggal: string;
  gusdepKode: string | null;
  kwaranKode: string | null;
  kwarcabKode: string | null;
  partisipan: {
    anggotaId: string;
    kegiatanId: string;
    anggota: {
      nta: string;
      nama_agt: string;
      jenjang_agt: string;
    };
  }[];
};

export default function DetailKegiatan() {
  const { id, idKegiatan } = useParams();
  const [kegiatan, setKegiatan] = useState<KegiatanData | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const fetchKegiatan = async () => {
      const res = await fetch(
        `/api/kegiatan?kode_gusdep=${id}&detail=${idKegiatan}`
      );
      if (res.ok) {
        const data = await res.json();
        console.log("Kegiatan Data: ", data);
        setKegiatan(data);
      }
    };
    setMounted(true);
    fetchKegiatan();
  }, [id, idKegiatan, setKegiatan]);

  if (!mounted || !kegiatan) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Card className="p-6 flex items-center gap-4">
          <Loader2 className="animate-spin w-6 h-6" />
          <CardContent className="text-lg font-semibold">
            Memuat data kegiatan...
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <div className="w-full mx-auto p-4 bg-white rounded-lg shadow-md border border-gray-300">
        <div className="w-full">
          <div>
            <h2 className="text-xl font-bold">Nama Kegiatan</h2>
            <div className="mt-2 p-3 bg-gray-100 rounded-lg shadow-sm">
              <p>{kegiatan?.nama_kegiatan}</p>
            </div>
          </div>
          <div className="mt-2">
            <h2 className="text-xl font-bold">Deskripsi Kegiatan</h2>
            <div className="mt-2 p-3 bg-gray-100 rounded-lg shadow-sm">
              <p className="text-justify">{kegiatan?.deskripsi}</p>
            </div>
          </div>
          <div className="mt-2">
            <h2 className="text-xl font-bold">Lokasi Kegiatan</h2>
            <div className="mt-2 p-3 bg-gray-100 rounded-lg shadow-sm">
              <p>{kegiatan?.lokasi}</p>
            </div>
          </div>
          <div className="mt-2">
            <h2 className="text-xl font-bold">Tanggal Kegiatan</h2>
            <div className="mt-2 p-3 bg-gray-100 rounded-lg shadow-sm">
              {kegiatan?.tanggal && (
                <p>{new Date(kegiatan.tanggal).toLocaleDateString("id-ID")}</p>
              )}
            </div>
          </div>
          <div className="mt-2">
            <h2 className="text-xl font-bold">Jumlah Peserta</h2>
            <div className="mt-2 p-3 bg-gray-100 rounded-lg shadow-sm">
              <p>{kegiatan?.partisipan.length ?? 0} Peserta</p>
            </div>
          </div>
          <div>
            <h2 className="text-xl font-bold mt-2">Tingkat</h2>
            <div className="mt-2 p-3 bg-gray-100 rounded-lg shadow-sm">
              <p>{kegiatan?.tingkat_kegiatan}</p>
            </div>
            <h2 className="text-xl font-bold mt-2">File Laporan Kegiatan</h2>
            <div className="flex items-center border border-gray-500 rounded-lg px-3 py-2 mt-2">
              <a
                href={kegiatan?.laporan || "#"}
                download
                className="bg-gray-700 text-white text-sm px-3 py-1 rounded-md flex items-center gap-1 cursor-pointer hover:bg-gray-900 transition"
              >
                <Upload className="w-4 h-4" />
                Download File
              </a>
              <span className="flex-grow text-gray-700 text-sm ml-3 truncate">
                {kegiatan?.laporan
                  ? kegiatan.laporan.split("/").pop()
                  : "file.pdf"}
              </span>
            </div>
          </div>
        </div>
        {/* {Tabel Peserta} */}
        <div className="w-full mx-auto p-4 bg-white rounded-lg shadow-md border border-gray-300 mt-8">
          <h1 className="text-xl font-bold">Peserta yang Hadir</h1>
          <Table className="border border-gray-300 rounded-lg overflow-hidden mt-4">
            <TableHeader>
              <TableRow>
                <TableHead className="text-center border-b border-gray-300">
                  No. KTA
                </TableHead>
                <TableHead className="text-center border-b border-gray-300">
                  Nama
                </TableHead>
                <TableHead className="text-center border-b border-gray-300">
                  Tingkatan
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {kegiatan?.partisipan.map((p, index) => (
                <TableRow
                  key={p.anggotaId}
                  className={index % 2 === 0 ? "bg-gray-300" : "bg-white"}
                >
                  <TableCell className="text-center border-b border-gray-300">
                    {p.anggota.nta}
                  </TableCell>
                  <TableCell className="text-center font-medium border-b border-gray-300">
                    {p.anggota.nama_agt}
                  </TableCell>
                  <TableCell className="text-center border-b border-gray-300">
                    {p.anggota.jenjang_agt}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
