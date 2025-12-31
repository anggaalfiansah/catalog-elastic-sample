import type { Request, Response } from "express";
import { ProductService } from "../services/product.service";
import type { AuthRequest } from "../middlewares/auth.middleware";

export const ProductController = {
  // Public
  search: async (req: Request, res: Response) => {
    try {
      const query = (req.query.q as string) || "";
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 12; // Default 12 per load

      const result = await ProductService.search(query, page, limit);

      // Response standar JSON API
      res.json({
        success: true,
        data: result.data, // Array produk (max 12 biji)
        meta: result.meta, // Info halaman { total: 807, page: 1, ... }
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Search failed" });
    }
  },

  // Public
  trending: async (req: Request, res: Response) => {
    const data = await ProductService.getTrending();
    res.json({ success: true, data });
  },

  // Protected
  stats: async (req: Request, res: Response) => {
    try {
      const data = await ProductService.getStats();
      res.json({ success: true, data });
    } catch (error) {
      console.error("Stats Error:", error);
      res.status(500).json({ error: "Gagal load statistik" });
    }
  },

  // Protected
  create: async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.id; // Dari Token
      const product = await ProductService.create({ ...req.body, userId });
      res.status(201).json({ success: true, data: product });
    } catch (e) {
      res.status(500).json({ error: "Create failed" });
    }
  },

  // Protected
  update: async (req: AuthRequest, res: Response) => {
    try {
      const id = Number(req.params.id);
      const userId = req.user!.id;
      console.log(`[INFO] Updating Product ID=${id} by User ID=${userId}`);
      const product = await ProductService.update(id, { ...req.body, userId });
      res.json({ success: true, data: product });
    } catch (e) {
      console.log(`[ERROR] Product Update Failed: `, e);

      res.status(500).json({ error: "Update failed" });
    }
  },

  // Protected
  delete: async (req: AuthRequest, res: Response) => {
    try {
      const id = Number(req.params.id);
      const userId = req.user!.id;
      await ProductService.softDelete(id, userId);
      res.json({ success: true, message: "Product deleted" });
    } catch (e) {
      res.status(500).json({ error: "Delete failed" });
    }
  },
};
