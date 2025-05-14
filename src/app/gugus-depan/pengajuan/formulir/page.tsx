"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileText, Download, Upload } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useSession } from "next-auth/react";
import React from "react";
import toast from "react-hot-toast";

type AjuanData = {
  nama_ajuan: string;
  tingkat: string;
  formulir: string;
};

export default function FormulirKTA() {
  const { data: session } = useSession();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [ajuan, setAjuan] = useState<AjuanData>({
    nama_ajuan: "",
    tingkat: "",
    formulir: "",
  });

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedFile) {
      alert("Harap unggah formulir terlebih dahulu!");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("nama_ajuan", ajuan.nama_ajuan);
      formData.append("tingkat", ajuan.tingkat);
      formData.append("formulir", selectedFile);
      formData.append("gusdepKode", session?.user?.kode_gusdep || "");

      const result = await fetch("/api/ajuan", {
        method: "POST",
        body: formData,
      });

      if (result.ok) {
        const data = await result.json();
        console.log("Form submitted successfully:", data);
        setAjuan({
          nama_ajuan: "",
          tingkat: "",
          formulir: "",
        });
        setSelectedFile(null);
        toast.success("Pengajuan berhasil dikirim!");
      } else {
        const errorData = await result.json();
        console.error("Error submitting form:", errorData);
        alert("Terjadi kesalahan saat mengirim pengajuan.");
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      alert("Terjadi kesalahan saat mengirim pengajuan.");
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-4">
        PENGAJUAN NOMOR TANDA ANGGOTA PRAMUKA
      </h1>
      <div className="w-full mx-auto p-4 bg-white rounded-lg shadow-md border border-gray-300">
        <h2 className="text-2xl font-bold">
          Persyaratan Pengajuan Kartu Tanda Anggota Pramuka
        </h2>
        <ol className="list-decimal pl-5 mt-2 space-y-1 text-base">
          <li>
            Gugus depan yang telah menyerahkan data potensi ke kwartir ranting dan
            kwartir cabang.
          </li>
          <li>
            Pengajuan NTA bisa perorangan atau dikolektifkan dengan ketentuan
            yaitu:
            <ul className="list-disc pl-6 mt-1 space-y-1">
              <li>
                Menyerahkan surat rekomendasi dari ketua gugus depan secara
                kolektif/perorangan bagi peserta didik.
              </li>
              <li>
                Menyerahkan salinan ijazah KPD/KPL bagi pelatih pembina pramuka.
              </li>
              <li>
                Menyerahkan salinan surat keputusan atau surat keterangan dari
                pihak yang berwenang pada masing-masing jajarannya bagi pengurus
                kwartir/majelis pembimbing/pamong saka/instruktur saka.
              </li>
              <li>
                Mengunggah pasfoto berlatar belakang merah dengan mengenakan
                seragam pramuka, setangan leher, dan penutup kepala sesuai
                golongannya (baret, boni, peci). Bagi anggota putri yang
                berjilbab setangan leher harus terlihat.
              </li>
              <li>Berkas dipindai dan diunggah dalam bentuk file .pdf</li>
            </ul>
          </li>
          <li>
            Hal ini dimaksudkan agar tidak terjadi penyalahgunaan Nomor Tanda
            Anggota (NTA) pramuka oleh pihak-pihak yang tidak bertanggung jawab.
          </li>
          <li>
            Pihak pengelola NTA dapat menolak pengajuan NTA dengan alasan
            tertentu atau atas keputusan kwartir cabang.
          </li>
        </ol>

        <h2 className="text-2xl font-bold mt-4">
          Tata Cara Pengajuan Nomor Tanda Anggota Pramuka
        </h2>
        <ol className="list-decimal pl-5 mt-2 space-y-1 text-base">
          <li>Unduh formulir Nomor Tanda Anggota di bawah ini.</li>
          <li>Isi formulir yang telah diunduh dengan lengkap.</li>
          <li>
            Scan formulir yang telah diisi dalam format PDF, lalu unggah
            kembali.
          </li>
        </ol>
      </div>
      <div className="w-full mx-auto p-4 bg-white rounded-lg shadow-md border border-gray-300 mt-4">
        <div className="w-full">
          <h2 className="text-xl font-bold mb-2">
            Download Formulir Ajuan NTA
          </h2>
          <div className="flex items-center border border-gray-500 rounded-lg px-3 py-2">
            <FileText className="text-gray-700 w-5 h-5 mr-2" />
            <span className="flex-grow text-gray-700 text-sm">
              Template-Formulir-Ajuan.word
            </span>
            <Link
              href="https://vryhkwvwaitpygwkssjv.supabase.co/storage/v1/object/public/file-bucket-nextjs/template-ajuan/Template-Formulir-Ajuan.docx"
              download
              className="bg-amber-950 text-white text-sm px-3 py-1 rounded-md flex items-center gap-1 transition hover:bg-amber-800 hover:shadow-lg hover:scale-105"
            >
              <Download className="w-4 h-4" />
              Unduh
            </Link>
          </div>
          <form className="mt-4">
            <h2 className="text-xl font-bold mt-2">Nama Anggota</h2>
            <div className="w-full mx-auto mt-2">
              <Input
                value={ajuan.nama_ajuan}
                onChange={(e) =>
                  setAjuan({ ...ajuan, nama_ajuan: e.target.value })
                }
                type="text"
                placeholder="Masukkan Nama Anggota"
                className="w-full border border-gray-500 rounded-lg px-3 py-2"
              />
            </div>
            <h2 className="text-xl font-bold mt-2">Jenjang</h2>
            <div className="w-full mx-auto mt-2">
              <Select
                value={ajuan.tingkat}
                onValueChange={(value) =>
                  setAjuan({ ...ajuan, tingkat: value })
                }
              >
                <SelectTrigger className="w-full border border-gray-500 rounded-lg px-3 py-2">
                  <SelectValue placeholder="Pilih Jenjang" />
                </SelectTrigger>
                <SelectContent className="w-full bg-white">
                  <SelectItem value="SIAGA">Siaga</SelectItem>
                  <SelectItem value="PENGGALANG">Penggalang</SelectItem>
                  <SelectItem value="PENEGAK">Penegak</SelectItem>
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
              onClick={handleSubmit}
              className="w-50 bg-amber-950 text-white text-sm px-3 py-1 rounded-md transition-transform transform hover:bg-amber-800 hover:scale-105 hover:shadow-lg"
              type="submit"
            >
              Kirim Pengajuan
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
