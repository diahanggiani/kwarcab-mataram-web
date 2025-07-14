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
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

type GugusDepanData = {
  nama_gusdep: string;
};

export default function TambahPembina() {
  const router = useRouter();
  const { data: session } = useSession();
  const [profile, setProfile] = useState<GugusDepanData | null>(null);
  const [pembina, setPembina] = useState({
    nama_pbn: "",
    nta: "",
    tgl_lahir: "",
    no_telp: "",
    alamat: "",
    gender: "",
    agama: "",
    jenjang_pbn: "",
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
    const {
      nama_pbn,
      nta,
      tgl_lahir,
      no_telp,
      alamat,
      gender,
      agama,
      jenjang_pbn,
    } = pembina;
    if (
      !nama_pbn.trim() ||
      !nta.trim() ||
      !tgl_lahir.trim() ||
      !no_telp.trim() ||
      !alamat.trim() ||
      !gender.trim() ||
      !agama.trim() ||
      !jenjang_pbn.trim()
    ) {
      toast.error("Semua field harus diisi!");
      return;
    }

    try {
      const result = await fetch("/api/pembina", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nama_pbn,
          nta,
          tgl_lahir,
          alamat,
          gender,
          agama,
          jenjang_pbn,
          gusdepKode: session?.user?.kode_gusdep,
        }),
      });
      if (result.ok) {
        const data = await result.json();
        console.log("Pembina added:", data);
        setPembina({
          nama_pbn: "",
          nta: "",
          tgl_lahir: "",
          no_telp: "",
          alamat: "",
          gender: "",
          agama: "",
          jenjang_pbn: "",
        });
        toast.success("Pembina berhasil ditambahkan!", { duration: 5000 });
        router.push("/gugus-depan/pembina");
      }
    } catch (error) {
      console.error("Error adding pembina:", error);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-4">
        TAMBAH PEMBINA {profile?.nama_gusdep.toUpperCase()}
      </h1>
      <div className="w-full mx-auto p-4 bg-white rounded-lg shadow-md border border-gray-300 mt-4">
        <div className="w-full">
          <form className="mt-2" onSubmit={handleSubmit}>
            <h3 className="text-xl font-bold mt-2">Nama Pembina</h3>
            <div className="w-full mx-auto mt-2">
              <Input
                type="text"
                value={pembina.nama_pbn}
                onChange={(e) =>
                  setPembina({ ...pembina, nama_pbn: e.target.value })
                }
                placeholder="Masukkan Nama Pembina"
                className="w-full border border-gray-500 rounded-lg px-3 py-2"
              />
            </div>
            <h3 className="text-xl font-bold mt-2">Nomor Tanda Anggota</h3>
            <div className="w-full mx-auto mt-2">
              <Input
                type="text"
                value={pembina.nta}
                onChange={(e) =>
                  setPembina({
                    ...pembina,
                    nta: e.target.value,
                  })
                }
                placeholder="Masukkan Nomor Tanda Anggota"
                className="w-full border border-gray-500 rounded-lg px-3 py-2"
              />
            </div>
            <h3 className="text-xl font-bold mt-2">Tanggal Lahir</h3>
            <div className="w-full mx-auto mt-2">
              <Input
                type="date"
                value={pembina.tgl_lahir}
                onChange={(e) =>
                  setPembina({ ...pembina, tgl_lahir: e.target.value })
                }
                className="w-full border border-gray-500 rounded-lg px-3 py-2"
                placeholder="DD-MM-YYYY"
              />
            </div>
            <h3 className="text-xl font-bold mt-2">Nomor Telepon</h3>
            <div className="w-full mx-auto mt-2">
              <Input
                type="text"
                value={pembina.no_telp}
                onChange={(e) =>
                  setPembina({ ...pembina, no_telp: e.target.value })
                }
                placeholder="Masukkan Nomor Telepon Pembina"
                className="w-full border border-gray-500 rounded-lg px-3 py-2"
              />
            </div>
            <h3 className="text-xl font-bold mt-2">Alamat</h3>
            <div className="w-full mx-auto mt-2">
              <Input
                type="text"
                value={pembina.alamat}
                onChange={(e) =>
                  setPembina({ ...pembina, alamat: e.target.value })
                }
                placeholder="Masukkan Alamat Anggota"
                className="w-full border border-gray-500 rounded-lg px-3 py-2"
              />
            </div>
            <h3 className="text-xl font-bold mt-2">Jenis Kelamin</h3>
            <div className="w-full mx-auto mt-2">
              <Select
                value={pembina.gender}
                onValueChange={(value) =>
                  setPembina({ ...pembina, gender: value })
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
                value={pembina.agama}
                onValueChange={(value) =>
                  setPembina({ ...pembina, agama: value })
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
                value={pembina.jenjang_pbn}
                onValueChange={(value) =>
                  setPembina({ ...pembina, jenjang_pbn: value })
                }
              >
                <SelectTrigger className="w-full border border-gray-500 rounded-lg px-3 py-2">
                  <SelectValue placeholder="Pilih Gugus Depan" />
                </SelectTrigger>
                <SelectContent className="w-full bg-white">
                  <SelectItem value="SIAGA">Siaga</SelectItem>
                  <SelectItem value="PENGGALANG">Penggalang</SelectItem>
                  <SelectItem value="PENEGAK_PANDEGA">
                    Penegak Pandega
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-center mt-6">
              <Button
                className="bg-amber-950 text-white text-base  px-16 py-5 rounded-md hover:bg-gray-900 transition"
                type="submit"
              >
                Tambah Pembina
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
