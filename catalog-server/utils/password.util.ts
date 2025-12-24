import bcrypt from "bcryptjs";

const SALT_ROUNDS = 10; // Standar keamanan saat ini (tidak terlalu lambat, tidak terlalu cepat)

export const PasswordUtil = {
  /**
   * 1. HASHING (Untuk Register / Ganti Password)
   * Mengubah "admin123" menjadi "$2b$10$EixZaYVK1fsdf..."
   */
  hash: async (password: string): Promise<string> => {
    return await bcrypt.hash(password, SALT_ROUNDS);
  },

  /**
   * 2. COMPARE (Untuk Login)
   * Membandingkan input user "admin123" dengan hash di database
   */
  compare: async (plainPassword: string, hashedPassword: string): Promise<boolean> => {
    return await bcrypt.compare(plainPassword, hashedPassword);
  },

  /**
   * 3. GENERATE RANDOM (Untuk Reset Password / Create User oleh Admin)
   * Menghasilkan string acak misal: "Xy7#mP9!"
   */
  generateRandom: (length: number = 8): string => {
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";
    for (let i = 0, n = charset.length; i < length; ++i) {
      password += charset.charAt(Math.floor(Math.random() * n));
    }
    return password;
  },
};
