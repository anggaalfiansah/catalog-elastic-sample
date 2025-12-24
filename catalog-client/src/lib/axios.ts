import axios from "axios";

export const api = axios.create({
  baseURL: "http://localhost:5000/api", // Sesuaikan port backend Anda
});

// Setup interceptor (Nanti berguna buat nempel token otomatis)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});