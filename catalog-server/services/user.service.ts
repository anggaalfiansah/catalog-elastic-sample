import { prisma } from "../config/prisma";
import { PasswordUtil } from "../utils/password.util";

export const UserService = {
  // 1. LIST SEMUA USER (Tanpa return password)
  findAll: async () => {
    return await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, createdAt: true }
    });
  },

  // 2. DETAIL USER
  findById: async (id: string) => {
    return await prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, email: true, role: true, createdAt: true }
    });
  },

  // 3. BUAT USER BARU (Hash Password!)
  create: async (data: any) => {
    // Cek email duplikat
    const exist = await prisma.user.findUnique({ where: { email: data.email } });
    if (exist) throw new Error("Email sudah digunakan");

    // Hash password
    const hashedPassword = await PasswordUtil.hash(data.password);

    return await prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        password: hashedPassword,
        role: data.role || "STAFF"
      },
      select: { id: true, name: true, email: true, role: true } // Return tanpa pass
    });
  },

  // 4. UPDATE USER
  update: async (id: string, data: any) => {
    const updateData: any = {
      name: data.name,
      role: data.role
    };

    // Jika password ikut diganti, hash ulang
    if (data.password) {
      updateData.password = await PasswordUtil.hash(data.password);
    }

    return await prisma.user.update({
      where: { id },
      data: updateData,
      select: { id: true, name: true, email: true, role: true }
    });
  },

  // 5. DELETE USER
  delete: async (id: string) => {
    return await prisma.user.delete({ where: { id } });
  }
};