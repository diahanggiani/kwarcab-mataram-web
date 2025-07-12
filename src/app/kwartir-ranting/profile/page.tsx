"use client";
import { useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import React from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";

type KwartriRantingData = {
  kode_kwaran: string;
  nama_kwaran: string;
  alamat: string | null;
  kepala_kwaran: string | null;
  foto_kwaran: string | null;
  userId: string;
};

export default function Profile() {
  const { data: session } = useSession();
  const [profile, setProfile] = React.useState<KwartriRantingData | null>(null);
  const [isUbahOpen, setIsUbahOpen] = React.useState(false);
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [mounted, setMounted] = React.useState(false);

  useEffect(() => {
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
    fetchProfile();
    setMounted(true);
  }, [session]);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      toast.error("Semua field harus diisi!");
      return;
    }

    if (!/^[A-Z].*\d/.test(newPassword)) {
      toast.error("Password harus diawali huruf besar dan mengandung angka!");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("Password harus memiliki minimal 8 karakter!");
      return;
    }

    const res = await fetch("/api/profile", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        currentPassword,
        newPassword,
      }),
    });

    if (res.ok) {
      setIsUbahOpen(false);
      setCurrentPassword("");
      setNewPassword("");
    } else {
      const error = await res.json();
      alert(
        `Gagal mengubah password: ${error.message || "Terjadi kesalahan."}`
      );
    }
  };

  if (!mounted || !session || !profile) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Card className="p-6 flex items-center gap-4">
          <Loader2 className="animate-spin w-6 h-6" />
          <CardContent className="text-lg font-semibold">
            Memuat profil pengguna...
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 mb-4">
      <div className="flex items-center gap-12 mb-6">
        <Avatar className="h-64 w-64 mt-4">
          <AvatarImage
            src={profile?.foto_kwaran || "https://github.com/shadcn.png"}
          />
          <AvatarFallback>CN</AvatarFallback>
        </Avatar>
        <div className="flex flex-col uppercase leading-tight gap-1">
          <span className="font-bold text-2xl tracking-wide">
            {profile?.kode_kwaran}
          </span>
          <span className="font-bold text-3xl tracking-wide">
            {profile?.nama_kwaran}
          </span>
        </div>
      </div>
      <div>
        <h2 className="text-xl font-bold mt-2">Alamat Kwartir Ranting</h2>
        <div className="w-full mx-auto mt-2">
          <span className="w-full bg-amber-950 rounded-lg px-3 py-2 text-white block">
            {profile?.alamat || "Belum ada alamat"}
          </span>
        </div>
        <h2 className="text-xl font-bold mt-2">Kepala Kwartir Ranting</h2>
        <div className="w-full mx-auto mt-2">
          <span className="w-full bg-amber-950 rounded-lg px-3 py-2 text-white block">
            {profile?.kepala_kwaran || "Belum ada kepala kwartir"}
          </span>
        </div>
      </div>
      <div className="flex justify-center mt-6">
        <Link href="/kwartir-ranting/profile/edit-profile">
          <Button className="bg-amber-950 text-white text-base px-16 py-5 rounded-md hover:bg-amber-800 hover:text-gray-200 transition duration-300 ease-in-out">
            Ubah Profil
          </Button>
        </Link>
        <Button
          className="bg-amber-950 text-white text-base px-16 py-5 rounded-md hover:bg-amber-800 hover:text-gray-200 transition duration-300 ease-in-out ml-4"
          onClick={() => setIsUbahOpen(true)}
        >
          Ubah Password
        </Button>
      </div>
      <Dialog open={isUbahOpen} onOpenChange={setIsUbahOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-center text-2xl">
              Ubah Password
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <form onSubmit={handleChangePassword}>
              <div>
                <h2 className="text-base font-semibold">Password Lama</h2>
                <Input
                  type="password"
                  placeholder="Masukkan Password Lama"
                  className="mt-2"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </div>
              <div>
                <h2 className="text-base font-semibold mt-2">Password Baru</h2>
                <Input
                  type="password"
                  placeholder="Masukkan Password Baru"
                  className="mt-2"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <div className="flex justify-center mt-4">
                <Button
                  type="submit"
                  className="bg-amber-950 text-white text-base px-4 py-2 rounded-md hover:bg-gray-900 transition font-semibold"
                >
                  Simpan Password
                </Button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
