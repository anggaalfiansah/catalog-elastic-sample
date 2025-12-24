import { useEffect, useState } from "react";
import { api } from "../../lib/axios";
import type { Product } from "../../types";
import { Plus, Trash2, Edit, Loader2, Tag, RefreshCw, Package } from "lucide-react"; // Added RefreshCw & Package

// Import AG Grid Community Types
import type { ColDef, ICellRendererParams } from "ag-grid-community";
// Import Komponen Custom Table Anda
import AgGridTable from "../../components/AgGridTable";

export default function ProductList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false); // State khusus untuk animasi refresh
  const [editingId, setEditingId] = useState<number | null>(null);

  // --- STATE FORM ---
  const initialForm = {
    sku: "",
    name: "",
    category: "Joran",
    price: 0,
    description: "",
    tags: "",
  };
  const [formData, setFormData] = useState(initialForm);

  // --- FETCH DATA ---
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await api.get("/products?q=");
      setProducts(res.data.data);
    } catch (error) {
      console.error(error);
    }
  };

  // Wrapper untuk tombol refresh dengan animasi
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchProducts();
    // Kasih delay dikit biar kelihatan muter kalau koneksi terlalu cepat
    setTimeout(() => setIsRefreshing(false), 500);
  };

  // --- HANDLERS (DELETE, EDIT, RESET, SUBMIT) ---
  const handleDelete = async (id: number) => {
    if (!confirm("Yakin mau hapus produk ini?")) return;
    try {
      await api.delete(`/products/${id}`);
      fetchProducts();
    } catch (error) {
      alert(`Gagal hapus produk dengan ID ${id}. ${error}`);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingId(product.id);
    setFormData({
      sku: product.sku || "",
      name: product.name,
      category: product.category,
      price: product.price,
      description: product.description || "",
      tags: product.tags || "",
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData(initialForm);
    setEditingId(null);
    setShowModal(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingId) {
        await api.put(`/products/${editingId}`, formData);
        alert("Produk berhasil diperbarui!");
      } else {
        await api.post("/products", formData);
        alert("Produk berhasil dibuat!");
      }
      resetForm();
      fetchProducts();
    } catch (error) {
      alert("Gagal menyimpan produk.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // --- DEFINISI KOLOM AG GRID ---
  const colDefs: ColDef<Product>[] = [
    {
      field: "sku",
      headerName: "SKU",
      width: 120,
      valueFormatter: (params) => params.value || "-",
      cellStyle: { fontFamily: "monospace", color: "#4B5563" },
    },
    {
      field: "name",
      headerName: "Nama Produk",
      flex: 2,
      minWidth: 200,
      filter: true,
      cellStyle: { fontWeight: 500, color: "#111827" },
    },
    {
      field: "category",
      headerName: "Kategori",
      width: 130,
      filter: true,
      cellRenderer: (params: ICellRendererParams) => <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">{params.value}</span>,
    },
    {
      field: "tags",
      headerName: "Tags",
      flex: 1,
      cellRenderer: (params: ICellRendererParams) => {
        if (!params.value) return <span className="text-gray-400 italic">-</span>;
        return (
          <div className="flex gap-1 items-center h-full">
            <Tag size={12} className="text-gray-400" />
            <span className="text-xs text-gray-600 truncate">{params.value.split(",").slice(0, 2).join(", ")}</span>
          </div>
        );
      },
    },
    {
      field: "price",
      headerName: "Harga",
      width: 150,
      cellStyle: { fontWeight: "bold", color: "#059669" }, // Green color for money
      valueFormatter: (params) => `Rp ${Number(params.value).toLocaleString("id-ID")}`,
    },
    {
      headerName: "Aksi",
      width: 100,
      pinned: "right",
      sortable: false,
      filter: false,
      cellRenderer: (params: ICellRendererParams) => (
        <div className="flex items-center gap-2 h-full">
          <button onClick={() => handleEdit(params.data)} className="p-1.5 rounded-md text-blue-600 hover:bg-blue-50 hover:scale-110 transition-all" title="Edit">
            <Edit size={16} />
          </button>
          <button onClick={() => handleDelete(params.data.id)} className="p-1.5 rounded-md text-red-600 hover:bg-red-50 hover:scale-110 transition-all" title="Hapus">
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6 bg-gray-50">
      {/* --- HEADER SECTION YANG DIPERBAGUS --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Package className="text-blue-600" /> Manajemen Produk
          </h1>
          <p className="text-sm text-gray-500 mt-1">Kelola inventaris toko pancing Anda di sini.</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Tombol Refresh */}
          <button
            onClick={handleRefresh}
            className="flex items-center justify-center p-2.5 text-gray-500 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm active:scale-95"
            title="Refresh Data"
          >
            <RefreshCw size={20} className={isRefreshing ? "animate-spin text-blue-600" : ""} />
          </button>

          {/* Tombol Tambah */}
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium shadow-md shadow-blue-600/20 transition-all active:scale-95"
          >
            <Plus size={20} />
            <span>Tambah Produk</span>
          </button>
        </div>
      </div>

      {/* --- AG GRID TABLE --- */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        {/* Wrapper div untuk memberikan padding jika perlu atau styling container grid */}
        <AgGridTable rowData={products} colDefs={colDefs} />
      </div>

      {/* MODAL (TIDAK BERUBAH) */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm z-50">
          <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-2xl animate-in fade-in zoom-in duration-200 border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">{editingId ? "Edit Produk" : "Tambah Produk Baru"}</h2>
              <div className="px-3 py-1 bg-blue-50 text-blue-600 text-xs font-bold uppercase rounded-full">{editingId ? "Mode Edit" : "Mode Create"}</div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-500 uppercase">SKU</label>
                  <input
                    required
                    placeholder="Contoh: JOR-001"
                    className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all disabled:bg-gray-100 disabled:text-gray-400"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    disabled={!!editingId}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-500 uppercase">Kategori</label>
                  <select
                    className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    <option>Joran</option>
                    <option>Reel</option>
                    <option>Umpan</option>
                    <option>Aksesoris</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-500 uppercase">Nama Produk</label>
                <input
                  required
                  placeholder="Nama lengkap produk..."
                  className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-500 uppercase">Harga (Rp)</label>
                <input
                  required
                  type="number"
                  placeholder="0"
                  className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-mono"
                  value={formData.price || ""}
                  onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-500 uppercase">Deskripsi</label>
                <textarea
                  placeholder="Jelaskan detail produk..."
                  className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all min-h-[80px]"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="space-y-1 relative">
                <label className="text-xs font-medium text-gray-500 uppercase flex items-center gap-1">
                  <Tag size={12} /> Tags
                </label>
                <input
                  placeholder="murah, laut, promo (pisahkan dengan koma)"
                  className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={resetForm} className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors font-medium">
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all flex items-center gap-2 font-medium shadow-lg shadow-blue-600/20 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loading && <Loader2 size={18} className="animate-spin" />}
                  {editingId ? "Simpan Perubahan" : "Buat Produk"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
