import { useState } from "react";
import { api } from "../lib/axios";
import { useAuth } from "../context/AuthContext";
import { Lock, Mail, Loader2 } from "lucide-react";
import { AxiosError } from "axios"; // <--- 1. Import Tipe Error dari Axios

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await api.post("/auth/login", { email, password });
      login(res.data.data.token, res.data.data.user);
    } catch (err) {
      // 🛠️ PERBAIKAN: Type Guard (Cek apakah ini error dari Axios?)
      if (err instanceof AxiosError) {
        // TypeScript sekarang tahu bahwa 'err' punya properti 'response'
        // Kita gunakan 'any' di data karena struktur error backend bisa dinamis, 
        // tapi setidaknya err.response aman diakses.
        setError(err.response?.data?.error || "Login gagal. Cek email/password.");
      } else {
        // Jika error lain (misal koneksi putus / kode salah)
        setError("Terjadi kesalahan sistem. Coba lagi nanti.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-gray-800">Admin Login</h1>
          <p className="text-gray-500">Masuk untuk mengelola toko</p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-100 p-3 text-sm text-red-600 border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 text-gray-400" size={18} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-gray-300 pl-10 p-2.5 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="admin@toko.com"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 text-gray-400" size={18} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-gray-300 pl-10 p-2.5 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 py-2.5 font-bold text-white transition hover:bg-blue-700 disabled:bg-blue-300 flex justify-center"
          >
            {loading ? <Loader2 className="animate-spin" /> : "Masuk"}
          </button>
        </form>
      </div>
    </div>
  );
}