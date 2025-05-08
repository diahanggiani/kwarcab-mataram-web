"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import React from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

type GugusDepanData = {
  nama_gusdep: string;
};

export default function TambahAnggota() {
  const router = useRouter();
  const { data: session } = useSession();
  const [profile, setProfile] = useState<GugusDepanData | null>(null);
  const [anggota, setAnggota] = useState({
    nama_agt: "",
    nta: "",
    tgl_lahir: "",
    alamat: "",
    gender: "",
    agama: "",
    jenjang_agt: "",
    tgl_perubahan: "",
    status_agt: "",
    tahun_gabung: "",
  });

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
          setProfile(data);
        }
      }
    };
    fetchProfile();
  }, [session]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (
      !anggota.nama_agt ||
      !anggota.nta ||
      !anggota.tgl_lahir ||
      !anggota.alamat ||
      !anggota.gender ||
      !anggota.agama ||
      !anggota.jenjang_agt ||
      !anggota.tgl_perubahan ||
      !anggota.status_agt ||
      !anggota.tahun_gabung
    ) {
      toast.error("Harap isi semua field!");
      return;
    }

    try {
      const result = await fetch("/api/anggota", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nama_agt: anggota.nama_agt,
          nta: anggota.nta,
          tgl_lahir: anggota.tgl_lahir,
          alamat: anggota.alamat,
          gender: anggota.gender,
          agama: anggota.agama,
          jenjang_agt: anggota.jenjang_agt,
          tgl_perubahan: anggota.tgl_perubahan,
          status_agt: anggota.status_agt,
          tahun_gabung: anggota.tahun_gabung,
          gusdepKode: session?.user?.kode_gusdep,
        }),
      });
      if (result.ok) {
        const data = await result.json();
        console.log("Anggota added:", data);
        setAnggota({
          nama_agt: "",
          nta: "",
          tgl_lahir: "",
          alamat: "",
          gender: "",
          agama: "",
          jenjang_agt: "",
          tgl_perubahan: "",
          status_agt: "",
          tahun_gabung: "",
        });
        router.push("/gugus-depan/anggota");
        toast.success("Anggota berhasil ditambahkan!");
      } else if (result.status === 400) {
        const errorData = await result.json();
        if (errorData.message === "NTA already registered") {
          toast.error("NTA sudah terdaftar. Silakan gunakan NTA yang berbeda.");
        } else {
          toast.error("Terjadi kesalahan saat menambah data anggota.");
        }
      } else {
        toast.error("Terjadi kesalahan saat menambah data anggota.");
      }
    } catch (error) {
      console.error("Error adding anggota:", error);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-4">
        TAMBAH ANGGOTA GUGUS DEPAN {profile?.nama_gusdep.toUpperCase()}
      </h1>
      <div className="w-full mx-auto p-4 bg-white rounded-lg shadow-md border border-gray-300 mt-4">
        <div className="w-full">
          <form className="mt-2" onSubmit={handleSubmit}>
            <h3 className="text-xl font-bold mt-2">Nama Anggota</h3>
            <div className="w-full mx-auto mt-2">
              <Input
                type="text"
                value={anggota.nama_agt}
                onChange={(e) =>
                  setAnggota({ ...anggota, nama_agt: e.target.value })
                }
                placeholder="Masukkan Nama Anggota"
                className="w-full border border-gray-500 rounded-lg px-3 py-2"
              />
            </div>
            <h3 className="text-xl font-bold mt-2">Nomor Tanda Anggota</h3>
            <div className="w-full mx-auto mt-2">
              <Input
                type="text"
                value={anggota.nta}
                onChange={(e) =>
                  setAnggota({ ...anggota, nta: e.target.value })
                }
                placeholder="Masukkan Nomor Tanda Anggota"
                className="w-full border border-gray-500 rounded-lg px-3 py-2"
              />
            </div>
            <h3 className="text-xl font-bold mt-2">Tanggal Lahir</h3>
            <div className="w-full mx-auto mt-2">
              <Input
                type="date"
                value={anggota.tgl_lahir}
                onChange={(e) =>
                  setAnggota({ ...anggota, tgl_lahir: e.target.value })
                }
                className="w-full border border-gray-500 rounded-lg px-3 py-2"
                placeholder="DD-MM-YYYY"
              />
            </div>
            <h3 className="text-xl font-bold mt-2">Alamat</h3>
            <div className="w-full mx-auto mt-2">
              <Input
                type="text"
                value={anggota.alamat}
                onChange={(e) =>
                  setAnggota({ ...anggota, alamat: e.target.value })
                }
                placeholder="Masukkan Alamat Anggota"
                className="w-full border border-gray-500 rounded-lg px-3 py-2"
              />
            </div>
            <h3 className="text-xl font-bold mt-2">Jenis Kelamin</h3>
            <div className="w-full mx-auto mt-2">
              <Select
                value={anggota.gender}
                onValueChange={(value) =>
                  setAnggota({ ...anggota, gender: value })
                }
              >
                <SelectTrigger className="w-full border border-gray-500 rounded-lg px-3 py-2">
                  <SelectValue placeholder="Pilih Jenis Kelamin" />
                </SelectTrigger>
                <SelectContent className="w-full bg-white">
                  <SelectItem value="LAKI_LAKI">Laki-Laki</SelectItem>
                  <SelectItem value="PEREMPUAN">Perempuan</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <h3 className="text-xl font-bold mt-2">Agama</h3>
            <div className="w-full mx-auto mt-2">
              <Select
                value={anggota.agama}
                onValueChange={(value) =>
                  setAnggota({ ...anggota, agama: value })
                }
              >
                <SelectTrigger className="w-full border border-gray-500 rounded-lg px-3 py-2">
                  <SelectValue placeholder="Pilih Agama" />
                </SelectTrigger>
                <SelectContent className="w-full bg-white">
                  <SelectItem value="ISLAM">Islam</SelectItem>
                  <SelectItem value="HINDU">Hindu</SelectItem>
                  <SelectItem value="KATOLIK">Katolik</SelectItem>
                  <SelectItem value="KRISTEN">Kristen</SelectItem>
                  <SelectItem value="BUDDHA">Budha</SelectItem>
                  <SelectItem value="KONGHUCU">Konghucu</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <h3 className="text-xl font-bold mt-2">Jenjang</h3>
            <div className="w-full mx-auto mt-2">
              <Select
                value={anggota.jenjang_agt}
                onValueChange={(value) =>
                  setAnggota({ ...anggota, jenjang_agt: value })
                }
              >
                <SelectTrigger className="w-full border border-gray-500 rounded-lg px-3 py-2">
                  <SelectValue placeholder="Pilih Jenjang" />
                </SelectTrigger>
                <SelectContent className="w-full bg-white">
                  <SelectItem value="SIAGA_MULA">Siaga Mula</SelectItem>
                  <SelectItem value="SIAGA_BANTU">Siaga Bantu</SelectItem>
                  <SelectItem value="SIAGA_TATA">Siaga Tata</SelectItem>
                  <SelectItem value="PENGGALANG_RAMU">
                    Penggalang Ramu
                  </SelectItem>
                  <SelectItem value="PENGGALANG_RAKIT">
                    Penggalang Rakit
                  </SelectItem>
                  <SelectItem value="PENGGALANG_TERAP">
                    Penggalang Terap
                  </SelectItem>
                  <SelectItem value="PENEGAK_BANTARA">
                    Penegak Bantara
                  </SelectItem>
                  <SelectItem value="PENEGAK_LAKSANA">
                    Penegak Laksana
                  </SelectItem>
                  <SelectItem value="PANDEGA">Pandega</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <h3 className="text-xl font-bold mt-2">Tanggal Kenaikan Jenjang</h3>
            <div className="w-full mx-auto mt-2">
              <Input
                type="date"
                value={anggota.tgl_perubahan}
                onChange={(e) =>
                  setAnggota({ ...anggota, tgl_perubahan: e.target.value })
                }
                className="w-full border border-gray-500 rounded-lg px-3 py-2"
                placeholder="DD-MM-YYYY"
              />
            </div>
            <h3 className="text-xl font-bold mt-2">Status Keaktifan</h3>
            <div className="w-full mx-auto mt-2">
              <Select
                value={anggota.status_agt}
                onValueChange={(value) =>
                  setAnggota({ ...anggota, status_agt: value })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih Status" />
                </SelectTrigger>
                <SelectContent className="w-full bg-white">
                  <SelectItem value="AKTIF">Aktif</SelectItem>
                  <SelectItem value="NON_AKTIF">Tidak Aktif</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <h3 className="text-xl font-bold mt-2">Tahun Masuk Anggota</h3>
            <div className="w-full mx-auto mt-2">
              <Input
                type="number"
                value={anggota.tahun_gabung}
                onChange={(e) =>
                  setAnggota({ ...anggota, tahun_gabung: e.target.value })
                }
                placeholder="Masukkan Tahun Masuk Anggota"
                className="w-full border border-gray-500 rounded-lg px-3 py-2"
              />
            </div>
            <div className="flex justify-center mt-6">
              <Button className="bg-amber-950 text-white text-base  px-16 py-5 rounded-md hover:bg-gray-900 transition">
                Tambah Anggota
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
