import type { Response, NextFunction } from "express";
import type { AuthRequest } from "./auth.middleware";

export const adminMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  // Cek apakah user ada dan rolenya adalah ADMIN
  if (!req.user || req.user.role !== "ADMIN") {
    return res.status(403).json({ 
      success: false, 
      error: "Akses ditolak. Hanya Admin yang diizinkan melakukan tindakan ini." 
    });
  }
  
  next();
};