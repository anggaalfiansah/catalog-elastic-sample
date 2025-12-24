import { useEffect, useState } from "react";
import { api } from "../../lib/axios";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid } from "recharts";
import { Package, Users, Search, TrendingUp, AlertCircle } from "lucide-react";
import type { Product, TrendingKeyword } from "../../types";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalUsers: 0,
    totalSearches: 0,
  });
  const [trendingData, setTrendingData] = useState([]);
  const [categoryData, setCategoryData] = useState<
    {
      name: string;
      value: number;
    }[]
  >([]);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [resTrending, resProducts, resUsers] = await Promise.all([api.get("/products/trending"), api.get("/products?q="), api.get("/users")]);

        const formattedTrending = resTrending.data.data.map((item: TrendingKeyword) => ({
          name: item.key,
          count: item.doc_count,
        }));

        const products: Product[] = resProducts.data.data;

        const catMap: Record<string, number> = {};
        products.forEach((p) => {
          catMap[p.category] = (catMap[p.category] || 0) + 1;
        });

        const formattedCats = Object.entries(catMap).map(([name, value]) => ({ name, value }));

        setTrendingData(formattedTrending);
        setCategoryData(formattedCats);

        setStats({
          totalProducts: products.length,
          totalUsers: resUsers.data.data.length,
          totalSearches: formattedTrending.reduce((acc: number, curr: { count: number }) => acc + curr.count, 0),
        });
      } catch (err) {
        console.error("Gagal load dashboard", err);
      }
    };

    loadDashboard();
  }, []);

  return (
    <div className="p-2 space-y-8 bg-gray-50">
      <div className="flex flex-col">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard Analitik</h1>
        <p className="text-gray-500">Pantau performa katalog dan minat pencarian user.</p>
      </div>

      {/* --- STATS CARDS --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-5">
          <div className="p-4 bg-blue-100 text-blue-600 rounded-xl">
            <Package size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-400 font-medium">Total Produk</p>
            <h2 className="text-2xl font-bold">{stats.totalProducts}</h2>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-5">
          <div className="p-4 bg-purple-100 text-purple-600 rounded-xl">
            <Users size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-400 font-medium">Total User</p>
            <h2 className="text-2xl font-bold">{stats.totalUsers}</h2>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-5">
          <div className="p-4 bg-orange-100 text-orange-600 rounded-xl">
            <Search size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-400 font-medium">Total Pencarian</p>
            <h2 className="text-2xl font-bold">{stats.totalSearches}</h2>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* --- BAR CHART: TOP KEYWORDS --- */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp size={20} className="text-blue-600" />
            <h3 className="font-bold text-gray-800">Kata Kunci Terpopuler (Elasticsearch)</h3>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendingData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#9ca3af", fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#9ca3af", fontSize: 12 }} />
                <Tooltip cursor={{ fill: "#f9fafb" }} contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }} />
                <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* --- PIE CHART: CATEGORY MIX --- */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-6">
            <AlertCircle size={20} className="text-green-600" />
            <h3 className="font-bold text-gray-800">Komposisi Kategori Produk</h3>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="80%">
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                  {categoryData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap justify-center gap-4 mt-2">
              {categoryData.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                  <span className="text-xs text-gray-500 font-medium">{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
