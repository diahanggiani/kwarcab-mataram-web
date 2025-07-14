"use client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Upload } from "lucide-react";
import React from "react";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Card, CardContent } from "@/components/ui/card";

type KwartirCabangData = {
  kode_kwarcab: string;
  nama_kwarcab: string;
  alamat: string;
  kepala_kwarcab: string;
  foto_kwarcab: string;
  userId: string;
};

export default function EditProfile() {
  const { data: session } = useSession();
  const router = useRouter();
  const [profile, setProfile] = React.useState<KwartirCabangData | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [mounted, setMounted] = useState(false);

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

  const handleEditProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (selectedFile && selectedFile.size > 500 * 1024) {
        toast.error("Ukuran file maksimal adalah 500KB!");
        return;
      }

      const formData = new FormData();
      formData.append("kepala_kwarcab", profile?.kepala_kwarcab || "");
      formData.append("alamat", profile?.alamat || "");
      if (selectedFile) {
        formData.append("foto", selectedFile);
      }
      console.log("Selected file:", selectedFile);
      formData.append("kode_kwarcab", session?.user?.kode_kwaran || "");

      const result = await fetch("/api/profile", {
        method: "PATCH",
        body: formData,
      });

      if (result.ok) {
        const data = await result.json();
        console.log("Profile updated successfully:", data);
        setProfile(data);
        setSelectedFile(null);
        router.push("/kwartir-cabang/profile");
        toast.success("Profil berhasil diperbarui!");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  if (!mounted || !session || !profile) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Card className="p-6 flex items-center gap-4">
          <Loader2 className="animate-spin w-6 h-6" />
          <CardContent className="text-lg font-semibold">
            Memuat data profile...
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
            src={profile?.foto_kwarcab || "https://github.com/shadcn.png"}
          />
          <AvatarFallback>CN</AvatarFallback>
        </Avatar>
        <div className="flex flex-col uppercase leading-tight gap-1">
          <span className="font-bold text-2xl tracking-wide">
            {profile?.kode_kwarcab}
          </span>
          <span className="font-bold text-3xl tracking-wide">
            {profile?.nama_kwarcab}
          </span>
        </div>
      </div>
      <form className="mt-2" onSubmit={handleEditProfile}>
        <h2 className="text-xl font-bold mb-2">Photo Profile</h2>
        <div className="flex items-center border border-gray-500 rounded-lg px-3 py-2">
          <label className="bg-gray-700 text-white text-sm px-3 py-1 rounded-md flex items-center gap-1 cursor-pointer hover:bg-gray-900 transition">
            <Upload className="w-4 h-4" />
            Choose File
            <Input
              type="file"
              className="hidden"
              accept=".jpg,.jpeg,.png"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setSelectedFile(file);
                }
              }}
            />
          </label>
          <span className="flex-grow text-gray-700 text-sm ml-3 truncate">
            {selectedFile ? selectedFile.name : "No File Chosen"}
          </span>
        </div>
        <h2 className="text-xl font-bold mt-2">Alamat Kwartir Cabang</h2>
        <Input
          value={profile?.alamat || ""}
          onChange={(e) =>
            profile && setProfile({ ...profile, alamat: e.target.value })
          }
          type="text"
          placeholder="Masukkan Alamat Sekolah"
          className="w-full border border-gray-500 rounded-lg px-3 py-2 mt-2"
        />
        <h2 className="text-xl font-bold mt-2">Kepala Kwartir Cabang</h2>
        <Input
          value={profile?.kepala_kwarcab || ""}
          onChange={(e) =>
            profile &&
            setProfile({ ...profile, kepala_kwarcab: e.target.value })
          }
          type="text"
          placeholder="Masukkan Nama Kepala Sekolah"
          className="w-full border border-gray-500 rounded-lg px-3 py-2 mt-2"
        />
        <div className="flex justify-center mt-6">
          <Button
            type="submit"
            className="bg-amber-950 text-white text-base px-16 py-5 rounded-md hover:bg-amber-800 hover:text-white transition duration-300 ease-in-out"
          >
            Simpan Perubahan
          </Button>
        </div>
      </form>
    </div>
  );
}
