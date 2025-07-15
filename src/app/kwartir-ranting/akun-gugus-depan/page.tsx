"use client";
import React, { useState, useEffect } from "react";
import { Trash2, PlusCircle, Loader2, Pencil } from "lucide-react";
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

type UserGugusDepan = {
  id: string;
  username: string;
  password: string;
  gugusDepan: {
    kode_gusdep: string;
    nama_gusdep: string;
  };
};

export default function TambahAkun() {
  const { data: session } = useSession();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [users, setUsers] = useState<UserGugusDepan[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  // State untuk tambah akun
  const [addUsername, setAddUsername] = useState("");
  const [addPassword, setAddPassword] = useState("");
  const [addNama, setAddNama] = useState("");
  const [addKode, setAddKode] = useState("");

  // State untuk edit akun
  const [editUsername, setEditUsername] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editNama, setEditNama] = useState("");
  const [editKode, setEditKode] = useState("");

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

    if (!addUsername || !addPassword || !addNama || !addKode) {
      toast.error("Semua field harus diisi!");
      return;
    }

    try {
      const res = await fetch("/api/user/account", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: addUsername,
          password: addPassword,
          nama: addNama,
          kode: addKode,
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
            gugusDepan: {
              kode_gusdep: addKode,
              nama_gusdep: addNama,
            },
          },
        ]);
        setIsAddOpen(false);
        setAddUsername("");
        setAddPassword("");
        setAddNama("");
        setAddKode("");
        toast.success("Akun berhasil ditambahkan!");
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
              "Kode atau nama sudah digunakan. Silakan gunakan kode atau nama yang berbeda!"
            );
            break;
          default:
            toast.error("Terjadi kesalahan saat menambahkan akun.");
        }
      }
    } catch (error) {
      console.error("Error adding account:", error);
      toast.error("Terjadi kesalahan saat menambahkan akun.");
    }
  };

  const openEditDialog = (user: UserGugusDepan) => {
    setEditId(user.id);
    setEditUsername(user.username);
    setEditPassword("");
    setEditNama(user.gugusDepan.nama_gusdep);
    setEditKode(user.gugusDepan.kode_gusdep);
    setIsEditOpen(true);
  };


  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editUsername || !editNama || !editKode) {
      toast.error("Semua field harus diisi!");
      return;
    }

    try {
      const res = await fetch(`/api/user/account/${editId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: editUsername,
          password: editPassword, // boleh kosong
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
          gugusDepan: {
            kode_gusdep: editKode,
            nama_gusdep: editNama,
          },
        };

        setUsers((prev) =>
          prev.map((user) => (user.id === editId ? updatedUser : user))
        );

        setIsEditOpen(false);
        setEditId(null);
        setEditUsername("");
        setEditPassword("");
        setEditNama("");
        setEditKode("");
        toast.success("Akun berhasil diperbarui!", { duration: 5000 });
      } else {
        const errorData = await res.json();
        toast.error(errorData.message || "Gagal memperbarui akun.");
      }
    } catch {
      toast.error("Terjadi kesalahan saat mengubah akun.");
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
          (item: UserGugusDepan) => item.id !== deleteId
        );
        setUsers(updateUser);
        setDeleteId(null);
        setIsDeleteOpen(false);
        toast.success("Akun berhasil dihapus!", {duration: 5000});
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
            Memuat data akun Gugus Depan...
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-4">DAFTAR AKUN GUGUS DEPAN</h1>
      <Card>
        <CardContent className="flex justify-end">
          <Button
            className="bg-amber-950 text-white hover:bg-amber-800 hover:shadow-lg transition-all duration-300"
            onClick={() => setIsAddOpen(true)}
          >
            <PlusCircle className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
              Tambah Akun Gugus Depan
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
                  Nama Gugus Depan
                </TableHead>
                <TableHead className="text-center font-bold text-base">
                  Kode Gugus Depan
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
                    className="text-center text-gray-500 py-4"
                  >
                    Tidak ada data akun yang tersedia.
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
                      {user.gugusDepan.nama_gusdep}
                    </TableCell>
                    <TableCell className="text-center font-semibold">
                      {user.gugusDepan.kode_gusdep}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center items-center gap-2">
                        <div className="flex flex-col items-center">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0 flex items-center justify-center border border-amber-950 text-amber-950 hover:bg-amber-950 hover:text-white transition-colors"
                            onClick={() => openEditDialog(user)}
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
              Tambah Akun Gugus Depan
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <form onSubmit={handleSubmit}>
              <div>
                <h2 className="text-base font-semibold">Username</h2>
                <Input
                  value={addUsername}
                  onChange={(e) => setAddUsername(e.target.value)}
                  placeholder="Masukkan Username"
                  className="mt-2"
                />
              </div>
              <div>
                <h2 className="text-base font-semibold mt-2">Password</h2>
                <Input
                  type="password"
                  value={addPassword}
                  onChange={(e) => setAddPassword(e.target.value)}
                  className="mt-2"
                  placeholder="Masukkan Password"
                />
              </div>
              <div>
                <h2 className="text-base font-semibold mt-2">
                  Nama Gugus Depan
                </h2>
                <Input
                  value={addNama}
                  onChange={(e) => setAddNama(e.target.value)}
                  className="mt-2"
                  placeholder="Masukkan Nama Gugus Depan"
                />
              </div>
              <div>
                <h2 className="text-base font-semibold mt-2">
                  Kode Gugus Depan
                </h2>
                <Input
                  value={addKode}
                  onChange={(e) => setAddKode(e.target.value)}
                  className="mt-2"
                  placeholder="Masukkan kode Gugus Depan"
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
              Ubah Akun Gugus Depan
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <form onSubmit={handleEditSubmit}>
              <div>
                <h2 className="text-base font-semibold">Username</h2>
                <Input
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  placeholder="Masukkan Username"
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
                  Nama Gugus Depan
                </h2>
                <Input
                  value={editNama}
                  onChange={(e) => setEditNama(e.target.value)}
                  className="mt-2"
                  placeholder="Masukkan Nama Gugus Depan"
                />
              </div>
              <div>
                <h2 className="text-base font-semibold mt-2">
                  Kode Gugus Depan
                </h2>
                <Input
                  value={editKode}
                  onChange={(e) => setEditKode(e.target.value)}
                  className="mt-2"
                  placeholder="Masukkan Kode Gugus Depan"
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
