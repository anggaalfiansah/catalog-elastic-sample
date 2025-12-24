import { prisma } from "../config/prisma";
import { PasswordUtil } from "../utils/password.util";
import { JwtUtil } from "../utils/jwt.util";

export const AuthService = {
  login: async (email: string, pass: string) => {
    // 1. Cari User di Database
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new Error("Email tidak terdaftar");
    }

    // 2. Cek Password (Bcrypt)
    const isMatch = await PasswordUtil.compare(pass, user.password);
    if (!isMatch) {
      throw new Error("Password salah");
    }

    // 3. Generate Token (Jose - Async)
    // Kita tunggu proses signing selesai
    const token = await JwtUtil.sign({ id: user.id, role: user.role });

    // 4. Return data user (tanpa password) & token
    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      token,
    };
  },
};