"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  Table,
} from "@/components/ui/table";
import { Search, PlusCircle, Trash2 } from "lucide-react";
import React from "react";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type User = {
  id: string;
  username: string;
  role: string;
  kwarcab: {
    nama_kwarcab: string;
    kode_kwarcab: string;
  } | null;
  kwaran: {
    nama_kwaran: string;
    kode_kwaran: string;
    kwarcab: {
      kode_kwarcab: string;
    };
  } | null;
  gugusDepan: {
    nama_gusdep: string;
    kode_gusdep: string;
  } | null;
};

export default function SuperAdmin() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [nama, setNama] = useState("");
  const [kode, setKode] = useState("");
  const [kwarcab, setKwarcab] = useState("");
  const [kwaran, setKwaran] = useState("");

  useEffect(() => {
    const fetchUsers = async () => {
      if (session) {
        try {
          const response = await fetch("api/user/admin", {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          });
          if (response.ok) {
            const data = await response.json();
            console.log("Fetched users:", data); // Debugging log
            setUsers(data.users);
          } else {
            console.error("Failed to fetch users:", response.status);
            setUsers([]); // Fallback to an empty array
          }
        } catch (error) {
          console.error("Error fetching users:", error);
          setUsers([]); // Fallback to an empty array
        }
      }
    };

    fetchUsers();
  }, [session]);

  const handleDelete = async () => {
    if (!deleteId || !session) return;

    try {
      const res = await fetch(`/api/user/admin/${deleteId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          session,
        }),
      });

      if (res.ok) {
        const updateUser = users.filter((item: User) => item.id !== deleteId);
        setUsers(updateUser);
        setDeleteId(null);
        setIsDeleteOpen(false);
      }
    } catch (error) {
      console.error("Error deleting account:", error);
    }
  };

  const openDeleteDialog = (id: string) => {
    setDeleteId(id);
    setIsDeleteOpen(true);
  };

const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) return;

    const body: {
        username: string;
        password: string;
        role: string;
        nama: string;
        kode: string;
        kode_kwaran?: string;
        kode_kwarcab?: string;
    } = {
        username,
        password,
        role,
        nama,
        kode,
        ...(role === "USER_GUSDEP" && { kode_kwaran: kwaran, kode_kwarcab: kwarcab }),
        ...(role === "USER_KWARAN" && { kode_kwarcab: kwarcab }),
    };

    console.log("Submitting user:", body); // Debugging log

    try {
        const res = await fetch("/api/user/admin", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        });

        if (res.ok) {
            const data = await res.json();
            setUsers((prev) => [...prev, data.user]);
            setIsAddOpen(false);
            setUsername("");
            setPassword("");
            setRole("");
            setNama("");
            setKode("");
            setKwarcab("");
            setKwaran("");
        }
    } catch (error) {
        console.error("Error submitting user:", error);
    }
};

  const validateForm = () => {
    if (!username || !password || !role || !nama || !kode) {
      alert("Semua field wajib diisi.");
      return false;
    }

    if (role === "USER_KWARAN" && !kwarcab) {
      alert("Kode Kwarcab wajib diisi untuk role Kwaran.");
      return false;
    }

    if (role === "USER_GUSDEP") {
      if (!kwaran || !kwarcab) {
        alert("Kode Kwaran dan Kwarcab wajib diisi untuk role Gugus Depan.");
        return false;
      }
    }

    return true;
  };

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Kelola Akun User</CardTitle>
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
            onClick={() => setIsAddOpen(true)}
            className="bg-amber-950 text-white hover:bg-amber-800 hover:shadow-lg transition-all duration-300"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
              Tambah Akun
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
                  Role
                </TableHead>
                <TableHead className="text-center font-bold text-base">
                  Nama
                </TableHead>
                <TableHead className="text-center font-bold text-base">
                  Kode
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">
                    Tidak ada data akun.
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
                      {user.role}
                    </TableCell>
                    <TableCell className="text-center font-semibold">
                      {user.role === "USER_GUSDEP" &&
                        user.gugusDepan?.nama_gusdep}
                      {user.role === "USER_KWARAN" && user.kwaran?.nama_kwaran}
                      {user.role === "USER_KWARCAB" &&
                        user.kwarcab?.nama_kwarcab}
                    </TableCell>
                    <TableCell className="text-center font-semibold">
                      {user.role === "USER_GUSDEP" &&
                        user.gugusDepan?.kode_gusdep}
                      {user.role === "USER_KWARAN" && user.kwaran?.kode_kwaran}
                      {user.role === "USER_KWARCAB" &&
                        user.kwarcab?.kode_kwarcab}
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        onClick={() => openDeleteDialog(user.id)}
                        variant="ghost"
                        size="sm"
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
              Tambah Akun User
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
                <h2 className="text-base font-semibold mt-2">Role</h2>
                <Select onValueChange={(value: string) => setRole(value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih Role" />
                  </SelectTrigger>
                  <SelectContent className="w-full bg-white">
                    <SelectItem value="USER_KWARCAB">Kwarcab</SelectItem>
                    <SelectItem value="USER_KWARAN">Kwaran</SelectItem>
                    <SelectItem value="USER_GUSDEP">Gugus Depan</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {role && (
                <>
                  <div>
                    <h2 className="text-base font-semibold mt-2">
                      {role === "USER_GUSDEP"
                        ? "Nama Gugus Depan"
                        : role === "USER_KWARAN"
                        ? "Nama Kwaran"
                        : "Nama Kwarcab"}
                    </h2>
                    <Input
                      type="text"
                      placeholder="Masukkan Nama"
                      className="mt-2"
                      value={nama}
                      onChange={(e) => setNama(e.target.value)}
                    />
                  </div>

                  <div>
                    <h2 className="text-base font-semibold mt-2">Kode</h2>
                    <Input
                      type="text"
                      placeholder="Masukkan Kode"
                      className="mt-2"
                      value={kode}
                      onChange={(e) => setKode(e.target.value)}
                    />
                  </div>

                  {/* KODE KWARAN untuk USER_GUSDEP */}
                  {role === "USER_GUSDEP" && (
                    <div>
                      <h2 className="text-base font-semibold mt-2">
                        Kode Kwaran
                      </h2>
                      <Input
                        type="text"
                        placeholder="Masukkan Kode Kwaran"
                        className="mt-2"
                        value={kwaran}
                        onChange={(e) => setKwaran(e.target.value)}
                      />
                    </div>
                  )}

                  {/* KODE KWARCAB untuk USER_GUSDEP dan USER_KWARAN */}
                  {(role === "USER_GUSDEP" || role === "USER_KWARAN") && (
                    <div>
                      <h2 className="text-base font-semibold mt-2">
                        Kode Kwarcab
                      </h2>
                      <Input
                        type="text"
                        placeholder="Masukkan Kode Kwarcab"
                        className="mt-2"
                        value={kwarcab}
                        onChange={(e) => setKwarcab(e.target.value)}
                      />
                    </div>
                  )}
                </>
              )}

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
    </div>
  );
}
