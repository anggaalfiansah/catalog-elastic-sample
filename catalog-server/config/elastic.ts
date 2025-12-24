import { Client, HttpConnection } from "@elastic/elasticsearch";
import dotenv from "dotenv";

dotenv.config();

export const esClient = new Client({
  node: process.env.ELASTIC_NODE || "http://localhost:9200",
  Connection: HttpConnection,
});

export const checkESConnection = async () => {
  let retries = 5;

  while (retries > 0) {
    try {
      console.log("⏳ Mencoba koneksi ke Elasticsearch...", process.env.ELASTIC_NODE || "http://localhost:9200");
      const health = await esClient.cluster.health({});
      console.log(`✅ Elasticsearch Connected! Status: ${health.status}`);
      return; // Berhasil, keluar loop
    } catch (error) {
      console.error(`⚠️ Gagal konek ke Elastic. Sisa percobaan: ${retries - 1}`);
      retries--;
      // Tunggu 5 detik sebelum coba lagi
      await new Promise((res) => setTimeout(res, 5000));
    }
  }

  console.error("❌ Gagal total koneksi ke Elasticsearch. Pastikan Docker sudah running.");
  // Kita tidak throw error agar server tetap nyala (database postgres mungkin aman)
};
