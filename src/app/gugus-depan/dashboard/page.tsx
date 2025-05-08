"use client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Legend,
  Bar,
  LineChart,
  Line,
} from "recharts";
import { Loader2 } from "lucide-react";

type GugusDepanData = {
  kode_gusdep: string;
  nama_gusdep: string;
  alamat: string | null;
  npsn: string | null;
  nama_sekolah: string | null;
  kepala_sekolah: string | null;
  foto_gusdep: string | null;
};

type AnggotaStats = {
  siaga: { LAKI_LAKI: number; PEREMPUAN: number };
  penggalang: { LAKI_LAKI: number; PEREMPUAN: number };
  penegak: { LAKI_LAKI: number; PEREMPUAN: number };
  pandega: { LAKI_LAKI: number; PEREMPUAN: number };
  total_anggota: number;
};

type TotalKegiatan = {
  label: string;
  value: number;
};

type Stats = {
  title: string;
  value: number;
  color: string;
};

type GenderData = {
  gender: string;
  jumlah: number;
};

type HistoryData = {
  tahun: number;
  jumlah: number;
};

export default function Dashboard() {
  const { data: session } = useSession();
  const [profile, setProfile] = useState<GugusDepanData | null>(null);
  const [totalKegiatan, setTotalKegiatan] = useState<TotalKegiatan[]>([]);
  const [anggotaStats, setAnggotaStats] = useState<AnggotaStats | null>(null);
  const [gender, setGender] = useState<GenderData[]>([]);
  const [historyData, setHistoryData] = useState<
    { year: string; members: number }[]
  >([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const fetchProfile = async () => {
      if (session) {
        const res = await fetch("/api/profile");
        if (res.ok) {
          const data = await res.json();
          setProfile(data);
        }
      }
    };

    const fetchAnggotaStats = async () => {
      if (session) {
        const res = await fetch("/api/dashboard/anggotaByJenjang");
        if (res.ok) {
          const data = await res.json();
          setAnggotaStats(data);
        }
      }
    };

    const fetchTotalKegiatan = async () => {
      if (session) {
        const res = await fetch("/api/dashboard/totalKegiatan");
        if (res.ok) {
          const data = await res.json();
          console.log("Total Kegiatan:", data);
          setTotalKegiatan(data);
        }
      }
    };

    const fetchGender = async () => {
      if (session) {
        try {
          const res = await fetch("/api/dashboard/anggotaByGender");
          if (res.ok) {
            const data = await res.json();
            const formatted = Object.entries(data).map(([key, value]) => ({
              gender: key,
              jumlah: value as number,
            }));

            setGender(formatted);
          } else {
            console.error("Failed to fetch gender data:", res.status);
            setGender([]);
          }
        } catch (error) {
          console.error("Error fetching gender data:", error);
          setGender([]);
        }
      }
    };

    const fetchHistoryData = async () => {
      if (session) {
        const res = await fetch("/api/dashboard/anggotaByYear");
        if (res.ok) {
          const data = await res.json();
          const formatted = data.map((item: HistoryData) => ({
            year: item.tahun.toString(),
            members: item.jumlah || 0,
          }));
          setHistoryData(formatted);
        }
      }
    };
    fetchProfile();
    fetchGender();
    fetchTotalKegiatan();
    fetchAnggotaStats();
    fetchHistoryData();
  }, [session]);

  const stats: Stats[] = anggotaStats
    ? [
        {
          title: `Total Anggota Pramuka Gugus Depan`,
          value: anggotaStats.total_anggota || 0,
          color: "text-red-500",
        },
        {
          title: "Total Anggota Siaga",
          value:
            (anggotaStats.siaga?.LAKI_LAKI || 0) +
            (anggotaStats.siaga?.PEREMPUAN || 0),
          color: "text-yellow-500",
        },
        {
          title: "Total Anggota Penggalang",
          value:
            (anggotaStats.penggalang?.LAKI_LAKI || 0) +
            (anggotaStats.penggalang?.PEREMPUAN || 0),
          color: "text-green-500",
        },
        {
          title: "Total Anggota Penegak",
          value:
            (anggotaStats.penegak?.LAKI_LAKI || 0) +
            (anggotaStats.penegak?.PEREMPUAN || 0),
          color: "text-blue-500",
        },
        {
          title: "Total Anggota Pandega",
          value:
            (anggotaStats.pandega?.LAKI_LAKI || 0) +
            (anggotaStats.pandega?.PEREMPUAN || 0),
          color: "text-purple-500",
        },
        {
          title: "Total Kegiatan Gugus Depan",
          value:
            totalKegiatan.find((item) => item.label.includes("gugus depan"))
              ?.value || 0,
          color: "text-orange-500",
        },
      ]
    : [];

  const genderData: { name: string; value: number; color: string }[] =
    Array.isArray(gender)
      ? gender.map((item) => ({
          name: item.gender === "LAKI_LAKI" ? "Laki-laki" : "Perempuan",
          value: item.jumlah || 0,
          color: item.gender === "LAKI_LAKI" ? "#3366CC" : "#FF9900",
        }))
      : [];

  const levelData = anggotaStats
    ? [
        {
          name: "Siaga",
          male: anggotaStats.siaga.LAKI_LAKI || 0,
          female: anggotaStats.siaga.PEREMPUAN || 0,
        },
        {
          name: "Penggalang",
          male: anggotaStats.penggalang.LAKI_LAKI || 0,
          female: anggotaStats.penggalang.PEREMPUAN || 0,
        },
        {
          name: "Penegak",
          male: anggotaStats.penegak.LAKI_LAKI || 0,
          female: anggotaStats.penegak.PEREMPUAN || 0,
        },
        {
          name: "Pandega",
          male: anggotaStats.pandega.LAKI_LAKI || 0,
          female: anggotaStats.pandega.PEREMPUAN || 0,
        },
      ]
    : [];

  if (
    !mounted ||
    !session ||
    !profile ||
    !anggotaStats ||
    gender.length === 0 ||
    totalKegiatan.length === 0
  ) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Card className="p-6 flex items-center gap-4">
          <Loader2 className="animate-spin w-6 h-6" />
          <CardContent className="text-lg font-semibold">
            Memuat data dashboard...
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Profile Section */}
      <div className="flex items-center gap-12 mb-6">
        <Avatar className="h-48 w-48">
          <AvatarImage
            src={profile?.foto_gusdep || "https://github.com/shadcn.png"}
          />
          <AvatarFallback>CN</AvatarFallback>
        </Avatar>
        <div className="flex flex-col uppercase leading-tight gap-1">
          <span className="font-bold text-2xl tracking-wide">
            {profile?.kode_gusdep}
          </span>
          <span className="font-bold text-3xl tracking-wide">
            {profile?.nama_gusdep}
          </span>
          <span className="text-2xl font-bold">
            {profile?.nama_sekolah || "Nama Sekolah"}
          </span>
          <span className="text-base tracking-widest">
            {profile?.alamat || "Alamat Sekolah"}
          </span>
          <span className="text-base tracking-widest">
            {profile?.kepala_sekolah || "Kepala Sekolah"}
          </span>
          <span className="text-base tracking-widest">
            {profile?.npsn || "NPSN"}
          </span>
        </div>
      </div>
      <hr className="border-t border-gray-300 mb-8" />

      <div className="p-6 space-y-8">
        {/* Statistic Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.map(({ title, value, color }) => (
            <Card
              key={title}
              className="flex flex-col items-center p-6 shadow-md"
            >
              <CardTitle className="text-lg text-center capitalize font-semibold">
                {title}
              </CardTitle>
              <CardContent className={`text-5xl font-bold ${color}`}>
                {value}
              </CardContent>
              <p className="text-sm font-semibold">{profile?.nama_sekolah}</p>
            </Card>
          ))}
        </div>

        {/* Charts */}
        <Card className="p-6">
          <CardTitle className="text-center text-xl font-bold mb-6">
            Data Pramuka {profile?.nama_gusdep}
          </CardTitle>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-center text-lg font-bold mb-4">
                  Data Anggota Pramuka Berdasarkan Gender
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={genderData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {genderData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div>
                <h3 className="text-center text-lg font-bold mb-4">
                  Data Anggota Pramuka Berdasarkan Jenjang
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={levelData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="male" fill="#3366CC" name="Laki-laki" />
                    <Bar dataKey="female" fill="#FF9900" name="Perempuan" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="text-center text-lg font-bold mb-4">
                Data Anggota Pramuka Setiap Tahun
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={historyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="members"
                    stroke="#FF4081"
                    dot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
