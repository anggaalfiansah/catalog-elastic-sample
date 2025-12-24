import type { Request, Response, NextFunction } from "express";
import { JwtUtil } from "../utils/jwt.util";
import { prisma } from "../config/prisma";

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
    email: string; // Tambahkan email jika perlu
  };
}

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, error: "Akses ditolak. Token tidak ada." });
    }

    const token = authHeader.split(" ")[1];
    const decoded = (await JwtUtil.verify(token)) as { id: string; role: string } | null;

    if (!decoded) {
      return res.status(403).json({ success: false, error: "Token tidak valid atau kadaluarsa." });
    }

    // --- CEK KE DATABASE ---
    const userExists = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, role: true, email: true }, // Hanya ambil field yang perlu untuk efisiensi
    });

    if (!userExists) {
      return res.status(404).json({
        success: false,
        error: "User sudah tidak terdaftar di sistem. Silahkan login ulang.",
      });
    }

    // Pastikan req menggunakan data terbaru dari database (antisipasi jika role berubah)
    (req as AuthRequest).user = userExists;

    next();
  } catch (error) {
    console.error("Auth Middleware Error:", error);
    return res.status(500).json({ success: false, error: "Terjadi kesalahan pada sistem autentikasi." });
  }
};
