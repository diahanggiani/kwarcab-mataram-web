"use client";
import React, { useState, useEffect } from "react";
import { Trash2, Search, PlusCircle, Loader2, Pencil } from "lucide-react";
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
  const [editUsername, setEditUsername] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editNama, setEditNama] = useState("");
  const [editKode, setEditKode] = useState("");
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [users, setUsers] = useState<UserKwartirRanting[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [nama, setNama] = useState("");
  const [kode, setKode] = useState("");
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch(`/api/user/account?search=${debouncedSearch}`, {
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
  }, [session, debouncedSearch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username || !password || !nama || !kode) {
      alert("Semua field harus diisi!");
      return;
    }

    try {
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
        toast.success("Akun berhasil ditambahkan!", { duration: 5000 });
        window.location.reload();
      } else if (res.status === 400) {
        const errorData = await res.json();
        switch (errorData.message) {
          case "All fields are required":
            toast.error("Semua field harus diisi!");
            break;
          case "Username cannot contain spaces":
            toast.error("Username tidak boleh mengandung spasi!");
            break;
          case "Kode cannot contain spaces":
            toast.error("Kode tidak boleh mengandung spasi!");
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

  const openEditDialog = (id: string) => {
    const userToEdit = users.find((user) => user.id === id);
    if (!userToEdit) return;

    setEditId(id);
    setEditUsername(userToEdit.username);
    setEditPassword(""); // Kosongkan demi keamanan
    setEditNama(userToEdit.kwaran.nama_kwaran);
    setEditKode(userToEdit.kwaran.kode_kwaran);
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/user/account/${editId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: editUsername,
          password: editPassword || undefined, // hanya jika diisi
          nama: editNama,
          kode: editKode,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const updatedUser = {
          id: editId || data.user.id,
          username: editUsername,
          password: editPassword,
          kwaran: {
            kode_kwaran: editKode,
            nama_kwaran: editNama,
          },
        };

        setUsers((prev) =>
          prev.map((user) => (user.id === editId ? updatedUser : user))
        );

        toast.success("Akun berhasil diperbarui!", {
          duration: 5000,
        });
        setIsEditOpen(false);
        setEditId(null);
        setEditUsername("");
        setEditPassword("");
        setEditNama("");
        setEditKode("");
      } else {
        const errorData = await res.json();

        if (
          errorData.message ===
          "This code and name are already taken. Please use different values."
        ) {
          toast.error("Kode dan nama kwaran sudah digunakan.");
        } else if (errorData.message === "Username already exists") {
          toast.error("Username sudah digunakan.");
        } else {
          toast.error(errorData.message || "Gagal mengedit akun.");
        }
      }
    } catch (error) {
      console.error("Error updating account:", error);
      toast.error("Terjadi kesalahan saat mengedit akun.");
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
    <div>
      <h1 className="text-3xl font-bold mb-4">DAFTAR AKUN KWARTIR RANTING</h1>
      <Card>
        <CardContent className="flex justify-between">
          <div className="flex relative w-3/10">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search account..."
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
                      {user.kwaran?.nama_kwaran || "-"}
                    </TableCell>
                    <TableCell className="text-center font-semibold">
                      {user.kwaran?.kode_kwaran || "-"}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center items-center gap-2">
                        <div className="flex flex-col items-center">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0 flex items-center justify-center border border-amber-950 text-amber-950 hover:bg-amber-950 hover:text-white transition-colors"
                            onClick={() => openEditDialog(user.id)}
                          >
                            <Pencil className="h-5 w-5" />
                          </Button>
                        </div>
                        <div className="flex flex-col items-center">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0 flex items-center justify-center border border-red-500 text-red-600 hover:bg-red-500 hover:text-white transition-colors"
                            onClick={() => openDeleteDialog(user.id)}
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

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-center text-2xl">
              Edit Akun Kwartir Ranting
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <form onSubmit={handleEditSubmit}>
              <div>
                <h2 className="text-base font-semibold">Username</h2>
                <Input
                  type="text"
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  className="mt-2"
                />
              </div>
              <div>
                <h2 className="text-base font-semibold mt-2">
                  Password (opsional)
                </h2>
                <Input
                  type="password"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  className="mt-2"
                  placeholder="Biarkan kosong jika tidak ingin mengubah password"
                />
              </div>
              <div>
                <h2 className="text-base font-semibold mt-2">
                  Nama Kwartir Ranting
                </h2>
                <Input
                  type="text"
                  value={editNama}
                  onChange={(e) => setEditNama(e.target.value)}
                  className="mt-2"
                />
              </div>
              <div>
                <h2 className="text-base font-semibold mt-2">
                  Kode Kwartir Ranting
                </h2>
                <Input
                  type="text"
                  value={editKode}
                  onChange={(e) => setEditKode(e.target.value)}
                  className="mt-2"
                />
              </div>
              <div className="flex justify-center mt-4">
                <Button
                  type="submit"
                  className="bg-amber-950 text-white text-base px-4 py-2 rounded-md hover:bg-gray-900 transition font-semibold"
                >
                  Simpan Perubahan
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
