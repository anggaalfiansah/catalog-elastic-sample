import { createContext, useContext, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";

// Definisi Tipe Data User
interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate();

  // 🛠️ PERBAIKAN 1: Lazy Initialization
  // Baca localStorage LANGSUNG di sini, jadi tidak butuh useEffect lagi.
  // Aplikasi jadi lebih cepat karena tidak render 2 kali.
  
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem("token");
  });

  const [user, setUser] = useState<User | null>(() => {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  });

  // Fungsi Login
  const login = (newToken: string, newUser: User) => {
    localStorage.setItem("token", newToken);
    localStorage.setItem("user", JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    navigate("/admin/products"); 
  };

  // Fungsi Logout
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
    navigate("/login");
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
};

// 🛠️ PERBAIKAN 2: Tambahkan komentar eslint-disable di bawah ini
// Ini memberitahu Vite bahwa export hook di file ini aman.

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};