

export interface User {
  id: string;
  name: string;
  password?: string; // Should be handled securely in a real app
}

export interface LogEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  usedProductIds: string[];
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  address: string;
}

export interface Product {
  id: string;
  name: string;
  manufacturer: string;
  batchNo: string;
  expiryDate: string;
  stock: number;
  mrp: number;
}

export interface Sale {
  id: string;
  date: string;
  amount: number;
  cashType: 'Cash' | 'Bank';
  savings: number;
}

export interface PurchaseItem {
  productId: string;
  productName: string;
  quantity: number;
  cost: number;
  total: number;
  batchNo: string;
  expiryDate: string;
}

export interface Purchase {
  id: string;
  supplierId: string;
  supplierName: string;
  date: string;
  items: PurchaseItem[];
  total: number;
  purchaseGst: number;
  salesGst: number;
}

// FIX: Add ChatMessage interface for Chatbot component.
export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  image?: string;
}

export type View = 'dashboard' | 'sales' | 'purchases' | 'customers' | 'products' | 'suppliers' | 'users' | 'history';