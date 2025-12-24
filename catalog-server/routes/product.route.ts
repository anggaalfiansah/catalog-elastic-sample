import { Router } from "express";
import { ProductController } from "../controllers/product.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

// -- PUBLIC ROUTES (Tanpa Login) --
router.get("/", ProductController.search);        // Cari barang
router.get("/trending", ProductController.trending); // Liat tren

// -- PRIVATE ROUTES (Wajib Login) --
router.post("/", authMiddleware, ProductController.create);
router.put("/:id", authMiddleware, ProductController.update);
router.delete("/:id", authMiddleware, ProductController.delete);

export default router;