import { Outlet, Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Package, LogOut, Users2, ChartColumnBig } from "lucide-react";

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => (location.pathname.includes(path) ? "bg-blue-700 text-white" : "text-blue-100 hover:bg-blue-800");

  return (
    <div className="flex h-screen bg-gray-100">
      {/* SIDEBAR */}
      <aside className="w-64 bg-blue-900 text-white shadow-xl flex flex-col">
        <div className="p-6 border-b border-blue-800">
          <h2 className="text-xl font-bold">Admin Panel</h2>
          <p className="text-xs text-blue-300 mt-1">Halo, {user?.name}</p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <Link to="/admin/dashboard" className={`flex items-center gap-3 rounded-lg px-4 py-3 transition ${isActive("dashboard")}`}>
            <ChartColumnBig size={20} /> Dashboard
          </Link>
          <Link to="/admin/products" className={`flex items-center gap-3 rounded-lg px-4 py-3 transition ${isActive("products")}`}>
            <Package size={20} /> Produk
          </Link>
          <Link to="/admin/users" className={`flex items-center gap-3 rounded-lg px-4 py-3 transition ${isActive("users")}`}>
            <Users2 size={20} /> Users
          </Link>
        </nav>

        <div className="p-4 border-t border-blue-800">
          <button onClick={logout} className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-red-200 hover:bg-red-900/50 hover:text-red-100 transition">
            <LogOut size={20} /> Logout
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-auto p-8">
        <Outlet />
      </main>
    </div>
  );
}
