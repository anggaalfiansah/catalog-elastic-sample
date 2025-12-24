import { useEffect, useState } from "react";
import { api } from "../../lib/axios";
import type { User } from "../../types";
import { Trash2, Edit, Shield, RefreshCw, Users, Loader2, X, Plus } from "lucide-react";
import type { ColDef, ICellRendererParams } from "ag-grid-community";
import AgGridTable from "../../components/AgGridTable";

export default function UserList() {
  const [users, setUsers] = useState<User[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // --- STATE FORM ---
  const initialForm = {
    name: "",
    email: "",
    password: "", // Tambah password untuk user baru
    role: "STAFF" as "STAFF" | "ADMIN",
  };
  const [formData, setFormData] = useState(initialForm);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get("/users");
      setUsers(res.data.data);
    } catch (error) {
      console.error("Gagal load users", error);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchUsers();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const resetForm = () => {
    setFormData(initialForm);
    setEditingId(null);
    setShowModal(false);
  };

  const handleDeleteUser = async (id: string) => {
    if (confirm("Hapus user ini? Tindakan ini tidak bisa dibatalkan.")) {
      try {
        await api.delete(`/users/${id}`);
        fetchUsers();
      } catch (error) {
        alert(`Gagal menghapus user. ${error}`);
      }
    }
  };

  const handleEdit = (user: User) => {
    setEditingId(user.id);
    setFormData({
      name: user.name,
      email: user.email,
      password: "", // Kosongkan password saat edit (opsional)
      role: user.role,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingId) {
        // UPDATE USER
        await api.put(`/users/${editingId}`, {
          name: formData.name,
          role: formData.role,
        });
        alert("User berhasil diperbarui!");
      } else {
        // CREATE USER BARU
        await api.post("/users", formData);
        alert("User baru berhasil ditambahkan!");
      }
      resetForm();
      fetchUsers();
    } catch (error) {
      alert(`Gagal menyimpan data user. ${error}`);
    } finally {
      setLoading(false);
    }
  };

  // --- DEFINISI KOLOM AG GRID ---
  const colDefs: ColDef<User>[] = [
    {
      field: "name",
      headerName: "Nama Lengkap",
      flex: 1,
    },
    { field: "email", headerName: "Email", flex: 1 },
    {
      field: "role",
      headerName: "Role",
      width: 130,
      cellRenderer: (params: ICellRendererParams) => (
        <span
          className={`px-3 my-1 rounded-full text-[10px] font-bold uppercase flex items-center gap-1 w-fit ${
            params.value === "ADMIN" ? "bg-purple-100 text-purple-700" : "bg-green-100 text-green-700"
          }`}
        >
          {params.value === "ADMIN" && <Shield size={10} />}
          {params.value}
        </span>
      ),
    },
    {
      headerName: "Aksi",
      width: 120,
      pinned: "right",
      cellRenderer: (params: ICellRendererParams) => (
        <div className="flex items-center gap-2 h-full">
          <button onClick={() => handleEdit(params.data)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors">
            <Edit size={16} />
          </button>
          <button onClick={() => handleDeleteUser(params.data.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-colors">
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2 text-blue-600">
            <Users size={28} /> Manajemen User
          </h1>
          <p className="text-sm text-gray-500">Kelola staf dan admin aplikasi.</p>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={handleRefresh} className="p-2.5 text-gray-500 bg-white border border-gray-200 rounded-lg hover:text-blue-600 transition-all shadow-sm">
            <RefreshCw size={20} className={isRefreshing ? "animate-spin" : ""} />
          </button>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium shadow-md transition-all active:scale-95"
          >
            <Plus size={20} /> Tambah User
          </button>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <AgGridTable rowData={users} colDefs={colDefs}  />
      </div>

      {/* MODAL (ADD / EDIT) */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm z-50">
          <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">{editingId ? "Edit Akses User" : "Tambah User Baru"}</h2>
              <button onClick={resetForm} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase">Nama Lengkap</label>
                <input
                  required
                  className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase">Email</label>
                <input
                  required
                  type="email"
                  disabled={!!editingId}
                  className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-50"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              {!editingId && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 uppercase">Password</label>
                  <input
                    required
                    type="password"
                    placeholder="Min. 6 karakter"
                    className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase">Role</label>
                <select
                  className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as "STAFF" | "ADMIN" })}
                >
                  <option value="STAFF">STAFF</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <button type="button" onClick={resetForm} className="flex-1 py-2.5 text-gray-500 hover:bg-gray-100 rounded-lg">
                  Batal
                </button>
                <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-lg flex justify-center gap-2">
                  {loading && <Loader2 size={18} className="animate-spin" />}
                  {editingId ? "Simpan Perubahan" : "Tambah User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
