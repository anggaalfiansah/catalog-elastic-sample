import { prisma } from "../catalog-server/config/prisma";
import * as dotenv from "dotenv";

dotenv.config();

// KONFIGURASI
const CONCURRENCY_LIMIT = 100; 
const SUFFIX_TO_REMOVE = " PANCING.IO";

async function bulkRestoreParallel() {
  console.log(`♻️  Memulai RESTORE & ADJUSTMENT (Parallel: ${CONCURRENCY_LIMIT})...`);
  console.log(`📈 Target: Harga Naik 0.5% & Hapus '${SUFFIX_TO_REMOVE}'`);

  // 1. Ambil data
  const products = await prisma.product.findMany({
    select: { id: true, name: true, price: true },
    where: { isActive: true }
  });

  const total = products.length;
  console.log(`📦 Ditemukan ${total} produk. Cleaning up...`);

  let processed = 0;
  const startTime = performance.now();

  // 2. Loop Chunking
  for (let i = 0; i < total; i += CONCURRENCY_LIMIT) {
    const chunk = products.slice(i, i + CONCURRENCY_LIMIT);

    const updatePromises = chunk.map(async (product) => {
      
      // LOGIKA HARGA: Naik 0.5%
      const newPrice = Math.floor(product.price * 1.005);
      
      // LOGIKA NAMA: Hapus Suffix
      let newName = product.name;
      if (newName.endsWith(SUFFIX_TO_REMOVE)) {
        // Potong string dari belakang
        newName = newName.slice(0, -SUFFIX_TO_REMOVE.length);
      }

      try {
        await prisma.product.update({
          where: { id: product.id },
          data: {
            price: newPrice,
            name: newName,
          },
        });
      } catch (err) {
        console.error(`❌ Gagal ID ${product.id}:`, err);
      }
    });

    // Eksekusi Parallel
    await Promise.all(updatePromises);

    processed += chunk.length;
    process.stdout.write(`\r🧹 Progress: ${processed}/${total} products restored...`);
  }

  const endTime = performance.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);

  console.log(`\n\n✨ SELESAI! Nama sudah bersih kembali.`);
  console.log(`⏱️  Waktu Eksekusi: ${duration} detik`);
}

// Jalankan
bulkRestoreParallel();