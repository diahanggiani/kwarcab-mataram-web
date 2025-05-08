"use client";
import React, { useState, useEffect } from "react";
import {
  MoreHorizontal,
  Search,
  PlusCircle,
  ListFilter,
  Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";

type GugusDepanData = {
  nama_gusdep: string;
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

export default function Anggota() {
  const { data: session } = useSession();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [profile, setProfile] = useState<GugusDepanData | null>(null);
  const [anggota, setAnggota] = useState<AnggotaData[]>([]);
  const [editId, setEditId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<AnggotaData>>({});
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [jenjang, setJenjang] = useState<{ [key: string]: string }>({});
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filteredAjuan, setFilteredAjuan] = useState<string>("ALL");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500); // delay 500ms
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  useEffect(() => {
    setMounted(true);
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

    const fetchMembers = async () => {
      const res = await fetch(
        `/api/anggota?status=${filteredAjuan}&search=${debouncedSearch}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (res.ok) {
        const data = await res.json();
        setAnggota(data);

        data.forEach((anggotaItem: AnggotaData) => {
          if (anggotaItem.id_anggota) {
            fetchJenjang(anggotaItem.id_anggota);
          } else {
            console.warn("Anggota tidak memiliki id_anggota:", anggotaItem);
          }
        });
      }
    };

    const fetchJenjang = async (id_anggota: string) => {
      try {
        const res = await fetch(`/api/anggota/${id_anggota}/riwayat-jenjang`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (res.ok) {
          const data = await res.json();

          if (Array.isArray(data)) {
            const sortedJenjang = data.sort(
              (a: { tgl_perubahan: string }, b: { tgl_perubahan: string }) => {
                const dateA = new Date(a.tgl_perubahan);
                const dateB = new Date(b.tgl_perubahan);
                return dateB.getTime() - dateA.getTime();
              }
            );

            const latestJenjang = sortedJenjang[0];
            setJenjang((prevJenjang) => ({
              ...prevJenjang,
              [id_anggota]: latestJenjang?.jenjang_agt || "-", // Default ke "-"
            }));
          } else {
            console.warn(`Unexpected data format for jenjang_agt:`, data);
          }
        }
      } catch (error) {
        console.error(
          `Error fetching jenjang for anggota ${id_anggota}:`,
          error
        );
      }
    };

    fetchProfile();
    fetchMembers();
  }, [session, debouncedSearch, filteredAjuan]);

  const handleDelete = async () => {
    if (!deleteId) return;

    const res = await fetch(`/api/anggota/${deleteId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (res.ok) {
      const updateAnggota = anggota.filter(
        (item: AnggotaData) => item.id_anggota !== deleteId
      );
      setAnggota(updateAnggota);
      setDeleteId(null);
      setIsDeleteOpen(false);
      toast.success("Data anggota berhasil dihapus!");
    }
  };

  const openDeleteDialog = (id: string) => {
    setDeleteId(id);
    setIsDeleteOpen(true);
  };

  const handleEditSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editId) return;

    try {
      const res = await fetch(`/api/anggota/${editId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editData),
      });

      if (res.ok) {
        const updateAnggota = anggota.map((item) =>
          item.id_anggota === editId ? { ...item, ...editData } : item
        );
        setAnggota(updateAnggota);
        setIsEditOpen(false);
        setEditId(null);
        setEditData({});
        toast.success("Data anggota berhasil diperbarui!");
      } else if (res.status === 400) {
        const errorData = await res.json();
        if (errorData.message === "NTA already registered") {
          toast.error("NTA sudah terdaftar. Silakan gunakan NTA yang berbeda.");
        } else {
          toast.error("Terjadi kesalahan saat memperbarui data anggota.");
        }
      } else {
        toast.error("Terjadi kesalahan saat memperbarui data anggota.");
      }
    } catch (error) {
      console.error("Gagal mengupdate pembina", error);
      toast.error("Terjadi kesalahan saat memperbarui data anggota.");
    }
  };

  const openEditDialog = (id: string) => {
    const dataToEdit = anggota.find((anggota) => anggota.id_anggota === id);
    if (dataToEdit) {
      setEditData(dataToEdit);
      setEditId(id);
      setIsEditOpen(true);
    }
  };

  if (!mounted || !session || !profile) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Card className="p-6 flex items-center gap-4">
          <Loader2 className="animate-spin w-6 h-6" />
          <CardContent className="text-lg font-semibold">
            Memuat Data Anggota...
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-4">
        ANGGOTA {profile?.nama_gusdep.toUpperCase()}
      </h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">
            Daftar Anggota {profile?.nama_gusdep}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex justify-between">
          <div className="flex relative w-3/10">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              type="search"
              placeholder="Search members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 shadow-sm"
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="ml-2 h-10 flex items-center"
                >
                  <ListFilter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-white">
                <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {["ALL", "AKTIF", "NON_AKTIF"].map((status) => (
                  <DropdownMenuItem
                    key={status}
                    onClick={() => setFilteredAjuan(status)}
                    className={`hover:bg-gray-100 ${
                      filteredAjuan === status ? "font-semibold" : ""
                    }`}
                  >
                    {status.charAt(0) + status.slice(1).toLowerCase()}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div>
            <Link href="/gugus-depan/anggota/tambah-anggota">
              <Button
                size="sm"
                className="bg-amber-950 text-white text-sm rounded-md hover:bg-gray-900 transition"
              >
                <PlusCircle className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                  Tambah Anggota
                </span>
              </Button>
            </Link>
          </div>
        </CardContent>
        <CardContent>
          <Table className="border rounded-lg overflow-hidden">
            <TableHeader>
              <TableRow>
                <TableHead className="text-center">Nama</TableHead>
                <TableHead className="text-center">NTA</TableHead>
                <TableHead className="text-center">Tanggal Lahir</TableHead>
                <TableHead className="text-center">Gender</TableHead>
                <TableHead className="text-center">Agama</TableHead>
                <TableHead className="text-center">Jenjang</TableHead>
                <TableHead className="text-center">Alamat</TableHead>
                <TableHead className="text-center">Tahun Gabung</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {anggota.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-4">
                    Tidak ada data anggota yang tersedia.
                  </TableCell>
                </TableRow>
              ) : (
                anggota.map((anggota, index) => (
                  <TableRow
                    key={index}
                    className={index % 2 === 0 ? "bg-gray-300" : "bg-white"}
                  >
                    <TableCell className="text-center font-medium">
                      {anggota.nama_agt}
                    </TableCell>
                    <TableCell className="text-center">{anggota.nta}</TableCell>
                    <TableCell className="text-center">
                      {new Date(anggota.tgl_lahir).toLocaleDateString("id-ID")}
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
                    <TableCell className="text-center">
                      <div className="flex justify-center items-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              aria-haspopup="true"
                              size="icon"
                              variant="ghost"
                              className="hover:bg-gray-100 transition-all duration-200"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="bg-white shadow-lg rounded-lg border border-gray-200 p-2 animate-fadeIn"
                          >
                            <DropdownMenuLabel className="text-gray-700 font-semibold">
                              Actions
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="hover:bg-gray-100 px-3 py-2 rounded-md transition-all duration-200">
                              <Link
                                href={`/gugus-depan/anggota/${anggota.id_anggota}`}
                              >
                                📁 Riwayat
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => openEditDialog(anggota.id_anggota)}
                              className="hover:bg-gray-100 px-3 py-2 rounded-md transition-all duration-200"
                            >
                              ✏️ Ubah
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                openDeleteDialog(anggota.id_anggota)
                              }
                              className="hover:bg-red-100 text-red-600 px-3 py-2 rounded-md transition-all duration-200"
                            >
                              🗑️ Hapus
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <AlertDialog
        open={isDeleteOpen}
        onOpenChange={(open: boolean) => {
          if (!open) {
            setIsDeleteOpen(false);
            setDeleteId(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Apakah anda yakin ingin menghapus?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Ini akan secara permanen
              menghapus akun Anda dan menghapus data Anda dari server kami.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="hover:bg-gray-200 transition-all duration-200">
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 text-white hover:bg-red-700 transition-all duration-200"
              onClick={handleDelete}
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        open={isEditOpen}
        onOpenChange={(open: boolean) => {
          if (!open) {
            setIsEditOpen(false);
            setEditId(null);
            setEditData({});
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-center text-2xl">
              Ubah Profil Anggota
            </DialogTitle>
            <div>
              <form>
                <h3 className="text-xl font-bold mt-2">Nama Anggota</h3>
                <div className="w-full mx-auto mt-2">
                  <Input
                    type="text"
                    value={editData.nama_agt || ""}
                    onChange={(e) =>
                      setEditData({ ...editData, nama_agt: e.target.value })
                    }
                    placeholder="Masukkan Nama Anggota"
                    className="w-full border border-gray-500 rounded-lg px-3 py-2"
                  />
                </div>
                <h3 className="text-xl font-bold mt-2">Nomor Tanda Anggota</h3>
                <div className="w-full mx-auto mt-2">
                  <Input
                    type="text"
                    value={editData.nta || ""}
                    onChange={(e) =>
                      setEditData({ ...editData, nta: e.target.value })
                    }
                    placeholder="Masukkan Nomor Tanda Anggota"
                    className="w-full border border-gray-500 rounded-lg px-3 py-2"
                  />
                </div>
                <h3 className="text-xl font-bold mt-2">Tanggal Lahir</h3>
                <div className="w-full mx-auto mt-2">
                  <Input
                    type="date"
                    value={editData.tgl_lahir}
                    onChange={(e) =>
                      setEditData({ ...editData, tgl_lahir: e.target.value })
                    }
                    className="w-full border border-gray-500 rounded-lg px-3 py-2"
                    placeholder="DD-MM-YYYY"
                  />
                </div>
                <h3 className="text-xl font-bold mt-2">Alamat</h3>
                <div className="w-full mx-auto mt-2">
                  <Input
                    type="text"
                    value={editData.alamat || ""}
                    onChange={(e) =>
                      setEditData({ ...editData, tgl_lahir: e.target.value })
                    }
                    className="w-full border border-gray-500 rounded-lg px-3 py-2"
                    placeholder="DD-MM-YYYY"
                  />
                </div>
                <h3 className="text-xl font-bold mt-2">Jenis Kelamin</h3>
                <div className="w-full mx-auto mt-2">
                  <Select
                    value={editData.gender || ""}
                    onValueChange={(value) =>
                      setEditData({
                        ...editData,
                        gender: value as "LAKI_LAKI" | "PEREMPUAN",
                      })
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
                    value={editData.agama || ""}
                    onValueChange={(value) =>
                      setEditData({
                        ...editData,
                        agama: value,
                      })
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
                <h3 className="text-xl font-bold mt-2">Status Keaktifan</h3>
                <div className="w-full mx-auto mt-2">
                  <Select
                    value={editData.status_agt}
                    onValueChange={(value) =>
                      setEditData({
                        ...editData,
                        status_agt: value,
                      })
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
                    value={editData.tahun_gabung || 0}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        tahun_gabung: Number(e.target.value),
                      })
                    }
                    placeholder="Masukkan Tahun Masuk Anggota"
                    className="w-full border border-gray-500 rounded-lg px-3 py-2"
                  />
                </div>
              </form>
            </div>
          </DialogHeader>
          <Button
            onClick={handleEditSubmit}
            className="bg-amber-950 text-white text-base px-16 py-5 rounded-md hover:bg-gray-900 transition font-semibold mt-4"
          >
            Simpan Perubahan
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
