import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between">
      <nav className="bg-amber-950 w-full flex justify-center items-center p-4 shadow-sm">
        <div className="flex items-center space-x-2">
          <Image
            className="dark:invert"
            src="/KwarcabMataram.png"
            alt="Logo"
            width={200}
            height={200}
          />
        </div>
      </nav>

      <section className="flex flex-col items-center mt-20 text-center">
        <h1 className="text-4xl font-semibold mb-2">
          Kwartir Cabang Kota Mataram
        </h1>
        <p className="text-lg mb-2 ">
          SISTEM INFORMASI KWARTIR CABANG KOTA MATARAM
        </p>
        <p className="text-sm mb-4">
          Pengelolaan Data Anggota, Pembina, dan Kegiatan Pramuka
        </p>

        <div className="flex space-x-4 mb-8">
          <Link href="/login">
            <Button className="bg-amber-950 text-white hover:bg-amber-800 hover:scale-105 transition-transform duration-200 px-8 py-4 text-xl">
              Login
            </Button>
          </Link>
        </div>
      </section>

      <footer className="w-full bg-gray-100 py-8 text-center text-sm">
        <h2 className="font-semibold mb-2">Hubungi Kami</h2>
        <p>Gedung A Lantai 2 Fakultas Teknik</p>
        <p>Jl. Majapahit No. 62, Mataram, NTB (Nusa Tenggara Barat)</p>
        <p>Telp: (0370) 631712</p>
        <p>Email: if@unram.ac.id</p>
        <p className="mt-4">© 2023 — Teknik Informatika Universitas Mataram</p>
      </footer>
    </main>
  );
}
