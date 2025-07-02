"use client";
import React, { useState, useEffect } from "react";
import { Loader2, Search, Upload } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import toast from "react-hot-toast";
import { Card, CardContent } from "@/components/ui/card";

type AnggotaData = {
  id_anggota: string;
  nta: string;
  nama_agt: string;
};

export default function EditKegiatan() {
  const { data: session } = useSession();
  const router = useRouter();
  const { id } = useParams();
  const [anggota, setAnggota] = useState<AnggotaData[]>([]);
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [jenjang, setJenjang] = useState<{ [key: string]: string }>({});
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>(
    []
  );
  const [kegiatan, setKegiatan] = useState({
    nama_kegiatan: "",
    deskripsi: "",
    lokasi: "",
    tanggal: "",
    tingkat_kegiatan: "",
    laporan: "",
    partisipan: [] as string[],
    kwaranKode: "",
  });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500); // delay 500ms
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  useEffect(() => {
    const fetchMembers = async () => {
      const res = await fetch(`/api/anggota?search=${debouncedSearch}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
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
      const res = await fetch(`/api/anggota/${id_anggota}/riwayat-jenjang`);
      if (res.ok) {
        const data = await res.json();
        const sortedJenjang = data.sort(
          (a: { tgl_perubahan: string }, b: { tgl_perubahan: string }) =>
            new Date(b.tgl_perubahan).getTime() -
            new Date(a.tgl_perubahan).getTime()
        );
        const latestJenjang = sortedJenjang[0];
        setJenjang((prev) => ({
          ...prev,
          [id_anggota]: latestJenjang?.jenjang_agt || "-",
        }));
      }
    };

    const fetchKegiatan = async () => {
      const res = await fetch(`/api/kegiatan/${id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (res.ok) {
        const data = await res.json();
        console.log("Kegiatan Data: ", data);
        setKegiatan((prev) => ({
          ...prev,
          ...data,
          partisipan: data.partisipan.map(
            (partisipan: { anggotaId: string }) => partisipan.anggotaId
          ),
        }));
        setSelectedParticipants(
          data.partisipan.map((partisipan: { anggotaId: string }) => {
            return partisipan.anggotaId;
          })
        );
      }
    };
    setMounted(true);
    fetchKegiatan();
    fetchMembers();
  }, [id, debouncedSearch]);

  // fungsi format jenjang
  const formatJenjang = (jenjang_agt: string | undefined) => {
    if (!jenjang_agt) return "-";
    return jenjang_agt
      .toLowerCase()
      .split("_")
      .map((kata: string) => kata.charAt(0).toUpperCase() + kata.slice(1))
      .join(" ");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append("nama_kegiatan", kegiatan.nama_kegiatan);
      formData.append("deskripsi", kegiatan.deskripsi);
      formData.append("lokasi", kegiatan.lokasi);
      formData.append("tanggal", kegiatan.tanggal);
      formData.append("tingkat_kegiatan", kegiatan.tingkat_kegiatan);
      formData.append("pesertaIds", JSON.stringify(selectedParticipants));
      formData.append("laporan", selectedFile || "");
      formData.append("kwaranKode", session?.user?.kode_kwaran || "");

      const res = await fetch(`/api/kegiatan/${id}`, {
        method: "PATCH",
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        console.log("Anggota added:", data);
        setKegiatan({
          nama_kegiatan: "",
          deskripsi: "",
          lokasi: "",
          tanggal: "",
          tingkat_kegiatan: "",
          laporan: "",
          partisipan: [],
          kwaranKode: "",
        });
        setSelectedFile(null);
        setSelectedParticipants([]);
        router.push("/kwartir-ranting/kegiatan");
        toast.success("Kegiatan berhasil diperbarui!");
      }
    } catch (error) {
      console.error("Error creating activity:", error);
    }
  };

  const handleSelectParticipant = (id: string) => {
    setSelectedParticipants((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedParticipants(anggota.map((anggota) => anggota.id_anggota));
    } else {
      setSelectedParticipants([]);
    }
  };

  if (!mounted || !session || !kegiatan) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Card className="p-6 flex items-center gap-4">
          <Loader2 className="animate-spin w-6 h-6" />
          <CardContent className="text-lg font-semibold">
            Memuat detail kegiatan...
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-4">EDIT KEGIATAN KWARTIR RANTING</h1>
      <div className="w-full mx-auto p-4 bg-white rounded-lg shadow-md border border-gray-300">
        <div className="w-full">
          <form onSubmit={handleSubmit}>
            <h2 className="text-xl font-bold mt-2">Nama Kegiatan</h2>
            <div className="w-full mx-auto mt-2">
              <Input
                type="text"
                value={kegiatan.nama_kegiatan}
                onChange={(e) =>
                  setKegiatan((prev) => ({
                    ...prev,
                    nama_kegiatan: e.target.value,
                  }))
                }
                placeholder="Masukkan Nama Kegiatan"
                className="w-full border border-gray-500 rounded-lg px-3 py-2"
              />
            </div>
            <h2 className="text-xl font-bold mt-2">Deskripsi Kegiatan</h2>
            <div className="w-full mx-auto mt-2">
              <Textarea
                value={kegiatan.deskripsi}
                onChange={(e) =>
                  setKegiatan((prev) => ({
                    ...prev,
                    deskripsi: e.target.value,
                  }))
                }
                placeholder="Masukkan Deskripsi Kegiatan"
                className="w-full border border-gray-500 rounded-lg px-3 py-2"
              />
            </div>
            <h2 className="text-xl font-bold mt-2">Lokasi Kegiatan</h2>
            <div className="w-full mx-auto mt-2">
              <Input
                type="text"
                value={kegiatan.lokasi}
                onChange={(e) =>
                  setKegiatan((prev) => ({
                    ...prev,
                    lokasi: e.target.value,
                  }))
                }
                placeholder="Masukkan Lokasi Kegiatan"
                className="w-full border border-gray-500 rounded-lg px-3 py-2"
              />
            </div>
            <h2 className="text-xl font-bold mt-2">Tanggal Kegiatan</h2>
            <div className="w-full mx-auto mt-2">
              <Input
                type="date"
                value={kegiatan.tanggal}
                onChange={(e) =>
                  setKegiatan((prev) => ({
                    ...prev,
                    tanggal: e.target.value,
                  }))
                }
                placeholder="Masukkan Tanggal Kegiatan"
                className="w-full border border-gray-500 rounded-lg px-3 py-2"
              />
            </div>
            <h2 className="text-xl font-bold mt-2">Jumlah Peserta</h2>
            <div className="w-full mx-auto mt-2">
              <Input
                type="text"
                value={selectedParticipants.length}
                readOnly
                className="w-full border border-gray-500 rounded-lg px-3 py-2 bg-gray-100"
              />
            </div>
            <h2 className="text-xl font-bold mt-2">Tingkat Kegiatan</h2>
            <div className="w-full mx-auto mt-2">
              <div className="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-amber-950 focus:ring focus:ring-amber-950 focus:ring-opacity-50">
                <Select
                  value={kegiatan.tingkat_kegiatan}
                  onValueChange={(value) =>
                    setKegiatan((prev) => ({
                      ...prev,
                      tingkat_kegiatan: value,
                    }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih Tingkat Kegiatan" />
                  </SelectTrigger>
                  <SelectContent className="w-full bg-white">
                    <SelectItem value="SIAGA">Siaga</SelectItem>
                    <SelectItem value="PENGGALANG">Penggalang</SelectItem>
                    <SelectItem value="PENEGAK">Penegak</SelectItem>
                    <SelectItem value="PANDEGA">Pandega</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <h2 className="text-xl font-bold mt-2">
              Upload File Laporan Kegiatan
            </h2>
            <div className="w-full mx-auto mt-2">
              <div className="flex items-center border border-gray-500 rounded-lg px-3 py-2">
                <label className="bg-amber-950 text-white text-sm px-3 py-1 rounded-md flex items-center gap-1 cursor-pointer transition-transform transform hover:bg-amber-800 hover:scale-105 hover:shadow-lg">
                  <Upload className="w-4 h-4" />
                  Choose File
                  <Input
                    type="file"
                    className="hidden"
                    accept=".pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      setSelectedFile(file || null);
                    }}
                  />
                </label>
                <span className="flex-grow text-gray-700 text-sm ml-3 truncate">
                  {selectedFile
                    ? selectedFile.name
                    : kegiatan.laporan
                    ? kegiatan.laporan.split("/").pop()
                    : "No File Chosen"}
                </span>
              </div>
            </div>
            <h2 className="text-xl font-bold mt-8">
              Masukan Peserta yang Hadir
            </h2>
            <div className="flex relative w-3/10 mt-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="search"
                placeholder="Search members..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 shadow-sm"
              />
            </div>
            <div className="mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-center">
                      <Checkbox
                        onCheckedChange={(checked) =>
                          handleSelectAll(checked as boolean)
                        }
                        checked={selectedParticipants.length === anggota.length}
                      />
                    </TableHead>
                    <TableHead className="text-center">NTA</TableHead>
                    <TableHead className="text-center">Nama</TableHead>
                    <TableHead className="text-center">Jenjang</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {anggota.map((participant) => (
                    <TableRow key={participant.id_anggota}>
                      <TableCell className="text-center">
                        <Checkbox
                          checked={selectedParticipants.includes(
                            participant.id_anggota
                          )}
                          onCheckedChange={() => {
                            handleSelectParticipant(participant.id_anggota);
                          }}
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        {participant.nta}
                      </TableCell>
                      <TableCell className="text-center">
                        {participant.nama_agt}
                      </TableCell>
                      {/* <TableCell className="text-center">
                        {jenjang[participant.id_anggota] || "-"}
                      </TableCell> */}
                      <TableCell className="text-center">
                      {formatJenjang(jenjang[participant.id_anggota])}
                    </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="flex justify-center mt-8">
              <Button
                size="lg"
                type="submit"
                className="w-75 bg-amber-950 text-white text-base"
              >
                Simpan Perubahan
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
