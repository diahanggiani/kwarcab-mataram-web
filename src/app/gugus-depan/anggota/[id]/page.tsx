"use client";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import { PlusCircle, Trash2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import toast from "react-hot-toast";

type Jenjang = {
  jenjang_agt: string;
  id_riwayat: string;
  tgl_perubahan: string;
};

type Kegiatan = {
  nama_kegiatan: string;
  lokasi: string;
  tanggal: string;
  tingkat_kegiatan: string;
};

export default function DetailAnggota() {
  const { data: session } = useSession();
  const { id } = useParams();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [jenjang, setJenjang] = useState<Jenjang[]>([]);
  const [kegiatan, setKegiatan] = useState<Kegiatan[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [jenjang_agt, setJenjangAgt] = useState("");
  const [tgl_perubahan, setTglPerubahan] = useState("");

  useEffect(() => {
    const fetchJenjang = async () => {
      const res = await fetch(`/api/anggota/${id}/riwayat-jenjang`);
      if (res.ok) {
        const data = await res.json();
        setJenjang(data);
      }
    };

    const fetchKegiatan = async () => {
      const res = await fetch(`/api/anggota/${id}/riwayat-kegiatan`);
      if (res.ok) {
        const data = await res.json();
        setKegiatan(data);
      }
    };

    fetchJenjang();
    fetchKegiatan();
  }, [session, id]);

  // fungsi format jenjang
  const formatJenjang = (jenjang_agt: string | undefined) => {
    if (!jenjang_agt) return "-";
    return jenjang_agt
      .toLowerCase()
      .split("_")
      .map((kata: string) => kata.charAt(0).toUpperCase() + kata.slice(1))
      .join(" ");
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    const res = await fetch(`/api/anggota/${id}/riwayat-jenjang/${deleteId}`, {
      method: "DELETE",
    });

    if (res.ok) {
      const updateJenjang = jenjang.filter(
        (item) => item.id_riwayat !== deleteId
      );
      setJenjang(updateJenjang);
      setDeleteId(null);
      setIsDeleteOpen(false);
    }
  };

  const openDeleteDialog = (id: string) => {
    setDeleteId(id);
    setIsDeleteOpen(true);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!jenjang_agt || !tgl_perubahan) {
      toast.error("Mohon lengkapi data terlebih dahulu!");
      return;
    }

    try {
      const res = await fetch(`/api/anggota/${id}/riwayat-jenjang`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ jenjang_agt, tgl_perubahan }),
      });

      if (res.ok) {
        const data = await res.json();
        setJenjang((prev) => [...prev, data]);
        setIsAddOpen(false);
        setJenjangAgt("");
        setTglPerubahan("");
        toast.success("Riwayat jenjang berhasil ditambahkan!");
      } else {
        console.error("Gagal menambahkan riwayat");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">
            RIWAYAT KENAIKAN JENJANG
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Button
              size="sm"
              onClick={() => setIsAddOpen(true)}
              className="bg-amber-950 text-white text-sm rounded-md hover:bg-gray-900 transition"
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Tambah Riwayat
            </Button>
          </div>
          <Table className="border rounded-lg overflow-hidden">
            <TableHeader>
              <TableRow>
                <TableHead className="text-center">No</TableHead>
                <TableHead className="text-center">Jenjang</TableHead>
                <TableHead className="text-center">Tanggal Perubahan</TableHead>
                <TableHead className="text-center">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jenjang.length > 0 ? (
                jenjang.map((item, index) => (
                  <TableRow
                    key={index}
                    className={index % 2 === 0 ? "bg-gray-300" : "bg-white"}
                  >
                    <TableCell className="text-center">{index + 1}</TableCell>
                    {/* <TableCell className="text-center">
                      {item.jenjang_agt}
                    </TableCell> */}

                    <TableCell className="text-center">
                      {formatJenjang(item.jenjang_agt)}
                    </TableCell>

                    <TableCell className="text-center">
                      {new Date(item.tgl_perubahan).toLocaleDateString("id-ID")}
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openDeleteDialog(item.id_riwayat)}
                        className="h-8 w-8 p-0"
                      >
                        <Trash2 className="h-5 w-5 text-red-600" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">
                    Tidak ada data.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Delete Dialog */}
      <AlertDialog
        open={isDeleteOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsDeleteOpen(false);
            setDeleteId(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Riwayat?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak bisa dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-center text-2xl">
              Tambah Riwayat Jenjang
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <h3 className="text-xl font-bold mt-2">Jenjang</h3>
            <div className="mt-2">
              <Select onValueChange={(value) => setJenjangAgt(value)}>
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

            <h3 className="text-xl font-bold mt-4">Tanggal Perubahan</h3>
            <div className="mt-2">
              <Input
                type="date"
                value={tgl_perubahan}
                onChange={(e) => setTglPerubahan(e.target.value)}
                className="w-full border px-3 py-2"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-amber-950 text-white mt-4 hover:bg-gray-900"
            >
              Tambah Riwayat
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold">
              RIWAYAT KEGIATAN ANGGOTA
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table className="border rounded-lg overflow-hidden">
              <TableHeader>
                <TableRow>
                  <TableHead className="text-center font-bold text-base">
                    Nama Kegiatan
                  </TableHead>
                  <TableHead className="text-center font-bold text-base">
                    Lokasi Kegiatan
                  </TableHead>
                  <TableHead className="text-center font-bold text-base">
                    Tanggal Kegiatan
                  </TableHead>
                  <TableHead className="text-center font-bold text-base">
                    Tingkat Kegiatan
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {kegiatan.length > 0 ? (
                  kegiatan.map((item, index) => (
                    <TableRow
                      key={index}
                      className={index % 2 === 0 ? "bg-gray-300" : "bg-white"}
                    >
                      <TableCell className="text-center">
                        {item.nama_kegiatan}
                      </TableCell>
                      <TableCell className="text-center">
                        {item.lokasi}
                      </TableCell>
                      <TableCell className="text-center">
                        {new Date(item.tanggal).toLocaleDateString("id-ID")}
                      </TableCell>
                      <TableCell className="text-center">
                        {item.tingkat_kegiatan}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center">
                      Tidak ada data.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
