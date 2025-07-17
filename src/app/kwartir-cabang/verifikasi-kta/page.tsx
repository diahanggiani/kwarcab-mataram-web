"use client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Download, Loader2, Check, X } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { Textarea } from "@/components/ui/textarea";

type AjuanData = {
  id_ajuan: string;
  jenjang_agt: string;
  nama_agt: string;
  gender: string;
  keterangan: string | null;
  formulir: string;
  status: string | null;
  nta: string | null;
};

export default function VerifikasiKTA() {
  const { data: session } = useSession();
  const [ajuanList, setAjuanList] = useState<AjuanData[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (session) {
        const res = await fetch("/api/ajuan");
        if (res.ok) {
          const data = await res.json();
          setAjuanList(data.data);
        }
      }
    };
    fetchData();
    setMounted(true);
  }, [session]);

  const handleNtaChange = (index: number, value: string) => {
    const updated = [...ajuanList];
    updated[index].nta = value;
    setAjuanList(updated);
  };

  const handleKeteranganChange = (index: number, value: string) => {
    const updated = [...ajuanList];
    updated[index].keterangan = value;
    setAjuanList(updated);
  };

  const handleSingleSubmit = async (ajuan: AjuanData, status: string) => {
    if (!session) return;

    if (status === "DITERIMA" && !ajuan.nta) {
      toast.error(`NTA untuk ${ajuan.nama_agt} belum diisi!`);
      return;
    }

    try {
      const res = await fetch(`/api/ajuan/${ajuan.id_ajuan}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          nta: ajuan.nta,
          keterangan: ajuan.keterangan || "",
        }),
      });

      if (res.ok) {
        toast.success(
          `Ajuan ${ajuan.nama_agt} berhasil ${status.toLowerCase()}!`,
          { duration: 5000 }
        );
        window.location.reload();
      } else {
        const errorData = await res.json();
        if (errorData.message === "NTA already registered") {
          toast.error("NTA sudah terdaftar.");
        } else {
          toast.error("Gagal memperbarui ajuan.");
          console.error(errorData);
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Terjadi kesalahan saat update data.");
    }
  };

  const formatJenjang = (jenjang_agt: string | undefined) => {
    if (!jenjang_agt) return "-";
    return jenjang_agt
      .toLowerCase()
      .split("_")
      .map((kata: string) => kata.charAt(0).toUpperCase() + kata.slice(1))
      .join(" ");
  };

  if (!mounted || !ajuanList) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="animate-spin w-6 h-6 mr-2" />
        Memuat data ajuan NTA...
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4 text-center">
        VERIFIKASI NOMOR TANDA ANGGOTA
      </h2>

      <div className="overflow-auto rounded-lg border border-gray-300">
        <Table>
          <TableHeader className="bg-amber-950 text-white">
            <TableRow>
              <TableHead className="text-center text-white">No</TableHead>
              <TableHead className="text-center text-white">Nama</TableHead>
              <TableHead className="text-center text-white">Jenjang</TableHead>
              <TableHead className="text-center text-white">Gender</TableHead>
              <TableHead className="text-center text-white">Formulir</TableHead>
              <TableHead className="text-center text-white">Status</TableHead>
              <TableHead className="text-center text-white">NTA</TableHead>
              <TableHead className="text-center text-white">
                Keterangan
              </TableHead>
              <TableHead className="text-center text-white">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ajuanList.map((ajuan, index) => (
              <TableRow key={ajuan.id_ajuan}>
                <TableCell className="text-center">{index + 1}</TableCell>
                <TableCell className="text-center">{ajuan.nama_agt}</TableCell>
                <TableCell className="text-center">
                  {formatJenjang(ajuan.jenjang_agt)}
                </TableCell>
                <TableCell className="text-center">
                  {ajuan.gender === "LAKI_LAKI" ? "Laki-Laki" : "Perempuan"}
                </TableCell>
                <TableCell className="text-center">
                  {ajuan.formulir ? (
                    <Link
                      href={ajuan.formulir}
                      download
                      className="inline-flex items-center gap-1 text-blue-600 hover:underline justify-center"
                    >
                      <Download className="w-4 h-4" />
                      Unduh
                    </Link>
                  ) : (
                    <span className="text-gray-400">Tidak ada</span>
                  )}
                </TableCell>
                <TableCell className="text-center font-semibold">
                  <span
                    className={
                      ajuan.status === "MENUNGGU"
                        ? "text-yellow-600"
                        : ajuan.status === "DITERIMA"
                        ? "text-green-600"
                        : ajuan.status === "DITOLAK"
                        ? "text-red-600"
                        : ""
                    }
                  >
                    {ajuan.status || "-"}
                  </span>
                </TableCell>
                <TableCell className="text-center">
                  <Input
                    type="text"
                    value={ajuan.nta || ""}
                    onChange={(e) => handleNtaChange(index, e.target.value)}
                    disabled={
                      ajuan.status === "DITERIMA" || ajuan.status === "DITOLAK"
                    }
                    minLength={14}
                    maxLength={16}
                    className="mx-auto bg-white text-center"
                    placeholder="Masukan Nomor Tanda Anggota"
                  />
                </TableCell>
                <TableCell className="text-center">
                  <Textarea
                    className="mx-auto bg-white text-center border rounded p-2 resize"
                    style={{ maxWidth: "250px", width: "100%" }}
                    placeholder="Masukan Keterangan"
                    rows={2}
                    disabled={
                      ajuan.status === "DITERIMA" || ajuan.status === "DITOLAK"
                    }
                    value={ajuan.keterangan || ""}
                    onChange={(e) =>
                      handleKeteranganChange(index, e.target.value)
                    }
                  />
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex justify-center gap-2">
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => handleSingleSubmit(ajuan, "DITERIMA")}
                      className="bg-green-600 hover:bg-green-700 text-white transition-colors"
                      disabled={
                        ajuan.status === "DITERIMA" ||
                        ajuan.status === "DITOLAK"
                      }
                    >
                      <Check className="w-4 h-4 mr-1" />
                      DITERIMA
                    </Button>
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => handleSingleSubmit(ajuan, "DITOLAK")}
                      className="bg-red-600 hover:bg-red-700 text-white transition-colors"
                      disabled={
                        ajuan.status === "DITERIMA" ||
                        ajuan.status === "DITOLAK"
                      }
                    >
                      <X className="w-4 h-4 mr-1" />
                      DITOLAK
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
