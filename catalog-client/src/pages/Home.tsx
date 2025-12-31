import { useEffect, useState } from "react";
import { api } from "../lib/axios";
import type { Product, TrendingKeyword } from "../types";
import { Search, ShoppingBag, TrendingUp, Fish, Loader2, Tag } from "lucide-react";

export default function Home() {
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [trends, setTrends] = useState<TrendingKeyword[]>([]);
  const [loading, setLoading] = useState(false);
  const [latency, setLatency] = useState<number>(0); // Untuk pamer kecepatan

  // 1. Load Trending saat pertama buka
  useEffect(() => {
    fetchTrending();
  }, []);

  // 2. LIVE SEARCH ENGINE (Debounce 300ms)
  // Setiap kali 'query' berubah, tunggu 300ms, lalu tembak API
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      handleSearch(query);
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [query]);

  const fetchTrending = async () => {
    try {
      const res = await api.get("/products/trending");
      // Validasi data biar gak error kalau backend kosong
      setTrends(Array.isArray(res.data.data) ? res.data.data : []);
    } catch (err) {
      console.error("Gagal load trending", err);
    }
  };

  const handleSearch = async (keyword: string) => {
    setLoading(true);
    const start = performance.now(); // Mulai stopwatch

    try {
      // Jika kosong, load semua produk (atau kosongkan, sesuai selera)
      const endpoint = keyword ? `/products?q=${keyword}` : '/products'; 
      const res = await api.get(endpoint);
      
      setProducts(Array.isArray(res.data) ? res.data : (res.data.data || []));
    } catch (error) {
      console.error("Search Error:", error);
      setProducts([]);
    } finally {
      const end = performance.now();
      setLatency(Math.round(end - start)); // Stop stopwatch
      setLoading(false);
    }
  };

  // Saat Enter ditekan, kita update Trending list saja
  // (Karena pencarian produk sudah otomatis jalan via useEffect)
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      setTimeout(fetchTrending, 500); // Refresh trending tags
    }
  };

  const formatRupiah = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800">
      {/* --- HERO SECTION --- */}
      <div className="relative bg-gradient-to-br from-blue-700 to-cyan-600 pb-24 pt-16 text-white shadow-xl">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>

        <div className="container relative mx-auto px-4 text-center">
          <div className="mb-4 flex justify-center">
            <div className="rounded-full bg-white/20 p-3 backdrop-blur-sm animate-bounce-slow">
              <ShoppingBag size={48} className="text-white" />
            </div>
          </div>

          <h1 className="mb-2 text-4xl font-extrabold tracking-tight md:text-5xl">
            Gamboet Brotherhood <span className="text-yellow-300">Fishing</span>
          </h1>
          <p className="mb-8 text-lg text-blue-100 opacity-90">
            Joran, Reel, Umpan? Ketik aja, langsung muncul secepat kilat.
          </p>

          {/* SEARCH BAR */}
          <div className="mx-auto flex max-w-2xl items-center overflow-hidden rounded-full bg-white p-1.5 shadow-2xl ring-4 ring-white/20 transition-all focus-within:ring-yellow-400/50">
            <div className="pl-4 text-gray-400">
              {loading ? <Loader2 size={20} className="animate-spin text-blue-500"/> : <Search size={20} />}
            </div>
            <input
              type="search" 
              className="w-full bg-transparent px-4 py-3 text-gray-700 placeholder-gray-400 focus:outline-none"
              placeholder="Cari: 'Joran Shimano', 'Umpan Gabus'..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onKeyDown}
              autoComplete="off"
              autoFocus
            />
            {/* Tombol Search Manual (Opsional, karena sudah otomatis) */}
            <button
              onClick={() => handleSearch(query)}
              className="rounded-full bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-3 font-bold text-white shadow-lg transition hover:from-blue-700 hover:to-blue-600 active:scale-95 hidden sm:block"
            >
              Cari
            </button>
          </div>
            
          {/* Info Latency (Flexing Speed) */}
          {query && !loading && (
             <p className="mt-4 text-xs text-blue-200 font-mono opacity-80">
               ⚡ {products.length} hasil ditemukan dalam {latency}ms
             </p>
          )}

          {/* Trending Tags */}
          {trends.length > 0 && (
            <div className="mt-8">
              <p className="mb-3 flex items-center justify-center gap-2 text-sm font-semibold text-blue-200 uppercase tracking-wider">
                <TrendingUp size={16} /> Paling Banyak Dicari
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {trends.map((t, idx) => (
                  <button
                    key={idx}
                    onClick={() => setQuery(t.key)} // Klik tag langsung set query -> trigger useEffect
                    className="group flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm font-medium text-white backdrop-blur-md transition hover:bg-white hover:text-blue-600 active:scale-95"
                  >
                    <span>{t.key}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* --- PRODUCT GRID --- */}
      <div className="container mx-auto -mt-16 px-4 pb-20 relative z-10">
        {loading && products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl shadow-lg min-h-[400px]">
            <Loader2 size={48} className="animate-spin text-blue-500 mb-4" />
            <p className="text-gray-500 animate-pulse">Sedang menyelam mencari barang...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="group flex flex-col rounded-2xl border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-blue-200 cursor-pointer"
                >
                  <div className="flex flex-1 flex-col p-6">
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <span className="inline-block rounded-full bg-blue-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-blue-600">
                        {product.category}
                      </span>
                      <span className="inline-block rounded-full bg-gray-50 px-2 py-1 text-[10px] text-gray-500 font-mono">
                        {product.sku}
                      </span>
                    </div>

                    <h3 className="mb-2 text-lg font-bold text-gray-800 transition-colors group-hover:text-blue-600 line-clamp-2">
                      {product.name}
                    </h3>

                    <p className="mb-4 text-sm leading-relaxed text-gray-500 line-clamp-3">
                      {product.description}
                    </p>

                    {/* Tags List */}
                    {product.tags && (
                      <div className="mt-auto mb-3 flex flex-wrap gap-1.5">
                        {product.tags.split(",").slice(0, 3).map((tag, idx) => (
                          <span key={idx} className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                            <Tag size={10} className="mr-1" /> {tag.trim()}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50/50 px-6 py-4 rounded-b-2xl">
                    <div>
                      <p className="text-xs font-medium text-gray-400">Harga</p>
                      <span className="text-lg font-bold text-gray-900">
                        {formatRupiah(product.price)}
                      </span>
                    </div>
                    {/* Indikator Stok Sederhana */}
                    <div className="text-right">
                       <span className="text-xs text-green-600 font-semibold bg-green-50 px-2 py-1 rounded-md">
                         Ready Stock
                       </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Empty State */}
            {products.length === 0 && !loading && (
              <div className="mx-auto max-w-lg rounded-3xl bg-white p-10 text-center shadow-lg animate-fade-in-up">
                <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-blue-50">
                  <Fish size={48} className="text-blue-300" />
                </div>
                <h3 className="mb-2 text-2xl font-bold text-gray-800">
                  {query ? "Ikan tidak menyambar..." : "Mulai Pencarian"}
                </h3>
                <p className="mb-8 text-gray-500">
                  {query 
                    ? `Tidak ada hasil untuk "${query}". Coba kata kunci lain.` 
                    : "Ketik nama barang di atas untuk melihat magisnya Elastic."}
                </p>
                {query && (
                  <button
                    onClick={() => {
                      setQuery("");
                      // handleSearch(""); // useEffect akan handle ini
                    }}
                    className="rounded-full bg-blue-600 px-8 py-3 font-bold text-white transition hover:bg-blue-700"
                  >
                    Reset Pencarian
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}