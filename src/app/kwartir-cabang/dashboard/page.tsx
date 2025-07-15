"use client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  PieChart,
  Pie,
  Cell,
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

type KwartirCabangData = {
  kode_kwarcab: string;
  nama_kwarcab: string;
  alamat: string | null;
  kepala_kwarcab: string | null;
  foto_kwarcab: string | null;
  userId: string;
};

type AnggotaStats = {
  siaga: { LAKI_LAKI: number; PEREMPUAN: number };
  penggalang: { LAKI_LAKI: number; PEREMPUAN: number };
  penegak: { LAKI_LAKI: number; PEREMPUAN: number };
  pandega: { LAKI_LAKI: number; PEREMPUAN: number };
  total_anggota: number;
  total_kegiatan: number;
};

type Stats = {
  title: string;
  value: number;
  color: string;
};

type TotalKegiatan = {
  label: string;
  value: number;
};

type TotalGugusdepan = {
  nama_kwaran: string;
  junmlahGudep: number;
};

type KegiatanPerJenjang = {
  kegiatan_gusdep: Record<string, number>;
  kegiatan_kwaran: Record<string, number>;
};

type HistoryData = { tahun: number; jumlah: number }[];

export default function Dashboard() {
  const { data: session } = useSession();
  const [anggotaStats, setAnggotaStats] = useState<AnggotaStats | null>(null);
  const [profile, setProfile] = useState<KwartirCabangData | null>(null);
  const [kegiatanData, setKegiatanData] = useState<TotalKegiatan[]>([]);
  const [gugusdepanData, setGugusdepanData] = useState<TotalGugusdepan[]>([]);
  const [historyData, setHistoryData] = useState<HistoryData>([]);
  const [kegiatanPerJenjang, setKegiatanPerJenjang] =
    useState<KegiatanPerJenjang | null>(null);
  const [jenjangPerKwaran, setJenjangPerKwaran] = useState([]);
  const [mounted, setMounted] = useState(false);
  const colors = [
    "#FF6384",
    "#36A2EB",
    "#FFCE56",
    "#4BC0C0",
    "#9966FF",
    "#FF9F40",
  ];

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

    const fetchKegiatanData = async () => {
      if (session) {
        const res = await fetch("/api/dashboard/totalKegiatan");
        if (res.ok) {
          const data = await res.json();
          setKegiatanData(data);
        }
      }
    };

    const fetchGugusdepanData = async () => {
      if (session) {
        const res = await fetch("/api/dashboard/gusdepByKwaran");
        if (res.ok) {
          const data = await res.json();
          console.log("Gugusdepan Data:", data);
          setGugusdepanData(data);
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

    const fetchJenjangPerKwaran = async () => {
      if (session) {
        const res = await fetch("/api/dashboard/jenjangPerKwaran");
        if (res.ok) {
          const data = await res.json();
          setJenjangPerKwaran(data);
        }
      }
    };

    setMounted(true);
    fetchProfile();
    fetchAnggotaStats();
    fetchKegiatanData();
    fetchGugusdepanData();
    fetchKegiatanPerJenjang();
    fetchJenjangPerKwaran();
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
          title: "Total Kegiatan Seluruh Kwaran",
          value: kegiatanData[0]?.value || 0,
          color: "text-orange-500",
        },
        {
          title: "Total Kegiatan Seluruh Gugus Depan",
          value: kegiatanData[1]?.value || 0,
          color: "text-gray-500",
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

  const barChartKwaran = kegiatanPerJenjang
    ? Object.entries(kegiatanPerJenjang.kegiatan_kwaran).map(
        ([jenjang, value]) => ({
          jenjang,
          total: value,
        })
      )
    : [];

  if (!mounted || !session || !profile || !anggotaStats) {
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
            src={profile?.foto_kwarcab || "https://github.com/shadcn.png"}
          />
          <AvatarFallback>CN</AvatarFallback>
        </Avatar>
        <div className="flex flex-col uppercase leading-tight gap-1">
          <span className="font-bold text-3xl tracking-wide">
            {profile?.nama_kwarcab}
          </span>
          <span className="text-base tracking-wide">
            Kode Kwarcab: {profile?.kode_kwarcab}
          </span>
          <span className="text-base tracking-widest">
            Alamat: {profile?.alamat || "Alamat Kwartir Cabang"}
          </span>
          <span className="text-base tracking-widest">
            Kepala Kwarcab: {profile?.kepala_kwarcab || "Kepala Kwarcab"}
          </span>
        </div>
      </div>

      <hr className="border-t border-gray-300 mb-8" />

      <div className="p-6 space-y-8">
        {/* Statistic Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {stats.map(({ title, value, color }) => (
            <Card
              key={title}
              className="flex flex-col items-center p-6 shadow-md"
            >
              <CardTitle className="text-base text-center capitalize font-semibold">
                {title}
              </CardTitle>
              <CardContent className={`text-5xl font-bold ${color}`}>
                {value}
              </CardContent>
              <p className="text-sm font-semibold">{profile?.nama_kwarcab}</p>
            </Card>
          ))}
        </div>

        <Card className="p-6">
          <CardContent>
            <div>
              <h3 className="text-center text-lg font-bold mb-4">
                Jumlah Gugus Depan Setiap Kwaran
              </h3>
              {gugusdepanData && gugusdepanData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={gugusdepanData}
                      dataKey="jumlahGudep"
                      nameKey="nama_kwaran"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label
                    >
                      {gugusdepanData.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={colors[index % colors.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-gray-500 py-12">
                  Data Jumlah Gugus Depan Setiap Kwaran Belum Tersedia
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div>
                <h3 className="text-center text-lg font-bold mb-4">
                  Total Kegiatan Gugus Depan Berdasarkan Jenjang
                </h3>
                {barChartGudep && barChartGudep.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={barChartGudep}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="jenjang" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="total" name="Gugus Depan">
                        {barChartGudep.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={colors[index % colors.length]}
                          />
                        ))}
                        <LabelList dataKey="total" position="top" />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center text-gray-500 py-12">
                    Data Total Kegiatan Gugus Depan Berdasarkan Jenjang Tersedia
                  </div>
                )}
              </div>
              <div>
                <h3 className="text-center text-lg font-bold mb-4">
                  Total Kegiatan Kwartir Ranting Berdasarkan Jenjang
                </h3>
                {barChartKwaran && barChartKwaran.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={barChartKwaran}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="jenjang" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="total" name="Kwartir Ranting">
                        {barChartKwaran.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={colors[index % colors.length]}
                          />
                        ))}
                        <LabelList dataKey="total" position="top" />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center text-gray-500 py-12">
                    Data Total Kegiatan Kwartir Ranting Berdasarkan Jenjang
                    Belum Tersedia
                  </div>
                )}
              </div>
            </div>
            <div className="mt-6">
              <h3 className="text-center text-lg font-bold mb-4">
                Jumlah Anggota per Jenjang di Tiap Kwartir Ranting
              </h3>
              {jenjangPerKwaran && jenjangPerKwaran.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart
                    data={jenjangPerKwaran}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="kwaran"
                      angle={-15}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="SIAGA" fill="#FFCE56" />
                    <Bar dataKey="PENGGALANG" fill="#36A2EB" />
                    <Bar dataKey="PENEGAK" fill="#4BC0C0" />
                    <Bar dataKey="PANDEGA" fill="#9966FF" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-gray-500 py-12">
                  Data Jumlah Anggota per Jenjang di Tiap Kwartir Ranting Belum
                  Tersedia
                </div>
              )}
            </div>

            <div className="mt-6">
              <h3 className="text-center text-lg font-bold mb-4">
                Data Anggota Pramuka Setiap Tahun
              </h3>
              {historyData && historyData.length > 0 ? (
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
              ) : (
                <div className="text-center text-gray-500 py-12">
                  Data Anggota Pramuka Setiap Tahun Belum Tersedia
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
