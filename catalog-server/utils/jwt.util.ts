import { SignJWT, jwtVerify } from "jose";

// Jose butuh secret dalam format Uint8Array (Byte buffer)
const SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET || "rahasia_negara_toko_pancing_2025"
);

export const JwtUtil = {
  /**
   * 1. GENERATE TOKEN (Async)
   * Menggunakan jose.SignJWT
   */
  sign: async (payload: { id: string; role: string }) => {
    return await new SignJWT(payload)
      .setProtectedHeader({ alg: "HS256" }) // Algoritma standar
      .setIssuedAt()
      .setExpirationTime("1d") // Berlaku 1 hari
      .sign(SECRET_KEY);
  },

  /**
   * 2. VERIFY TOKEN (Async)
   * Menggunakan jose.jwtVerify
   * Mengembalikan payload jika valid, atau null jika gagal
   */
  verify: async (token: string) => {
    try {
      const { payload } = await jwtVerify(token, SECRET_KEY);
      return payload;
    } catch (error) {
      return null;
    }
  },
};