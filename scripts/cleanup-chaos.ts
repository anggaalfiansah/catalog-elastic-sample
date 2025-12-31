import { prisma } from "../catalog-server/config/prisma";
import * as dotenv from "dotenv";

dotenv.config();

async function cleanupChaos() {
  console.log("🧹 Memulai PEMBERSIHAN DATA SAMPAH...");

  // Hapus semua yang SKU-nya mengandung kata 'CHAOS'
  // Debezium akan menangkap event 'DELETE' ini dan mengirimnya ke Kafka
  const result = await prisma.product.deleteMany({
    where: {
      sku: {
        contains: 'CHAOS'
      }
    }
  });

  console.log(`🗑️  Berhasil menghapus ${result.count} data sampah dari Postgres.`);
  console.log("👉 Perhatikan terminal Backend: Harusnya muncul log Delete dari Elastic.");
}

cleanupChaos();