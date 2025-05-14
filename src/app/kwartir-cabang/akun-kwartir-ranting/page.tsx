"use client";
import React, { useState, useEffect } from "react";
import { Trash2, Search, PlusCircle, Loader2 } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";

type UserKwartirRanting = {
  id: string;
  username: string;
  password: string;
  kwaran: {
    kode_kwaran: string;
    nama_kwaran: string;
  };
};

export default function TambahAkun() {
  const { data: session } = useSession();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [users, setUsers] = useState<UserKwartirRanting[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [nama, setNama] = useState("");
  const [kode, setKode] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch("/api/user/account", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (res.ok) {
        const data = await res.json();
        console.log("Hasil Akun:", data);
        setUsers(data.accounts);
      }
    };

    if (session) {
      fetchData();
    }
    setMounted(true);
  }, [session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username || !password || !nama || !kode) {
      alert("Semua field harus diisi!");
      return;
    }

    try {
      console.log("Sending payload:", { username, password, nama, kode });

      const res = await fetch("/api/user/account", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          password,
          nama,
          kode,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const user = data.user;
        setUsers((prevUsers) => [
          ...prevUsers,
          {
            id: user.id,
            username: user.username,
            password: user.password,
            kwaran: {
              kode_kwaran: kode,
              nama_kwaran: nama,
            },
          },
        ]);
        setIsAddOpen(false);
        setUsername("");
        setPassword("");
        setNama("");
        setKode("");
        toast.success("Akun berhasil ditambahkan!");
      } else if (res.status === 400) {
        const errorData = await res.json();
        switch (errorData.message) {
          case "All fields are required":
            toast.error("Semua field harus diisi!");
            break;
          case "Username cannot contain spaces":
            toast.error(
              "Username tidak boleh mengandung spasi!"
            );
            break;
          case "Kode cannot contain spaces":
            toast.error(
              "Kode tidak boleh mengandung spasi!"
            );
            break;
          case "Password must be at least 8 characters long, contain uppercase, lowercase letters, and numbers.":
            toast.error(
              "Password harus minimal 8 karakter, mengandung huruf besar, huruf kecil, dan angka!"
            );
            break;
          case "Username already exists":
            toast.error(
              "Username sudah digunakan. Silakan gunakan username lain!"
            );
            break;
          case "This code and name are already taken. Please use different values.":
            toast.error(
              "Kode dan nama sudah digunakan. Silakan gunakan kode dan nama yang berbeda!"
            );
            break;
          default:
            toast.error("Terjadi kesalahan saat menambahkan akun.");
        }
      }
    } catch (error) {
      console.error("Error adding account:", error);
      alert("Terjadi kesalahan saat menambahkan akun.");
    }
  };

  const handleDelete = async () => {
    if (!deleteId || !session) return;

    try {
      const res = await fetch(`/api/user/account/${deleteId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          session,
        }),
      });

      if (res.ok) {
        const updateUser = users.filter(
          (item: UserKwartirRanting) => item.id !== deleteId
        );
        setUsers(updateUser);
        setDeleteId(null);
        setIsDeleteOpen(false);
        toast.success("Akun berhasil dihapus!");
      }
    } catch (error) {
      console.error("Error deleting account:", error);
    }
  };

  const openDeleteDialog = (id: string) => {
    setDeleteId(id);
    setIsDeleteOpen(true);
  };

  if (!mounted || !session || !users) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Card className="p-6 flex items-center gap-4">
          <Loader2 className="animate-spin w-6 h-6" />
          <CardContent className="text-lg font-semibold">
            Memuat data akun Kwartir Ranting...
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
            Kelola Akun Kwartir Ranting
          </CardTitle>
        </CardHeader>
        <CardContent className="flex justify-between">
          <div className="flex relative w-3/10">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              type="search"
              placeholder="Search members..."
              className="w-full pl-10 pr-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 shadow-sm"
            />
          </div>
          <Button
            className="bg-amber-950 text-white hover:bg-amber-800 hover:shadow-lg transition-all duration-300"
            onClick={() => setIsAddOpen(true)}
          >
            <PlusCircle className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
              Tambah Akun Kwartir Ranting
            </span>
          </Button>
        </CardContent>
        <CardContent>
          <Table className="border rounded-lg overflow-hidden">
            <TableHeader>
              <TableRow>
                <TableHead className="text-center font-bold text-base">
                  No
                </TableHead>
                <TableHead className="text-center font-bold text-base">
                  Username
                </TableHead>
                <TableHead className="text-center font-bold text-base">
                  Password
                </TableHead>
                <TableHead className="text-center font-bold text-base">
                  Nama Kwartir Ranting
                </TableHead>
                <TableHead className="text-center font-bold text-base">
                  Kode Kwartir Ranting
                </TableHead>
                <TableHead className="text-center font-bold text-base">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center text-gray-500 italic"
                  >
                    Tidak ada data akun Kwartir Ranting.
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user, index) => (
                  <TableRow
                    key={user.id}
                    className={index % 2 === 0 ? "bg-gray-100" : "bg-white"}
                  >
                    <TableCell className="text-center">{index + 1}</TableCell>
                    <TableCell className="text-center font-semibold">
                      {user.username}
                    </TableCell>
                    <TableCell className="text-center">******</TableCell>
                    <TableCell className="text-center font-semibold">
                      {user.kwaran.nama_kwaran}
                    </TableCell>
                    <TableCell className="text-center font-semibold">
                      {user.kwaran.kode_kwaran}
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openDeleteDialog(user.id)}
                        className="h-8 w-8 p-0"
                      >
                        <Trash2 className="h-6 w-6 text-red-600" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal Tambah Akun */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-center text-2xl">
              Tambah Akun Kwartir Ranting
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <form onSubmit={handleSubmit}>
              <div>
                <h2 className="text-base font-semibold">Username</h2>
                <Input
                  type="text"
                  placeholder="Masukkan Username"
                  className="mt-2"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              <div>
                <h2 className="text-base font-semibold mt-2">Password</h2>
                <Input
                  type="password"
                  placeholder="Masukkan Password"
                  className="mt-2"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div>
                <h2 className="text-base font-semibold mt-2">
                  Nama Kwartir Ranting
                </h2>
                <Input
                  type="text"
                  placeholder="Masukkan Nama Kwartir Ranting"
                  className="mt-2"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                />
              </div>
              <div>
                <h2 className="text-base font-semibold mt-2">
                  Kode Kwartir Ranting
                </h2>
                <Input
                  type="text"
                  placeholder="Masukkan Kode Kwartir Ranting"
                  className="mt-2"
                  value={kode}
                  onChange={(e) => setKode(e.target.value)}
                />
              </div>
              <div className="flex justify-center mt-4">
                <Button
                  type="submit"
                  className="bg-amber-950 text-white text-base px-4 py-2 rounded-md hover:bg-gray-900 transition font-semibold"
                >
                  Tambah Akun
                </Button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Hapus Akun */}
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
              menghapus akun dan data Anda dari server kami.
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
  );
}
