"use client";
import React from "react";
import { Trash2, Search, ListFilter, FileText, Loader2 } from "lucide-react";
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

type AjuanData = {
  id_ajuan: string;
  tingkat: string;
  nama_ajuan: string;
  formulir: string | null;
  status: string | null;
  nta: string | null;
};

export default function StatusPengajuan() {
  const { data: session } = useSession();
  const [ajuan, setAjuan] = useState<AjuanData[]>([]);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
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
        setAjuan(data);
      } else {
        console.error("Gagal fetch data:", res.status, await res.text());
      }
    };

    fetchData();
  }, [session, debouncedSearch, filteredAjuan]);

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
                  NTA
                </TableHead>
                <TableHead className="text-center font-bold text-base">
                  Formulir
                </TableHead>
                <TableHead className="text-center font-bold text-base">
                  Status
                </TableHead>
                <TableHead className="text-center font-bold text-base">
                  Actions
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
                    <TableCell className="text-left font-semibold">
                      {ajuan.nama_ajuan}
                    </TableCell>
                    <TableCell className="text-center">
                      {ajuan.tingkat || "-"}
                    </TableCell>
                    <TableCell className="text-center font-semibold">
                      {ajuan.nta || "-"}
                    </TableCell>
                    <TableCell className="text-center">
                      {ajuan.formulir ? (
                        <Link
                          href={ajuan.formulir}
                          target="_blank"
                          download={ajuan.formulir}
                        >
                          <FileText className="h-6 w-6 inline mr-1" />
                          Download File
                        </Link>
                      ) : (
                        "-"
                      )}
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
                      <div className="flex justify-center items-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDeleteDialog(ajuan.id_ajuan)}
                          className="h-8 w-8 p-0"
                        >
                          <Trash2 className="h-6 w-6 text-red-600" />
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
