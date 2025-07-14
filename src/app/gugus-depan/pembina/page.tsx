"use client";
import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Loader2, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  no_telp: string | null;
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
  console.log("Pembina", pembina);

  useEffect(() => {
    if (!session) return;

    const fetchData = async () => {
      const profileRes = await fetch("/api/profile");
      const pembinaRes = await fetch("/api/pembina");

      if (profileRes.ok) setProfile(await profileRes.json());
      if (pembinaRes.ok) setPembina(await pembinaRes.json());
    };

    fetchData();
    setMounted(true);
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
      toast.success("Berhasil Menghapus Data Pembina", { duration: 5000 });
      setPembina(updatedPembina);
      setDeleteId(null);
      setIsDeleteOpen(false);
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
        toast.success("Berhasil Mengedit Data Pembina", { duration: 5000 });
      }
    } catch (error) {
      toast.error("Gagal Mengedit Data Pembina", { duration: 5000 });
      setIsEditOpen(false);
      setEditId(null);
      setEditData({});
      setDeleteId(null);
      console.error("Gagal mengupdate pembina", error);
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
                <TableHead className="text-center font-bold">NTA</TableHead>
                <TableHead className="text-center font-bold">Nama</TableHead>
                <TableHead className="text-center font-bold">
                  Tanggal Lahir
                </TableHead>
                <TableHead className="text-center font-bold">
                  Jenis Kelamin
                </TableHead>
                <TableHead className="text-center font-bold">Agama</TableHead>
                <TableHead className="text-center font-bold">Jenjang</TableHead>
                <TableHead className="text-center font-bold">Nomor Telepon</TableHead>
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
                pembina.map((pembina, index) => (
                  <TableRow
                    key={index}
                    className={
                      index % 2 === 0
                        ? "bg-gray-300 [&:hover]:bg-gray-300"
                        : "bg-white"
                    }
                  >
                    <TableCell className="text-center">{pembina.nta}</TableCell>
                    <TableCell className="text-center font-medium">
                      {pembina.nama_pbn}
                    </TableCell>
                    <TableCell className="text-center">
                      {new Date(pembina.tgl_lahir).toLocaleDateString("id-ID")}
                    </TableCell>
                    <TableCell className="text-center">
                      {pembina.gender === "LAKI_LAKI"
                        ? "Laki-Laki"
                        : "Perempuan"}
                    </TableCell>
                    <TableCell className="text-center">
                      {pembina.agama}
                    </TableCell>
                    <TableCell className="text-center">
                      {pembina.jenjang_pbn}
                    </TableCell>
                    <TableCell className="text-center">
                      {pembina.no_telp || "-"}
                    </TableCell>
                    <TableCell className="text-center">
                      {pembina.alamat}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="hover:bg-amber-200 hover:text-amber-900 border-amber-900 transition-all duration-200 focus:ring-2 focus:ring-amber-900 focus:ring-offset-2 shadow"
                          onClick={() => openEditDialog(pembina.id_pembina)}
                        >
                          ✏️ Ubah
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="bg-red-600 text-white hover:bg-red-700 hover:scale-105 transition-all duration-200 focus:ring-2 focus:ring-red-700 focus:ring-offset-2 shadow"
                          onClick={() => openDeleteDialog(pembina.id_pembina)}
                        >
                          🗑️ Hapus
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <div>
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
      </div>
      <div>
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
                <form onSubmit={handleEditSubmit} className="w-full">
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
                  <h2 className="text-xl font-bold mt-2">
                    Nomor Tanda Anggota
                  </h2>
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
                  <h2 className="text-xl font-bold mt-2">Nomor Telepon</h2>
                  <div className="w-full mx-auto mt-2">
                    <Input
                      type="text"
                      value={editData.no_telp || ""}
                      onChange={(e) =>
                        setEditData({ ...editData, no_telp: e.target.value })
                      }
                      placeholder="Masukkan Nomor Telepon Pembina"
                      className="w-full border border-gray-500 rounded-lg px-3 py-2"
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
                  <h2 className="text-xl font-bold mt-2">Agama</h2>
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
                  <h2 className="text-xl font-bold mt-2">Jenjang</h2>
                  <div className="w-full mx-auto mt-2">
                    <Select
                      value={editData.jenjang_pbn || ""}
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
                        <SelectItem value="PENEGAK_PANDEGA">
                          Penegak Pandega
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Button
                      type="submit"
                      className="w-full bg-amber-950 text-white text-base px-16 py-5 rounded-md hover:bg-gray-900 transition font-semibold mt-4"
                    >
                      Simpan Perubahan
                    </Button>
                  </div>
                </form>
              </div>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
