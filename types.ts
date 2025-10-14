

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
  id:string;
  name: string;
  phone: string;
  address: string;
  gstNumber: string;
  dlNo: string;
}

export interface Product {
  id: string;
  name: string;
  manufacturer: string;
  shelfLocation: string;
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
  packaging: string;
  rate: number;
  mrp: number;
  discount: number; // percentage
  amount: number; // quantity * rate
  hsnCode: string;
  cgst: number; // percentage
  sgst: number; // percentage
  igst: number; // percentage
  batchNo: string;
  expiryDate: string;
}

export interface PaymentRecord {
  id: string;
  date: string;
  amount: number;
  screenshotUrl?: string; // Data URL of the uploaded image
}

export interface Purchase {
  id: string;
  supplierId: string;
  supplierName: string;
  date: string;
  paymentMethod: 'Credit' | 'Cash' | 'Bank Transfer';
  items: PurchaseItem[];
  roundOff?: number;
  total: number; // Grand total including taxes and round off
  paymentStatus: 'Paid' | 'Partially Paid' | 'Unpaid';
  paidAmount: number;
  paymentHistory: PaymentRecord[];
}

export interface BillItem {
  serialNumber: number;
  productId: string;
  productName: string;
  expiryDate: string;
  quantity: number;
  packaging: string;
  mrp: number;
  discount: number; // percentage
  total: number;
}

export interface Bill {
  id: string;
  patientName: string;
  doctorName: string;
  billNumber: string;
  date: string;
  items: BillItem[];
  subTotal: number;
  overallDiscount: number; // in amount
  roundOff: number;
  grandTotal: number;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  image?: string;
}

export type View = 'dashboard' | 'accounts' | 'sales' | 'purchases' | 'customers' | 'products' | 'suppliers' | 'users' | 'history' | 'pendingPayments' | 'billing';