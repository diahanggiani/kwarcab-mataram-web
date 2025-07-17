"use client";
import { Card, CardContent } from "@/components/ui/card";
import {
  Eye,
  Layers,
  Loader2,
  MapPin,
  Pencil,
  PlusCircle,
  Search,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";

type KwartirCabangData = {
  kode_kwarcab: string;
  nama_kwarcab: string;
  alamat: string;
  kepala_kwarcab: string;
  foto_kwarcab: string;
  userId: string;
};

type KegiatanData = {
  id_kegiatan: string;
  nama_kegiatan: string;
  lokasi: string;
  tingkat_kegiatan: string;
};

export default function Kegiatan() {
  const { data: session } = useSession();
  const [profile, setProfile] = useState<KwartirCabangData | null>(null);
  const [kegiatan, setKegiatan] = useState<KegiatanData[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

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

    const fetchKegiatan = async () => {
      const res = await fetch(`/api/kegiatan?search=${debouncedSearch}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (res.ok) {
        const data = await res.json();
        console.log("Kegiatan : ", data);
        setKegiatan(data);
      }
    };

    setMounted(true);
    fetchKegiatan();
    fetchProfile();
  }, [session, debouncedSearch]);

  const handleDelete = async () => {
    if (!deleteId) return;

    const res = await fetch(`/api/kegiatan/${deleteId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (res.ok) {
      const updateKegiatan = kegiatan.filter(
        (item: KegiatanData) => item.id_kegiatan !== deleteId
      );
      setKegiatan(updateKegiatan);
      setDeleteId(null);
      setIsDeleteOpen(false);
      toast.success("Kegiatan berhasil dihapus!", {
        duration: 5000,
      });
    }
  };

  const openDeleteDialog = (id: string) => {
    setDeleteId(id);
    setIsDeleteOpen(true);
  };

  if (!mounted || !kegiatan) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Card className="p-6 flex items-center gap-4">
          <Loader2 className="animate-spin w-6 h-6" />
          <CardContent className="text-lg font-semibold">
            Memuat data kegiatan...
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          KEGIATAN {profile?.nama_kwarcab?.toUpperCase()}
        </h1>
        <h2 className="text-xl font-semibold capitalize">
          Temukan berbagai kegiatan menarik yang telah kami lakukan
        </h2>
      </div>

      <div className="flex justify-between items-center mb-8 w-full">
        <div className="relative w-120">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            type="search"
            placeholder="Search kegiatan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 shadow-sm"
          />
        </div>

        <Link href="/kwartir-cabang/kegiatan/tambah-kegiatan">
          <Button
            size="sm"
            className="bg-amber-950 text-white text-sm rounded-md hover:bg-gray-900 transition"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
              Tambah Kegiatan
            </span>
          </Button>
        </Link>
      </div>

      {/* List Kegiatan */}
      <div className="space-y-8">
        {kegiatan.length === 0 ? (
          <div className="text-center text-gray-500">
            <p className="text-lg">Belum ada kegiatan yang tersedia.</p>
            <p className="text-sm">
              Silahkan tambahkan kegiatan dengan menekan tombol Tambah Kegiatan
            </p>
          </div>
        ) : (
          kegiatan.map((kegiatan, index) => (
            <Card
              key={index}
              className="bg-amber-950 text-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 mb-4"
            >
              <CardContent className="flex justify-between items-center w-full">
                <div>
                  <h2 className="text-2xl font-bold">
                    {kegiatan.nama_kegiatan}
                  </h2>
                  <div className="flex items-center gap-2 text-lg">
                    <MapPin className="w-5 h-5 text-yellow-400" />
                    <span>{kegiatan.lokasi}</span>
                  </div>
                  <div className="flex items-center gap-2 text-md">
                    <Layers className="w-5 h-5 text-blue-300" />
                    <span>{kegiatan.tingkat_kegiatan}</span>
                  </div>
                </div>
                <div className="flex gap-2 items-center">
                  <Link
                    href={`/kwartir-cabang/kegiatan/${kegiatan.id_kegiatan}`}
                    className="flex items-center gap-1 px-3 py-2 rounded-md bg-white/10 hover:bg-white/20 transition text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    <Eye className="h-5 w-5 mr-1" />
                    <span className="text-sm hidden sm:inline">Lihat</span>
                  </Link>
                  <Link
                    href={`/kwartir-cabang/kegiatan/${kegiatan.id_kegiatan}/edit-kegiatan`}
                    className="flex items-center gap-1 px-3 py-2 rounded-md bg-white/10 hover:bg-white/20 transition text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    <Pencil className="h-5 w-5 mr-1" />
                    <span className="text-sm hidden sm:inline">Ubah</span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => openDeleteDialog(kegiatan.id_kegiatan)}
                    className="flex items-center gap-1 px-3 py-2 rounded-md bg-red-600/80 hover:bg-red-700 transition text-white font-medium focus:outline-none focus:ring-2 focus:ring-red-400"
                  >
                    <Trash2 className="h-5 w-5 mr-1" />
                    <span className="text-sm hidden sm:inline">Hapus</span>
                  </button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
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
  );
}
