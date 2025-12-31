import { Kafka } from "kafkajs";
import { esClient } from "../config/elastic";

// Konfigurasi Kafka
const kafka = new Kafka({
  clientId: "toko-pancing-sync",
  brokers: ["localhost:9092"], // Sesuai docker-compose
});

const consumer = kafka.consumer({ groupId: "toko-pancing-group-1" });

// Nama Topik dari Debezium Postgres
// Format default: prefix.schema.table
const KAFKA_TOPIC = "pgserver.public.products";

export const startConsumer = async () => {
  try {
    console.log("🔄 Connecting to Kafka...");
    await consumer.connect();

    // Subscribe ke topik produk
    await consumer.subscribe({ topic: KAFKA_TOPIC, fromBeginning: true });

    console.log(`✅ Sync Worker Started! Listening to: ${KAFKA_TOPIC}`);

    await consumer.run({
      eachMessage: async ({ message }) => {
        if (!message.value) return;

        // Parsing JSON dari Debezium
        const payloadStr = message.value.toString();
        const payload = JSON.parse(payloadStr);

        // Debezium structure wrapper (terkadang ada di dalam property 'payload')
        const data = payload.payload || payload;

        if (!data) return;

        const { op, after, before } = data;

        // ---------------------------------------------------------
        // LOGIC SINKRONISASI KE ELASTIC
        // ---------------------------------------------------------

        // Operation: Create (c), Update (u), Read/Snapshot (r)
        if (["c", "u", "r"].includes(op)) {
          // console.log(`📥 Upsert Elastic: ${after.name} (SKU: ${after.sku})`);

          await esClient.index({
            index: "products",
            id: after.id.toString(), // ID Postgres jadi ID Elastic
            document: {
              id: after.id,
              sku: after.sku,
              name: after.name,
              description: after.description,
              category: after.category,
              price: after.price,
              tags: after.tags,
              isActive: after.isactive ?? true, // Perhatikan case sensitive postgres (kadang jadi lowercase)
            },
          });
        }

        // Operation: Delete (d)
        else if (op === "d") {
          console.log(`🗑️ Delete from Elastic ID: ${before.id}`);
          await esClient
            .delete({
              index: "products",
              id: before.id.toString(),
            })
            .catch((err) => {
              // Ignore error if document not found
              if (err.meta?.statusCode !== 404) console.error(err);
            });
        }
      },
    });
  } catch (error) {
    console.error("❌ Kafka Consumer Error:", error);
  }
};
