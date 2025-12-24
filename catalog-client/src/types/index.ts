export interface Product {
  id: number;
  sku: string;
  name: string;
  description: string;
  category: string;
  price: number;
  tags?: string; // Datanya string "casting, sungai, gabus"
  isActive: boolean;
}

export interface TrendingKeyword {
  key: string;
  doc_count: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "STAFF";
  createdAt?: string;
}