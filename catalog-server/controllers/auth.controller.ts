import type { Request, Response } from "express";
import { AuthService } from "../services/auth.service";

export const AuthController = {
  // Handle POST /api/auth/login
  login: async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      // Validasi input sederhana
      if (!email || !password) {
        return res.status(400).json({ success: false, error: "Email dan Password wajib diisi" });
      }

      // Panggil Service
      const result = await AuthService.login(email, password);
      
      // Response Sukses
      res.json({
        success: true,
        message: "Login berhasil",
        data: result
      });

    } catch (error: any) {
      // Jika login gagal (Password salah / Email tidak ada)
      // Kita pakai status 401 (Unauthorized)
      res.status(401).json({
        success: false,
        error: error.message || "Login gagal"
      });
    }
  },
};