import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { checkESConnection } from "./config/elastic";

// Import Routes
import authRoutes from "./routes/auth.route";
import productRoutes from "./routes/product.route";
import userRoutes from "./routes/user.route";

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware Global
app.use(cors());
app.use(express.json());

// ==============================
// 🚦 DAFTAR ROUTES
// ==============================
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/users", userRoutes);

// 3. Health Check (Cek server hidup/mati)
app.get("/", (req, res) => {
  res.send("🎣 Toko Pancing API is Running! 🚀");
});

// ==============================
// 🚀 START SERVER
// ==============================
app.listen(PORT, async () => {
  console.log(`\n🚀 Server running at http://localhost:${PORT}`);

  // Cek koneksi ke Search Engine saat server nyala
  await checkESConnection();
});
