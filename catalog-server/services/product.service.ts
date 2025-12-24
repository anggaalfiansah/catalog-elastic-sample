import { prisma } from "../config/prisma";
import { esClient } from "../config/elastic";

const ES_INDEX = "products";
const ES_LOGS = "search_logs";

export const ProductService = {
  // 1. CREATE (Wajib Masukkan SKU di sini untuk Analitik)
  create: async (data: any) => {
    // Simpan ke DB
    const product = await prisma.product.create({
      data: {
        sku: data.sku, // <--- PENTING: SKU Disimpan ke DB
        name: data.name,
        description: data.description,
        category: data.category,
        price: Number(data.price),
        tags: data.tags,
        createdById: data.userId,
      },
    });

    // Simpan ke Elastic (Sync)
    try {
      await esClient.index({
        index: ES_INDEX,
        id: product.id.toString(),
        document: {
          id: product.id,
          sku: product.sku, // <--- PENTING: SKU Masuk ke Elastic (Buat Analitik nanti)
          name: product.name,
          description: product.description,
          category: product.category,
          price: product.price,
          tags: product.tags,
          isActive: true,
        },
      });
    } catch (e) {
      console.error("Elastic Sync Fail", e);
    }

    return product;
  },

  // 2. SEARCH (Bisa cari berdasarkan SKU)
  search: async (query: string) => {
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
                    // SKU diprioritaskan (boost ^5) agar kalau user ketik SKU, produk langsung muncul paling atas
                    fields: ["sku^5", "name^3", "tags", "description",],
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

    // Log Pencarian untuk Analitik "Kata Kunci Terpopuler"
    if (query) {
      // @ts-ignore
      const count = result.hits.total?.value || result.hits.total;
      void logSearch(query, count);
    }

    return hits;
  },

  // 3. UPDATE (Edit data selain SKU)
  update: async (id: number, data: any) => {
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

    // Update Elastic Partial
    try {
      await esClient.update({
        index: ES_INDEX,
        id: id.toString(),
        doc: {
          sku: updated.sku,
          name: updated.name,
          price: updated.price,
          description: updated.description,
          tags: updated.tags,
        },
      });
    } catch (e) {
      console.error("Elastic Update Fail", e);
    }

    return updated;
  },

  // ... (Sisa kode softDelete & getTrending sama) ...
  softDelete: async (id: number, userId: string) => {
    await prisma.product.update({
      where: { id },
      data: { isActive: false, updatedById: userId },
    });
    try {
      await esClient.update({
        index: ES_INDEX,
        id: id.toString(),
        doc: { isActive: false },
      });
    } catch (e) {}
  },

  getTrending: async () => {
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
    } catch (error: any) {
      if (error.meta && error.meta.body && error.meta.body.error.type === "index_not_found_exception") {
        return [];
      }
      return [];
    }
  },
};

async function logSearch(keyword: string, count: number) {
  try {
    await esClient.index({
      index: ES_LOGS,
      document: { keyword: keyword.toLowerCase(), resultCount: count, timestamp: new Date() },
    });
  } catch (e) {}
}
