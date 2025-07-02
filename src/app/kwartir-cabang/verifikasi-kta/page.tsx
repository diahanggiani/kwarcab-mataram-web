"use client";
import { Card, CardContent } from "@/components/ui/card";
import { Download, Loader2 } from "lucide-react";
import Link from "next/link";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";

type AjuanData = {
  id_ajuan: string;
  tingkat: string;
  nama_ajuan: string;
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

  const handleStatusChange = (index: number, value: string) => {
    const updated = [...ajuanList];
    updated[index].status = value;
    setAjuanList(updated);
  };

  const handleNtaChange = (index: number, value: string) => {
    const updated = [...ajuanList];
    updated[index].nta = value;
    setAjuanList(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;

    for (const ajuan of ajuanList) {
      if (ajuan.status === "DITERIMA" && !ajuan.nta) {
        toast.error(
          `NTA untuk ajuan ${ajuan.nama_ajuan} belum diisi, silakan isi NTA sebelum menyimpan!`
        );
        return;
      }

      if (ajuan.status && ajuan.nta) {
        try {
          const res = await fetch(`/api/ajuan/${ajuan.id_ajuan}`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              status: ajuan.status.toUpperCase(),
              nta: ajuan.nta,
            }),
          });

          if (res.ok) {
            toast.success(`Ajuan berhasil diperbarui!`);
          } else {
            const errorData = await res.json();
            if (errorData.message === "NTA already registered") {
              toast.error(
                `NTA sudah terdaftar, silakan gunakan NTA yang berbeda!`
              );
            } else {
              console.error(`Gagal dalam memperbarui ajuan`);
            }
          }
        } catch (error) {
          console.error("Error updating data:", error);
        }
      }
    }
  };

  if (!mounted || !ajuanList) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Card className="p-6 flex items-center gap-4">
          <Loader2 className="animate-spin w-6 h-6" />
          <CardContent className="text-lg font-semibold">
            Memuat data ajuan NTA...
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">
        VERIFIKASI NOMOR TANDA ANGGOTA
      </h2>

      <div className="flex items-end mb-4">
        <Button
          onClick={handleSubmit}
          className="bg-amber-950 text-white hover:bg-amber-800 transition"
        >
          Simpan
        </Button>
      </div>

      <form className="space-y-2">
        {ajuanList.map((ajuan, index) => (
          <Card
            key={ajuan.id_ajuan}
            className="p-4 rounded-lg shadow-md bg-amber-950 text-white"
          >
            <CardContent>
              <div className="flex items-center justify-between w-full space-x-4">
                {/* Info Ajuan */}
                <div className="flex flex-col space-y-1 flex-1">
                  <span className="text-lg font-bold">{ajuan.nama_ajuan}</span>
                  <span className="text-sm">{ajuan.tingkat}</span>
                </div>


                {ajuan.formulir ? (
                  <Link
                    href={ajuan.formulir}
                    download
                    className="bg-white text-black text-sm px-3 py-1 rounded-md flex items-center gap-1 cursor-pointer hover:bg-gray-200 transition"
                  >
                    <Download className="w-6 h-6" />
                  </Link>
                ) : (
                  <Button
                    disabled
                    className="bg-gray-300 text-gray-500 text-sm px-3 py-1 rounded-md flex items-center gap-1 cursor-not-allowed"
                    title="Formulir belum tersedia"
                    type="button"
                  >
                    <Download className="w-6 h-6" />
                  </Button>
                )}

                {/*
                <Link
                  href={ajuan.formulir}
                  download
                  className="bg-white text-black text-sm px-3 py-1 rounded-md flex items-center gap-1 cursor-pointer hover:bg-gray-200 transition"
                >
                  <Download className="w-6 h-6" />
                </Link> */}

                {/* Dropdown Status */}
                <div className="bg-white text-black rounded-md">
                  <Select
                    onValueChange={(value) =>
                      handleStatusChange(index, value.toUpperCase())
                    }
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder={ajuan.status || "Status"} />
                    </SelectTrigger>
                    <SelectContent className="bg-white shadow-md rounded-md">
                      <SelectItem
                        value="DITERIMA"
                        className="cursor-pointer hover:bg-gray-200 px-4 py-2 text-black"
                      >
                        DITERIMA
                      </SelectItem>
                      <SelectItem
                        value="DITOLAK"
                        className="cursor-pointer hover:bg-gray-200 px-4 py-2 text-black"
                      >
                        DITOLAK
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Input NTA */}
                <div>
                  <Input
                    type="text"
                    placeholder="Masukkan NTA"
                    value={ajuan.nta || ""}
                    onChange={(e) => handleNtaChange(index, e.target.value)}
                    maxLength={20}
                    className="w-64 px-4 py-2 text-center text-black bg-white"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </form>
    </div>
  );
}
