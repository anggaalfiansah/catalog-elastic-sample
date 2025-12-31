import { prisma } from "../catalog-server/config/prisma";
import * as dotenv from "dotenv";

dotenv.config();

// Kumpulan String "Beracun"
const NASTY_STRINGS = [
  "Joran 🎣 'Super' \"Kuat\" \\ Anti-Badai", // Quote & Backslash hell
  "Reel 💣 DROP TABLE products; --", // SQL Injection prank
  "Umpan 🐉 中国制造 (Made in China)", // Unicode / Kanji
  "Senar 🧵 \n Baris Baru \t Tabulasi", // Control characters
  "Joran 🤣👌🔥💯 𝕋𝕖𝕩𝕥 𝔸𝕝𝕒𝕪", // Emojis & Fancy text
  "Aksesoris <script>alert('hacked')</script>", // XSS attempt
  null, // Coba paksa null (TypeScript akan komplain tapi kita bypass)
];

// Fungsi generate string panjang
const longText = "LOREM IPSUM ".repeat(500); // 6000 chars

async function chaosInsert() {
  console.log(`💀 Memulai CHAOS INJECTION... Menguji ketahanan Pipeline.`);

  // Kita buat 100 data aneh secara parallel
  const iterations = Array.from({ length: 50 }, (_, i) => i);

  // Ambil Admin ID
  const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
  if (!admin) return;

  const promises = iterations.map(async (i) => {
    // Pilih string racun secara acak
    const nasty = NASTY_STRINGS[i % NASTY_STRINGS.length] || "Normal";
    
    // Kombinasi aneh
    const sku = `CHAOS-${Date.now()}-${i}-☠️`; 
    const name = `TEST #${i}: ${nasty}`;
    
    // Harga aneh: Minus, Nol, atau Max Int
    const weirdPrice = i % 3 === 0 ? -5000 : (i % 3 === 1 ? 0 : 999999999);

    try {
      await prisma.product.create({
        data: {
          sku: sku,
          name: name, // Nama berisi karakter aneh
          category: "Chaos Testing",
          price: weirdPrice, // Postgres nerima minus? Elastic nerima?
          description: i % 10 === 0 ? longText : `Desc dengan ${nasty}`,
          tags: "chaos, error, testing",
          createdById: admin.id,
          isActive: true
        }
      });
      process.stdout.write("✅");
    } catch (err) {
      process.stdout.write("❌");
      // console.error("\nPostgres menolak:", err.message);
    }
  });

  await Promise.all(promises);
  console.log("\n\n🏁 Chaos Injection Selesai.");
  console.log("👉 Cek Terminal Backend: Apakah Consumer crash? Apakah Elastic error parsing?");
}

chaosInsert();