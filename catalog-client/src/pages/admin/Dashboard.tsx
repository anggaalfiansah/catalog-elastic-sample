import { useEffect, useState, type ReactNode } from "react";
import { api } from "../../lib/axios";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, CartesianGrid
} from "recharts";
import { Package, Users, Search, TrendingUp, AlertCircle, Loader2 } from "lucide-react";

// --- TYPE DEFINITIONS (FIXED) ---

// Masalah ada di sini tadi. Recharts butuh Index Signature.
interface CategoryData {
  name: string;
  value: number;
  [key: string]: string | number; // <--- TAMBAHAN PENTING: Agar kompatibel dengan Recharts
}

interface TrendingData {
  name: string;
  count: number;
  [key: string]: string | number; // <--- TAMBAHAN PENTING
}

interface DashboardStats {
  totalProducts: number;
  totalUsers: number;
  totalSearches: number;
}

interface StatsApiResponse {
  data: {
    counts: {
      products: number;
      users: number;
      searches: number;
    };
    charts: {
      categories: CategoryData[];
      trending: TrendingData[];
    };
  };
}

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: number;
  color: string;
}

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

export default function Dashboard() {
  const [loading, setLoading] = useState<boolean>(true);

  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    totalUsers: 0,
    totalSearches: 0,
  });

  const [trendingData, setTrendingData] = useState<TrendingData[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const res = await api.get<StatsApiResponse>("/products/stats");
        const { counts, charts } = res.data.data;

        setStats({
          totalProducts: counts.products,
          totalUsers: counts.users,
          totalSearches: counts.searches,
        });

        setCategoryData(charts.categories);
        setTrendingData(charts.trending);
      } catch (err) {
        console.error("Gagal load dashboard", err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={48} className="animate-spin text-blue-600" />
          <p className="text-gray-500 font-medium">Menghitung Data Statistik...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-8 space-y-8">
      {/* HEADER */}
      <div className="flex flex-col">
        <h1 className="text-3xl font-extrabold text-gray-800 tracking-tight">Executive Dashboard</h1>
        <p className="text-gray-500 mt-1">Real-time analytics powered by Elasticsearch Aggregations.</p>
      </div>

      {/* --- STATS CARDS --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          icon={<Package size={24} />}
          label="Total Produk"
          value={stats.totalProducts}
          color="bg-blue-100 text-blue-600"
        />
        <StatCard
          icon={<Users size={24} />}
          label="Total User"
          value={stats.totalUsers}
          color="bg-purple-100 text-purple-600"
        />
        <StatCard
          icon={<Search size={24} />}
          label="Total Pencarian"
          value={stats.totalSearches}
          color="bg-orange-100 text-orange-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* --- BAR CHART: TOP SEARCH --- */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 transition-all hover:shadow-md">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-50 rounded-lg">
              <TrendingUp size={20} className="text-blue-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-800">Top Pencarian User</h3>
              <p className="text-xs text-gray-400">Berdasarkan log aktivitas user</p>
            </div>
          </div>

          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendingData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#6b7280", fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#6b7280", fontSize: 12 }} />
                <Tooltip
                  cursor={{ fill: "#f9fafb" }}
                  contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)" }}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* --- PIE CHART: KATEGORI --- */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 transition-all hover:shadow-md">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-green-50 rounded-lg">
              <AlertCircle size={20} className="text-green-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-800">Distribusi Kategori</h3>
              <p className="text-xs text-gray-400">Total {stats.totalProducts} produk aktif</p>
            </div>
          </div>

          <div className="h-80 w-full flex flex-col items-center">
            <div className="w-full h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%" cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {categoryData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Custom Legend */}
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-2">
              {categoryData.map((item, index) => (
                <div key={index} className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                  <span className="text-xs text-gray-600 font-medium">
                    {item.name} <span className="text-gray-400">({item.value})</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Komponen Kecil untuk Kartu Statistik
function StatCard({ icon, label, value, color }: StatCardProps) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-5 transition-transform hover:scale-[1.02] cursor-default">
      <div className={`p-4 ${color} rounded-xl shadow-sm`}>{icon}</div>
      <div>
        <p className="text-sm text-gray-400 font-medium mb-1">{label}</p>
        <h2 className="text-3xl font-bold text-gray-800 tracking-tight">{value.toLocaleString("id-ID")}</h2>
      </div>
    </div>
  );
}