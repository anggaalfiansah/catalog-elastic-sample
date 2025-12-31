import { useEffect, useState } from "react";
import { api } from "../../lib/axios";
import { Plus, Trash2, Edit, RefreshCw, Package, Search, Tag } from "lucide-react";

// Types dari AG Grid
import type { ColDef, ICellRendererParams, IDatasource, IGetRowsParams, GridReadyEvent, GridApi } from "ag-grid-community";

// Komponen Table Wrapper Anda
import AgGridTable from "../../components/AgGridTable";
import type { Product } from "../../types";

export default function ProductList() {
  // Kita TIDAK butuh state 'products' lagi, karena data disimpan internal oleh AG Grid
  const [gridApi, setGridApi] = useState<GridApi | null>(null);

  // State UI standar
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // State Form (Tidak berubah)
  const initialForm = {
    sku: "",
    name: "",
    category: "Joran",
    price: 0,
    description: "",
    tags: "",
  };
  const [formData, setFormData] = useState(initialForm);

  const [searchText, setSearchText] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Logic A: Tunggu 2 detik setelah berhenti mengetik
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchText);
    }, 2000); // <--- Ubah jadi 2000ms (2 Detik)

    return () => clearTimeout(handler);
  }, [searchText]);

  // Logic B: Kalau tekan Enter, langsung cari saat itu juga (Bypass Timer)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      setDebouncedSearch(searchText); // Trigger langsung
    }
  };
  // --- 2. DATASOURCE ---
  const createDataSource = (query: string): IDatasource => {
    return {
      getRows: async (params: IGetRowsParams) => {
        const pageSize = 10;
        const page = Math.floor(params.startRow / pageSize) + 1;

        try {
          const res = await api.get(`/products?q=${query}&page=${page}&limit=${pageSize}`);
          const rowData = Array.isArray(res.data.data) ? res.data.data : [];
          const totalRecords = typeof res.data.meta?.total === "number" ? res.data.meta.total : 0;

          if (rowData.length === 0) {
            params.successCallback([], 0);
          } else {
            params.successCallback(rowData, totalRecords);
          }
        } catch (error) {
          console.error("Error fetching data", error);
          params.failCallback();
        }
      },
    };
  };

  // --- 3. TRIGGER UPDATE GRID ---
  useEffect(() => {
    if (gridApi) {
      const dataSource = createDataSource(debouncedSearch);
      gridApi.setGridOption("datasource", dataSource);
    }
  }, [debouncedSearch, gridApi]);

  // Handler saat Tabel Siap
  const onGridReady = (params: GridReadyEvent) => {
    setGridApi(params.api);
    // Set datasource pertama kali
    params.api.setGridOption("datasource", createDataSource(""));
  };

  // Handler Refresh Manual
  const handleRefresh = () => {
    if (gridApi) {
      // Paksa AG Grid buang cache dan load ulang (tanpa ganti filter)
      gridApi.refreshInfiniteCache();
    }
  };

  // --- HANDLERS CRUD (Delete & Save) ---
  const handleDelete = async (id: number) => {
    if (!confirm("Yakin hapus?")) return;
    try {
      await api.delete(`/products/${id}`);
      handleRefresh(); // Refresh tabel setelah hapus
    } catch (e) {
      alert(`Gagal hapus produk dengan ID ${id} : ${e}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/products/${editingId}`, formData);
        alert("Updated!");
      } else {
        await api.post("/products", formData);
        alert("Created!");
      }
      resetForm();
      handleRefresh(); // Refresh tabel setelah simpan
    } catch (e) {
      console.error(e);
      alert("Gagal simpan");
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
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Package className="text-blue-600" /> Manajemen Produk
          </h1>
          <p className="text-sm text-gray-500 mt-1">Mode: Infinite Server-Side Pagination</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative group w-full sm:w-64">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search size={16} className="text-gray-400 group-focus-within:text-blue-500" />
            </div>
            {/* INPUT SEARCH */}
            <input
              type="text"
              className="block w-full p-2.5 pl-10 text-sm text-gray-900 border border-gray-200 rounded-lg bg-gray-50 focus:ring-blue-500 outline-none"
              placeholder="Cari (Enter / 2s)..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onKeyDown={handleKeyDown} // <--- Event Enter dipasang disini
            />
          </div>

          <button onClick={handleRefresh} className="p-2.5 text-gray-500 bg-white border border-gray-200 rounded-lg hover:text-blue-600 transition shadow-sm">
            <RefreshCw size={20} />
          </button>

          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium shadow-md active:scale-95"
          >
            <Plus size={20} /> <span>Baru</span>
          </button>
        </div>
      </div>

      {/* TABLE WRAPPER */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        {/* Pastikan AgGridTable Anda mendukung props tambahan ini.
            Jika tidak, passing props ini langsung ke komponen <AgGridReact> di dalamnya 
        */}
        <AgGridTable
          // 1. Matikan data row manual
          rowData={null}
          colDefs={colDefs}
          // 2. Aktifkan Mode Infinite
          rowModelType="infinite"
          // 3. Konfigurasi Pagination
          pagination={true}
          paginationPageSize={10} // Harus match dengan pageSize di createDataSource
          cacheBlockSize={10} // Berapa baris ditarik sekali request
          paginationPageSizeSelector={[10, 20, 50, 100]}
          // 4. Hook agar kita bisa kontrol
          onGridReady={onGridReady}
        />
      </div>

      {/* MODAL FORM (Sama seperti sebelumnya, dipersingkat di sini) */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm z-50">
          <div className="bg-white p-8 rounded-2xl w-full max-w-lg shadow-2xl">
            <h2 className="text-xl font-bold mb-4">{editingId ? "Edit" : "Baru"}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input placeholder="SKU" className="w-full border p-2 rounded" value={formData.sku} onChange={(e) => setFormData({ ...formData, sku: e.target.value })} />
              <input placeholder="Nama" className="w-full border p-2 rounded" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
              <input type="number" placeholder="Harga" className="w-full border p-2 rounded" value={formData.price} onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })} />
              <div className="flex justify-end gap-2 mt-4">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-600">
                  Batal
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
