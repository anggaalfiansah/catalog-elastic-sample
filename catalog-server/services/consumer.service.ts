import { Kafka } from "kafkajs";
import { esClient } from "../config/elastic";

const kafka = new Kafka({
  clientId: "toko-pancing-sync",
  brokers: ["localhost:9092"],
});

const consumer = kafka.consumer({ groupId: "toko-pancing-group-1" });
const KAFKA_TOPIC = "pgserver.public.products";

export const startConsumer = async () => {
  try {
    console.log("🔄 Connecting to Kafka...");
    await consumer.connect();
    await consumer.subscribe({ topic: KAFKA_TOPIC, fromBeginning: true });
    
    console.log(`✅ Sync Worker Started (BULK MODE)! Listening to: ${KAFKA_TOPIC}`);

    // GUNAKAN eachBatch BUKAN eachMessage
    await consumer.run({
      eachBatchAutoResolve: true,
      eachBatch: async ({ batch, resolveOffset, heartbeat, isRunning }) => {
        if (!isRunning()) return;

        console.log(`📦 Menerima Batch: ${batch.messages.length} pesan.`);
        
        const bulkOperations: any[] = [];

        for (const message of batch.messages) {
          if (!message.value) continue;

          const payloadStr = message.value.toString();
          const payload = JSON.parse(payloadStr);
          const data = payload.payload || payload;
          
          if (!data) continue;

          const { op, after, before } = data;

          // 1. Handle CREATE / UPDATE / SNAPSHOT
          if (['c', 'u', 'r'].includes(op)) {
            // Format Bulk Elastic butuh 2 baris per aksi:
            // Baris 1: Metadata (index, id)
            bulkOperations.push({ index: { _index: "products", _id: after.id.toString() } });
            // Baris 2: Data Dokumen
            bulkOperations.push({
              id: after.id,
              sku: after.sku,
              name: after.name,
              description: after.description,
              category: after.category,
              price: after.price,
              tags: after.tags,
              isActive: after.isactive ?? true,
            });
          } 
          // 2. Handle DELETE
          else if (op === 'd') {
            bulkOperations.push({ delete: { _index: "products", _id: before.id.toString() } });
          }

          // Tandai pesan ini sudah diproses (biar kalau error gak ngulang dari awal batch)
          resolveOffset(message.offset);
        }

        // EKSEKUSI KIRIM KE ELASTIC (Cuma 1x Request per Batch!)
        if (bulkOperations.length > 0) {
          try {
            const { errors, items } = await esClient.bulk({ operations: bulkOperations });
            
            if (errors) {
              console.error("⚠️ Sebagian data gagal masuk Elastic:", JSON.stringify(items));
            } else {
              console.log(`✅ Sukses Insert/Update ${batch.messages.length} items sekaligus.`);
            }
          } catch (err) {
            console.error("❌ Gagal Bulk Insert:", err);
            // Jangan throw error fatal biar consumer gak mati, log saja
          }
        }

        // Kirim detak jantung ke Kafka biar gak dikira mati saat proses data banyak
        await heartbeat();
      },
    });
  } catch (error) {
    console.error("❌ Kafka Consumer Error:", error);
  }
};