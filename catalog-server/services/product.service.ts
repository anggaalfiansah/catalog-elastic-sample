import { prisma } from "../config/prisma";
import { esClient } from "../config/elastic";

const ES_INDEX = "products";
const ES_LOGS = "search_logs";

export const ProductService = {
  // ============================================================
  // WRITE PATH (Hanya ke Database SQL)
  // Debezium akan menyalin data ini ke Elastic secara otomatis
  // ============================================================

  // 1. CREATE
  create: async (data: any) => {
    // CUKUP INI SAJA.
    // Tidak perlu lagi coding esClient.index() di sini.
    const product = await prisma.product.create({
      data: {
        sku: data.sku,
        name: data.name,
        description: data.description,
        category: data.category,
        price: Number(data.price),
        tags: data.tags,
        createdById: data.userId,
      },
    });

    return product;
  },

  // 2. UPDATE
  update: async (id: number, data: any) => {
    // CUKUP INI SAJA.
    const updated = await prisma.product.update({
      where: { id },
      data: {
        sku: data.sku,
        name: data.name,
        price: data.price,
        description: data.description,
        tags: data.tags,
        updatedById: data.userId,
      },
    });

    return updated;
  },

  // 3. SOFT DELETE
  softDelete: async (id: number, userId: string) => {
    // CUKUP INI SAJA.
    // Saat status berubah jadi false di DB, Debezium akan update document di Elastic.
    await prisma.product.update({
      where: { id },
      data: { isActive: false, updatedById: userId },
    });
  },

  // ============================================================
  // READ PATH (Baca dari Elastic)
  // Bagian ini TIDAK BERUBAH karena kita tetap cari ke Elastic
  // ============================================================

  // 4. SEARCH
  search: async (query: string, page: number = 1, limit: number = 12) => {
    // Hitung Offset (Start index)
    // Page 1 -> from 0
    // Page 2 -> from 12
    const from = (page - 1) * limit;

    const result = await esClient.search({
      index: ES_INDEX,
      from: from, // <--- Offset
      size: limit, // <--- Limit per halaman (misal 12)
      track_total_hits: true, // Wajib true agar tahu total asli (misal 807)
      query: {
        bool: {
          must: query
            ? [
                {
                  multi_match: {
                    query: query,
                    fields: ["sku^5", "name^3", "tags", "description"],
                    fuzziness: "AUTO",
                  },
                },
                { match: { isActive: true } },
              ]
            : [{ match_all: {} }, { match: { isActive: true } }],
        },
      },
    });

    // @ts-ignore
    const hits = result.hits.hits.map((h) => h._source);
    // @ts-ignore
    const total = result.hits.total?.value || result.hits.total;

    // Log pencarian (Fire-and-forget)
    if (query && page === 1) {
      // Log cuma pas halaman 1 aja biar gak spam
      void logSearch(query, total);
    }

    // Return format Pagination
    return {
      data: hits,
      meta: {
        page: Number(page),
        limit: Number(limit),
        total: total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  // 5. TRENDING
  getTrending: async () => {
    // ... (Kode tetap sama) ...
    try {
      const res = await esClient.search({
        index: ES_LOGS,
        size: 0,
        aggs: {
          top_keywords: {
            terms: { field: "keyword.keyword", size: 5 },
          },
        },
      });
      // @ts-ignore
      return res.aggregations.top_keywords.buckets;
    } catch (error) {
      return [];
    }
  },

  getStats: async () => {
    // 1. Hitung Total User (Dari Postgres - Source of Truth akun)
    const totalUsers = await prisma.user.count();

    // 2. Hitung Statistik Produk (Dari Elastic - Aggregations)
    // Kita pakai size: 0 karena kita GAK BUTUH datanya, cuma butuh angkanya.
    const esResult = await esClient.search({
      index: "products",
      size: 0,
      track_total_hits: true, // Biar akurat hitung ribuan data
      aggs: {
        // A. Hitung per Kategori
        categories: {
          terms: {
            field: "category.keyword", // Pastikan field ini keyword di mapping
            size: 10, // Top 10 kategori
          },
        },
        // B. Hitung Rata-rata Harga (Iseng aja, buat info tambahan)
        avg_price: {
          avg: { field: "price" },
        },
      },
    });

    // 3. Ambil Trending Keywords (Dari Index Logs)
    const esTrends = await esClient.search({
      index: "search_logs",
      size: 0,
      aggs: {
        top_searches: {
          terms: { field: "keyword.keyword", size: 5 },
        },
        total_searches: {
          value_count: { field: "keyword.keyword" }, // Total semua pencarian
        },
      },
    });

    // FORMAT DATA UNTUK FRONTEND
    // @ts-ignore
    const totalProducts = esResult.hits.total.value;
    // @ts-ignore
    const categoryBuckets = esResult.aggregations.categories.buckets;
    // @ts-ignore
    const trendBuckets = esTrends.aggregations.top_searches.buckets;
    // @ts-ignore
    const totalSearches = esTrends.hits.total.value; // Total dokumen log

    return {
      counts: {
        products: totalProducts,
        users: totalUsers,
        searches: totalSearches,
      },
      charts: {
        categories: categoryBuckets.map((b: any) => ({ name: b.key, value: b.doc_count })),
        trending: trendBuckets.map((b: any) => ({ name: b.key, count: b.doc_count })),
      },
    };
  },
};

// ... function logSearch tetap sama ...
async function logSearch(keyword: string, count: number) {
  try {
    // Kita biarkan ini direct ke Elastic karena ini cuma log (bukan data master).
    // Kalau mau pakai Debezium juga, Anda harus bikin tabel `search_history` di DB Postgres dulu.
    await esClient.index({
      index: ES_LOGS,
      document: { keyword: keyword.toLowerCase(), resultCount: count, timestamp: new Date() },
    });
  } catch (e) {}
}
