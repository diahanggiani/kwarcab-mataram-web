"use client";
import React from "react";
import {
  Trash2,
  Search,
  ListFilter,
  FileText,
  Loader2,
  Pencil,
  Upload,
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
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { useSession } from "next-auth/react";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type AjuanData = {
  id_ajuan: string;
  tingkat: string;
  nama_ajuan: string;
  gender: string;
  formulir: string | null;
  status: string | null;
  nta: string | null;
};

export default function StatusPengajuan() {
  const { data: session } = useSession();
  const [ajuan, setAjuan] = useState<AjuanData[]>([]);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editData, setEditData] = useState<AjuanData | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
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
    if (!session) return;
    const fetchData = async () => {
      const res = await fetch(
        `/api/ajuan?status=${filteredAjuan}&search=${debouncedSearch}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      if (res.ok) {
        const data = await res.json();
        console.log("Data ajuan:", data);
        setAjuan(data.data);
      } else {
        console.error("Gagal fetch data:", res.status, await res.text());
      }
    };

    fetchData();
  }, [session, debouncedSearch, filteredAjuan]);

  const openEditDialog = (id: string) => {
    const dataToEdit = ajuan.find((item) => item.id_ajuan === id);
    if (dataToEdit) {
      setEditData(dataToEdit);
      setSelectedFile(null);
      setEditId(id);
      setIsEditOpen(true);
    }
  };

  const handleEditSubmit = async () => {
    if (!editId || !editData) return;

    const formData = new FormData();
    formData.append("nama_ajuan", editData.nama_ajuan);
    formData.append("tingkat", editData.tingkat);
    if (selectedFile) {
      formData.append("formulir", selectedFile);
    }

    try {
      const res = await fetch(`/api/ajuan/${editId}`, {
        method: "PATCH",
        body: formData,
      });

      if (res.ok) {
        toast.success("Pengajuan berhasil diperbarui!", {
          duration: 5000,
        });
        setIsEditOpen(false);
        setEditData(null);
        setEditId(null);
        setSelectedFile(null);
        const refreshed = await res.json();
        setAjuan((prev) =>
          prev.map((item) => (item.id_ajuan === editId ? refreshed : item))
        );
      } else {
        toast.error("Gagal memperbarui pengajuan!", {
          duration: 5000,
        });
      }
    } catch (error) {
      console.error("Edit Error:", error);
      toast.error("Terjadi kesalahan saat memperbarui.");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    const res = await fetch(`/api/ajuan/${deleteId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (res.ok) {
      const updateAjuan = ajuan.filter(
        (item: AjuanData) => item.id_ajuan !== deleteId
      );
      setAjuan(updateAjuan);
      setDeleteId(null);
      setIsDeleteOpen(false);
      toast.success("Pengajuan berhasil dihapus!");
    }
  };

  const openDeleteDialog = (id: string) => {
    setDeleteId(id);
    setIsDeleteOpen(true);
  };

  if (!mounted || !session || !ajuan) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Card className="p-6 flex items-center gap-4">
          <Loader2 className="animate-spin w-6 h-6" />
          <CardContent className="text-lg font-semibold">
            Memuat data pengajuan...
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">
            PENGAJUAN NOMOR TANDA ANGGOTA
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
              className="w-full pl-10 pr-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                <DropdownMenuLabel className="font-semibold">
                  Filter by Status
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {["ALL", "DITERIMA", "DITOLAK", "MENUNGGU"].map((status) => (
                  <DropdownMenuItem
                    key={status}
                    onClick={() => setFilteredAjuan(status)}
                    className={`hover:bg-gray-100 ${
                      filteredAjuan === status ? "font-bold" : ""
                    }`}
                  >
                    {status.charAt(0) + status.slice(1).toLowerCase()}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
        <CardContent>
          <Table className="border rounded-lg overflow-hidden">
            <TableHeader>
              <TableRow>
                <TableHead className="text-center font-bold text-base">
                  No
                </TableHead>
                <TableHead className="text-center font-bold text-base">
                  Nama
                </TableHead>
                <TableHead className="text-center font-bold text-base">
                  Jenjang
                </TableHead>
                <TableHead className="text-center font-bold text-base">
                  Formulir
                </TableHead>
                <TableHead className="text-center font-bold text-base">
                  NTA
                </TableHead>
                <TableHead className="text-center font-bold text-base">
                  Status
                </TableHead>
                <TableHead className="text-center font-bold text-base">
                  Aksi
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ajuan.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-gray-500">
                    Tidak ada data pengajuan.
                  </TableCell>
                </TableRow>
              ) : (
                ajuan.map((ajuan, index) => (
                  <TableRow
                    key={index}
                    className={index % 2 === 0 ? "bg-gray-100" : "bg-white"}
                  >
                    <TableCell className="text-center">{index + 1}</TableCell>
                    <TableCell className="text-center font-semibold">
                      {ajuan.nama_ajuan}
                    </TableCell>
                    <TableCell className="text-center">
                      {ajuan.tingkat || "-"}
                    </TableCell>
                    <TableCell className="text-center">
                      {ajuan.formulir ? (
                        <Link
                          href={ajuan.formulir}
                          target="_blank"
                          download={ajuan.formulir}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-md bg-amber-950 text-white text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-amber-700 hover:bg-amber-800 hover:text-yellow-200"
                        >
                          <FileText className="h-5 w-5 mr-1" />
                          Download File
                        </Link>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell className="text-center font-semibold">
                      {ajuan.nta || "-"}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center">
                        <Badge
                          className={`w-24 text-center ${
                            ajuan.status === "DITERIMA"
                              ? "bg-green-500 text-white text-sm"
                              : ajuan.status === "DITOLAK"
                              ? "bg-red-500 text-white text-sm"
                              : ajuan.status === "MENUNGGU"
                              ? "bg-yellow-500 text-white text-sm"
                              : "bg-yellow-500 text-white text-sm"
                          }`}
                        >
                          {ajuan.status === "DITERIMA"
                            ? "Diterima"
                            : ajuan.status === "DITOLAK"
                            ? "Ditolak"
                            : "Menunggu"}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center items-center gap-2">
                        <div className="flex flex-col items-center">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0 flex items-center justify-center border border-amber-950 text-amber-950 hover:bg-amber-950 hover:text-white transition-colors"
                            onClick={() => openEditDialog(ajuan.id_ajuan)}
                          >
                            <Pencil className="h-5 w-5" />
                          </Button>
                        </div>
                        <div className="flex flex-col items-center">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0 flex items-center justify-center border border-red-500 text-red-600 hover:bg-red-500 hover:text-white transition-colors"
                            onClick={() => openDeleteDialog(ajuan.id_ajuan)}
                          >
                            <Trash2 className="h-5 w-5" />
                          </Button>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-center text-2xl">
              Ubah Data Pengajuan
            </DialogTitle>
          </DialogHeader>
          <form className="mt-4">
            <h2 className="text-xl font-bold mt-2">Nama Anggota</h2>
            <div className="w-full mx-auto mt-2">
              <Input
                value={editData?.nama_ajuan || ""}
                onChange={(e) =>
                  setEditData((prev) =>
                    prev ? { ...prev, nama_ajuan: e.target.value } : null
                  )
                }
              />
            </div>
            <h2 className="text-xl font-bold mt-2">Jenis Kelamin</h2>
            <div className="w-full mx-auto mt-2">
              <Select
                value={editData?.gender || ""}
                onValueChange={(value) =>
                  setEditData((prev) =>
                    prev ? { ...prev, gender: value } : null
                  )
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
            <h2 className="text-xl font-bold mt-2">Jenjang</h2>
            <div className="w-full mx-auto mt-2">
              <Select
                value={editData?.tingkat || ""}
                onValueChange={(value) =>
                  setEditData((prev) =>
                    prev ? { ...prev, tingkat: value } : null
                  )
                }
              >
                <SelectTrigger className="w-full border border-gray-500 rounded-lg px-3 py-2">
                  <SelectValue placeholder="Pilih Jenis Jenjang" />
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
            <h2 className="text-xl font-bold mt-2">
              Upload Formulir Ajuan NTA
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
                  {selectedFile ? selectedFile.name : "No File Chosen"}
                </span>
              </div>
            </div>
          </form>
          <div className="flex justify-center mt-4">
            <Button
              onClick={handleEditSubmit}
              className="w-50 bg-amber-950 text-white text-sm px-3 py-1 rounded-md transition-transform transform hover:bg-amber-800 hover:scale-105 hover:shadow-lg"
              type="submit"
            >
              Kirim Pengajuan
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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
            <AlertDialogCancel>Batal</AlertDialogCancel>
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
  );
}
