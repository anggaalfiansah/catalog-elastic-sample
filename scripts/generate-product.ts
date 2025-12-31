import { esClient } from "../catalog-server/config/elastic";
import { prisma } from "../catalog-server/config/prisma";
import * as dotenv from "dotenv"; // Tambahkan ini

dotenv.config(); // Load file .env

const ES_INDEX = "products";

const categories = ["Joran", "Reel", "Umpan", "Aksesoris", "Senar", "Pakaian"];
const brands = ["Shimano", "Daiwa", "Abu Garcia", "Maguro", "Relix Nusantara", "Ryobi", "Penn"];
const materials = ["Carbon", "Graphite", "Composite", "Nylon", "Stainlees Steel"];

async function generateBulkProducts(count: number) {
  console.log(`🎣 Memulai generate ${count} produk...`);

  // Ambil Admin ID pertama untuk createdById
  const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
  if (!admin) {
    console.error("❌ Error: Buat user ADMIN dulu lewat seed!");
    return;
  }

  for (let i = 1; i <= count; i++) {
    const category = categories[Math.floor(Math.random() * categories.length)];
    const brand = brands[Math.floor(Math.random() * brands.length)];
    const material = materials[Math.floor(Math.random() * materials.length)];

    // Buat data produk unik
    const sku = `${category.substring(0, 3).toUpperCase()}-${brand.substring(0, 2).toUpperCase()}-${1000 + i}-X`;
    const name = `${category} ${brand} Series ${i * 7}`;
    const price = Math.floor(Math.random() * (2000000 - 50000 + 1) + 50000); // Range 50rb - 2jt
    const tags = `${category.toLowerCase()}, ${brand.toLowerCase()}, ${material.toLowerCase()}`;

    try {
      await prisma.product.create({
        data: {
          sku,
          name,
          description: `Produk ${category} kualitas tinggi dari ${brand} berbahan ${material}. Cocok untuk pemancing profesional.`,
          category,
          price,
          tags,
          createdById: admin.id,
          isActive: true,
        },
      });

      if (i % 50 === 0) console.log(`✅ ${i} produk berhasil dibuat...`);
    } catch (err) {
      console.error(`❌ Gagal pada produk ke-${i}:`, err);
    }
  }

  await esClient.indices.refresh({ index: ES_INDEX });
  console.log(`\n✨ SELESAI! ${count} produk telah siap di katalog.`);
}

// Jalankan untuk 200 produk (bisa Anda ubah angkanya)
generateBulkProducts(200);
