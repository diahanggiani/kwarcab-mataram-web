"use client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Tooltip,
  CartesianGrid,
  XAxis,
  YAxis,
  Legend,
  Bar,
  LabelList,
  LineChart,
  Line,
} from "recharts";

type KwartriRantingData = {
  kode_kwaran: string;
  nama_kwaran: string;
  alamat: string | null;
  kepala_kwaran: string | null;
  foto_kwaran: string | null;
  userId: string;
};

type AnggotaStats = {
  siaga: { LAKI_LAKI: number; PEREMPUAN: number };
  penggalang: { LAKI_LAKI: number; PEREMPUAN: number };
  penegak: { LAKI_LAKI: number; PEREMPUAN: number };
  pandega: { LAKI_LAKI: number; PEREMPUAN: number };
  total_anggota: number;
};

type GusdepData = Record<string, { LAKI_LAKI: number; PEREMPUAN: number }>;

type Stats = {
  title: string;
  value: number;
  color: string;
};

type Kegiatan = {
  label: string;
  value: number;
};

type KegiatanPerJenjang = {
  kegiatan_gusdep: Record<string, number>;
};

type HistoryData = { tahun: number; jumlah: number }[];

export default function Dashboard() {
  const { data: session } = useSession();
  const [anggotaStats, setAnggotaStats] = useState<AnggotaStats | null>(null);
  const [profile, setProfile] = useState<KwartriRantingData | null>(null);
  const [anggotaData, setAnggotaData] = useState<GusdepData>({});
  const [historyData, setHistoryData] = useState<HistoryData>([]);
  const [totalKegiatan, setTotalKegiatan] = useState<Kegiatan[]>([]);
  const [kegiatanPerJenjang, setKegiatanPerJenjang] =
    useState<KegiatanPerJenjang | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
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
          console.log("Total Kegiatan fetching", data);
          setTotalKegiatan(data); // data harus berupa array
        }
      }
    };

    const fetchGender = async () => {
      if (session) {
        const res = await fetch("/api/dashboard/anggotaByGender");
        if (res.ok) {
          const data = await res.json();
          if (data && typeof data === "object" && !Array.isArray(data)) {
            setAnggotaData(data);
          }
        }
      }
    };

    const fetchKegiatanPerJenjang = async () => {
      if (session) {
        const res = await fetch("/api/dashboard/kegiatanPerJenjang");
        if (res.ok) {
          const data = await res.json();
          setKegiatanPerJenjang(data);
        }
      }
    };

    const fetchHistoryData = async () => {
      if (session) {
        const res = await fetch("/api/dashboard/anggotaByYear");
        if (res.ok) {
          const data = await res.json();
          const formatted = data.map(
            (item: { tahun: number; jumlah: number }) => ({
              year: item.tahun.toString(),
              members: item.jumlah || 0,
            })
          );

          setHistoryData(formatted);
        }
      }
    };

    setMounted(true);
    fetchProfile();
    fetchTotalKegiatan();
    fetchAnggotaStats();
    fetchGender();
    fetchKegiatanPerJenjang();
    fetchHistoryData();
  }, [session]);

  const stats: Stats[] = anggotaStats
    ? [
        {
          title: `Total Anggota Pramuka`,
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

  const barChartGudep = kegiatanPerJenjang
    ? Object.entries(kegiatanPerJenjang.kegiatan_gusdep).map(
        ([jenjang, value]) => ({
          jenjang,
          total: value,
        })
      )
    : [];

  if (
    !mounted ||
    !session ||
    !profile ||
    !anggotaStats ||
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
          <span className="text-base tracking-widest">{profile?.alamat || "Alamat Kwartir Ranting"}</span>
          <span className="text-base tracking-widest">
            {profile?.kepala_kwaran || "Kepala Kwartir Ranting"}
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
              <p className="text-sm font-semibold">{profile?.nama_kwaran}</p>
            </Card>
          ))}
        </div>

        <Card className="p-6">
          <CardTitle className="text-center text-xl font-bold mb-6">
            Data {profile?.nama_kwaran}
          </CardTitle>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-center text-lg font-bold mb-4">
                  Jumlah Anggota Laki-Laki dan Perempuan di Setiap Gugus Depan
                </h3>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart
                    data={Object.entries(anggotaData).map(([name, data]) => ({
                      name,
                      laki: data.LAKI_LAKI || 0,
                      perempuan: data.PEREMPUAN || 0,
                    }))}
                    margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="name"
                      angle={-15}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar
                      dataKey="laki"
                      stackId="a"
                      fill="#3366CC"
                      name="Laki-laki"
                      barSize={30}
                    >
                      <LabelList dataKey="laki" position="top" />
                    </Bar>
                    <Bar
                      dataKey="perempuan"
                      stackId="a"
                      fill="#FF668C"
                      name="Perempuan"
                      barSize={30}
                    >
                      <LabelList dataKey="perempuan" position="top" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div>
                <h3 className="text-center text-lg font-bold mb-4">
                  Total Kegiatan Gugus Depan Berdasarkan Jenjang
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={barChartGudep}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="jenjang" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="total" fill="#8884d8" name="Gugus Depan">
                      <LabelList dataKey="total" position="top" />
                    </Bar>
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
