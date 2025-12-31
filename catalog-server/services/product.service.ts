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
  search: async (query: string) => {
    // ... (Kode pencarian tetap sama persis) ...
    const result = await esClient.search({
      index: ES_INDEX,
      size: 500,
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

    // Logging tetap manual (Fire-and-forget)
    if (query) {
      // @ts-ignore
      const count = result.hits.total?.value || result.hits.total;
      void logSearch(query, count);
    }

    return hits;
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