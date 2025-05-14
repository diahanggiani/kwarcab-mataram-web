"use client";
import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Loader2, MoreHorizontal, PlusCircle } from "lucide-react";
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
import { toast } from "react-hot-toast";

type GugusDepanData = {
  nama_gusdep: string;
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

export default function Pembina() {
  const { data: session } = useSession();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [profile, setProfile] = useState<GugusDepanData | null>(null);
  const [pembina, setPembina] = useState<PembinaData[]>([]);
  const [editId, setEditId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<PembinaData>>({});
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

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
      const res = await fetch("/api/pembina", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (res.ok) {
        const data = await res.json();
        setPembina(data);
      }
    };

    fetchProfile();
    fetchMembers();
  }, [session]);

  const handleDelete = async () => {
    if (!deleteId) return;

    const res = await fetch(`/api/pembina/${deleteId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (res.ok) {
      const updatedPembina = pembina.filter(
        (item: PembinaData) => item.id_pembina !== deleteId
      );
      setPembina(updatedPembina);
      setDeleteId(null);
      setIsDeleteOpen(false);
      toast.success("Data pembina berhasil dihapus!");
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
      const res = await fetch(`/api/pembina/${editId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editData),
      });

      if (res.ok) {
        const updatedPembina = pembina.map((item) =>
          item.id_pembina === editId ? { ...item, ...editData } : item
        );
        setPembina(updatedPembina);
        setIsEditOpen(false);
        setEditId(null);
        setEditData({});
        toast.success("Data pembina berhasil diperbarui!");
      } else if (res.status === 400) {
        const errorData = await res.json();
        if (errorData.message === "NTA already registered") {
          toast.error("NTA sudah terdaftar. Silakan gunakan NTA yang berbeda.");
        } else {
          toast.error("Terjadi kesalahan saat memperbarui data pembina.");
        }
      } else {
        toast.error("Terjadi kesalahan saat memperbarui data pembina.");
      }
    } catch (error) {
      console.error("Gagal mengupdate pembina", error);
      toast.error("Terjadi kesalahan saat memperbarui data pembina.");
    }
  };

  const openEditDialog = (id: string) => {
    const dataToEdit = pembina.find((pembina) => pembina.id_pembina === id);
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
            Memuat data pembina...
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-4 uppercase">
        PEMBINA {profile?.nama_gusdep?.toUpperCase()}
      </h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">
            Daftar Pembina {profile?.nama_gusdep}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <Link href="/gugus-depan/pembina/tambah-pembina">
              <Button
                size="sm"
                className="bg-amber-950 text-white text-sm rounded-md hover:bg-gray-900 transition"
              >
                <PlusCircle className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                  Tambah Pembina
                </span>
              </Button>
            </Link>
          </div>
        </CardContent>
        <CardContent>
          <Table className="border rounded-lg overflow-hidden">
            <TableHeader>
              <TableRow>
                <TableHead className="text-center font-bold">Nama</TableHead>
                <TableHead className="text-center font-bold">NTA</TableHead>
                <TableHead className="text-center font-bold">
                  Tanggal Lahir
                </TableHead>
                <TableHead className="text-center font-bold">Gender</TableHead>
                <TableHead className="text-center font-bold">Agama</TableHead>
                <TableHead className="text-center font-bold">Jenjang</TableHead>
                <TableHead className="text-center font-bold">Alamat</TableHead>
                <TableHead className="text-center font-bold">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pembina.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-gray-500">
                    Tidak ada data pembina yang tersedia.
                  </TableCell>
                </TableRow>
              ) : (
                pembina.map((pembina: PembinaData, index) => (
                  <TableRow
                    key={pembina.id_pembina}
                    className={index % 2 === 0 ? "bg-gray-300" : "bg-white"}
                  >
                    <TableCell className="text-center font-medium">
                      {pembina.nama_pbn}
                    </TableCell>
                    <TableCell className="text-center">{pembina.nta}</TableCell>
                    <TableCell className="text-center">
                      {new Date(pembina.tgl_lahir).toLocaleDateString("id-ID")}
                    </TableCell>
                    <TableCell className="text-center">
                      {pembina.gender === "LAKI_LAKI"
                        ? "Laki-laki"
                        : "Perempuan"}
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
                            <DropdownMenuItem
                              onClick={() => openEditDialog(pembina.id_pembina)}
                              className="hover:bg-gray-100 px-3 py-2 rounded-md transition-all duration-200"
                            >
                              ✏️ Ubah
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                openDeleteDialog(pembina.id_pembina)
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
              menghapus data Anda dari server kami.
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
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-center text-2xl">
              Ubah Profil Pembina
            </DialogTitle>
            <div>
              <form>
                <h2 className="text-xl font-bold mt-2">Nama Pembina</h2>
                <div className="w-full mx-auto mt-2">
                  <Input
                    type="text"
                    value={editData.nama_pbn || ""}
                    onChange={(e) =>
                      setEditData({ ...editData, nama_pbn: e.target.value })
                    }
                    placeholder="Masukkan Nama Pembina"
                    className="w-full border border-gray-500 rounded-lg px-3 py-2"
                  />
                </div>
                <h2 className="text-xl font-bold mt-2">Nomor Tanda Anggota</h2>
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
                <h2 className="text-xl font-bold mt-2">Tanggal Lahir</h2>
                <div className="w-full mx-auto mt-2">
                  <Input
                    type="date"
                    value={editData.tgl_lahir || ""}
                    onChange={(e) =>
                      setEditData({ ...editData, tgl_lahir: e.target.value })
                    }
                    className="w-full border border-gray-500 rounded-lg px-3 py-2"
                    pattern="\d{2}-\d{2}-\d{4}"
                    placeholder="DD-MM-YYYY"
                  />
                </div>
                <h2 className="text-xl font-bold mt-2">Alamat</h2>
                <div className="w-full mx-auto mt-2">
                  <Input
                    type="text"
                    value={editData.alamat || ""}
                    onChange={(e) =>
                      setEditData({ ...editData, alamat: e.target.value })
                    }
                    placeholder="Masukkan Alamat Pembina"
                    className="w-full border border-gray-500 rounded-lg px-3 py-2"
                  />
                </div>
                <h2 className="text-xl font-bold mt-2">Jenis Kelamin</h2>
                <div className="w-full mx-auto mt-2">
                  <Select
                    value={editData.gender}
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
                <h2 className="text-xl font-bold mt-2">Agama</h2>
                <div className="w-full mx-auto mt-2">
                  <Select
                    value={editData.agama}
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
                <h2 className="text-xl font-bold mt-2">Jenjang</h2>
                <div className="w-full mx-auto mt-2">
                  <Select
                    value={editData.jenjang_pbn}
                    onValueChange={(value) =>
                      setEditData({ ...editData, jenjang_pbn: value })
                    }
                  >
                    <SelectTrigger className="w-full border border-gray-500 rounded-lg px-3 py-2">
                      <SelectValue placeholder="Pilih Jenjang" />
                    </SelectTrigger>
                    <SelectContent className="w-full bg-white">
                      <SelectItem value="SIAGA">Siaga</SelectItem>
                      <SelectItem value="PENGGALANG">Penggalang</SelectItem>
                      <SelectItem value="PENEGAK_PANDEGA">Penegak Pandega</SelectItem>
                    </SelectContent>
                  </Select>
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
