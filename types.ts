// FIX: Add content to types.ts to define data structures for the application.
export enum Role {
  Admin = 'Admin',
  Seller = 'Vendeur',
}

export interface User {
  id: number;
  name: string;
  role: Role;
}

export interface ProductVariant {
  size: string;
  stock: number;
  lowStockThreshold: number;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  variants: ProductVariant[];
}

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  size: string;
  stock: number;
}

export interface TransactionItem {
    productId: string;
    productName: string;
    size: string;
    quantity: number;
    price: number;
}

export interface Transaction {
    id: string;
    date: string; // ISO string
    items: TransactionItem[];
    total: number;
    tax: number;
    paymentMethod: 'Espèces' | 'Carte' | 'Chèque';
    sellerId: number;
}

export interface Category {
    id: string;
    name: string;
}
