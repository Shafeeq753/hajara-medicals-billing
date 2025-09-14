
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

export interface SaleItem {
  productId: string;
  productName: string;
  batchNo: string;
  quantity: number;
  mrp: number;
  total: number;
}

export interface Sale {
  id: string;
  customerId: string;
  customerName: string;
  date: string;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  total: number;
  amountPaid: number;
  balance: number;
}

export interface PurchaseItem {
  productId: string;
  productName: string;
  quantity: number;
  cost: number;
  total: number;
}

export interface Purchase {
  id: string;
  supplierId: string;
  supplierName: string;
  date: string;
  items: PurchaseItem[];
  total: number;
}