import { PasswordUtil } from "../utils/password.util"; // Pastikan path import benar
import { esClient } from "../config/elastic";
import { prisma } from "../config/prisma";

const ES_INDEX = "products";

async function main() {
  console.log("🎣 Memulai Seeding Toko Pancing...");

  // ====================================================
  // 1. BERSIH-BERSIH (DATABASE & ELASTIC)
  // ====================================================

  // A. Reset Postgres
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();
  console.log("✅ Postgres Cleared.");

  // B. Reset Elasticsearch (DROP INDEX TOTAL)
  // Hapus index lama biar mapping-nya fresh (termasuk nambah field SKU baru)
  try {
    const indexExists = await esClient.indices.exists({ index: ES_INDEX });
    if (indexExists) {
      await esClient.indices.delete({ index: ES_INDEX });
      console.log("🗑️  Elastic Index Dropped (Bersih Total).");
    }
  } catch (e) {
    console.log("⚠️  Elastic belum ada atau gagal hapus (Aman, lanjut aja).");
  }

  // ====================================================
  // 2. CREATE ADMIN
  // ====================================================
  const hashedPassword = await PasswordUtil.hash("admin123");
  const admin = await prisma.user.create({
    data: {
      email: "bos@pancing.io",
      name: "Juragan Empang",
      password: hashedPassword,
      role: "ADMIN",
    },
  });
  console.log(`👤 Admin Created: ${admin.name}`);

  // ====================================================
  // 3. INPUT DATA (DATA DUMMY BANYAK)
  // ====================================================
  const fishingGears = [
    // --- KATEGORI: JORAN (RODS) ---
    {
      sku: "JOR-BC-001",
      name: "Joran Baitcasting Shimano Bass One XT",
      description: "Joran ringan berbahan karbon, sangat responsif untuk casting ikan gabus dan toman.",
      category: "Joran",
      price: 1250000,
      stock: 5,
      tags: "casting, sungai, gabus, shimano, mahal",
    },
    {
      sku: "JOR-SP-002",
      name: "Joran Spinning Relix Nusantara Cangkek",
      description: "Joran Ultralight (UL) kebanggaan lokal, lentur dan kuat untuk sensasi mancing wader.",
      category: "Joran",
      price: 550000,
      stock: 15,
      tags: "ultralight, sungai, wader, lokal, murah",
    },
    {
      sku: "JOR-LA-003",
      name: "Joran Jigging Maguro Barracuda",
      description: "Joran sambung dua khusus laut dalam, tahan tarikan monster GT.",
      category: "Joran",
      price: 850000,
      stock: 8,
      tags: "laut, jigging, monster, kuat",
    },
    {
      sku: "JOR-TG-004",
      name: "Joran Tegek Oregon Batik 450",
      description: "Joran tegek ruas panjang, motif batik elegan, cocok untuk nila dan mujair.",
      category: "Joran",
      price: 120000,
      stock: 50,
      tags: "tegek, danau, nila, murah, pemula",
    },
    {
      sku: "JOR-SR-005",
      name: "Joran Surf Casting Daido Manta",
      description: "Joran panjang 3.9m untuk lemparan jauh di pinggir pantai (pasiran).",
      category: "Joran",
      price: 450000,
      stock: 10,
      tags: "pantai, surf, laut, jauh",
    },

    // --- KATEGORI: REEL ---
    {
      sku: "REL-SP-2000",
      name: "Reel Spinning Daiwa RX 2000",
      description: "Reel sejuta umat, putaran halus dengan durability tinggi untuk harian.",
      category: "Reel",
      price: 450000,
      stock: 20,
      tags: "pemula, kolam, murah, daiwa",
    },
    {
      sku: "REL-BC-002",
      name: "Reel BC Abu Garcia Black Max",
      description: "Reel baitcasting low profile, braking system magnetik, anti back-lash.",
      category: "Reel",
      price: 950000,
      stock: 7,
      tags: "casting, gabus, sungai, canggih",
    },
    {
      sku: "REL-SW-6000",
      name: "Reel Penn Battle III 6000",
      description: "Reel badak spesialis air asin (Saltwater), full metal body.",
      category: "Reel",
      price: 1800000,
      stock: 4,
      tags: "laut, jigging, monster, kuat, mahal",
    },
    {
      sku: "REL-UL-800",
      name: "Reel Ryobi Ultra Power 800",
      description: "Reel mungil ukuran 800, cocok dipasangkan dengan joran ultralight.",
      category: "Reel",
      price: 350000,
      stock: 12,
      tags: "ultralight, kecil, sungai",
    },

    // --- KATEGORI: UMPAN (LURES) ---
    {
      sku: "UMP-SF-01",
      name: "Umpan Soft Frog Anti Sangkut",
      description: "Umpan tiruan karet bentuk katak, double hook, spesialis rawa tertutup.",
      category: "Umpan",
      price: 35000,
      stock: 100,
      tags: "casting, murah, gabus, rawa",
    },
    {
      sku: "UMP-MN-02",
      name: "Minnow Sinking 10cm",
      description: "Umpan ikan-ikanan lidah panjang, menyelam saat ditarik, untuk hampala.",
      category: "Umpan",
      price: 45000,
      stock: 50,
      tags: "casting, sungai, hampala, arus",
    },
    {
      sku: "UMP-JG-03",
      name: "Metal Jig 40g GID (Glow in Dark)",
      description: "Umpan timah berat untuk teknik vertical jigging malam hari.",
      category: "Umpan",
      price: 55000,
      stock: 60,
      tags: "laut, jigging, malam, dalam",
    },
    {
      sku: "UMP-SP-04",
      name: "Spoon Lure 15g Gold",
      description: "Umpan sendok besi klasik, kilauan menggoda predator.",
      category: "Umpan",
      price: 25000,
      stock: 80,
      tags: "klasik, murah, sungai",
    },

    // --- KATEGORI: SENAR (LINE) ---
    {
      sku: "SNR-PE-1",
      name: "Senar PE 1.0 Duraking Natuna",
      description: "Senar braided X8 (8 lilitan), sangat kuat, diameter tipis, warna multicolor.",
      category: "Aksesoris",
      price: 120000,
      stock: 30,
      tags: "senar, pe, kuat, laut, casting",
    },
    {
      sku: "SNR-NL-02",
      name: "Senar Nylon Waterline Clear",
      description: "Senar monofilament transparan, tidak terlihat ikan, cocok untuk kolam.",
      category: "Aksesoris",
      price: 15000,
      stock: 200,
      tags: "senar, murah, kolam, transparan",
    },

    // --- KATEGORI: AKSESORIS LAIN ---
    {
      sku: "ACC-BOX-01",
      name: "Kotak Pancing VS-3010",
      description: "Kotak penyimpan lure sekat bisa diatur, bahan plastik tebal.",
      category: "Aksesoris",
      price: 65000,
      stock: 25,
      tags: "kotak, rapi, lure",
    },
    {
      sku: "ACC-LIP-02",
      name: "Lip Grip Timbangan 15kg",
      description: "Alat penjepit mulut ikan sekaligus timbangan digital.",
      category: "Aksesoris",
      price: 125000,
      stock: 10,
      tags: "alat, rilis, timbangan",
    },
    {
      sku: "ACC-HK-05",
      name: "Kail Chinu No. 5 Carbon",
      description: "Kail tajam bahan karbon, isi 15 pcs per bungkus.",
      category: "Aksesoris",
      price: 10000,
      stock: 500,
      tags: "kail, murah, tajam, terminal",
    },
  ];

  for (const gear of fishingGears) {
    // 1. Simpan ke Postgres (Data Lengkap)
    const product = await prisma.product.create({
      data: { ...gear, createdById: admin.id },
    });

    // 2. Simpan ke Elastic (Data Pencarian + Analitik)
    try {
      await esClient.index({
        index: ES_INDEX,
        id: product.id.toString(),
        document: {
          id: product.id,
          sku: product.sku, // <--- PENTING: SKU Masuk sini!
          name: product.name,
          description: product.description,
          category: product.category,
          price: product.price,
          tags: product.tags,
          isActive: true,
          // Stock TIDAK dimasukkan (sesuai request)
        },
      });
      console.log(`✅ Synced: ${product.name}`);
    } catch (error: any) {
      console.error(`❌ Gagal Sync ${product.name}!`);
      console.error("🔍 DETAIL ERROR:", JSON.stringify(error.meta?.body || error, null, 2));
    }
  }

  // Refresh biar data langsung muncul saat dicari
  try {
    await esClient.indices.refresh({ index: ES_INDEX });
  } catch (e) {}

  console.log("🎉 Seeding Selesai!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
