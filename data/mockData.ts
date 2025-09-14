
import { Customer, Product, Sale, Purchase, Supplier, User } from '../types';

export const DUMMY_USERS: User[] = [
  { id: 'USER-001', name: 'thalif', password: 'thalif' },
];

export const DUMMY_PRODUCTS: Product[] = [
  { id: 'PROD-001', name: 'Paracetamol 500mg', manufacturer: 'Pharma Inc.', batchNo: 'PC500-1A', expiryDate: '2025-12-31', stock: 150, mrp: 25.50 },
  { id: 'PROD-002', name: 'Aspirin 75mg', manufacturer: 'HealthCorp', batchNo: 'ASP75-2B', expiryDate: '2026-06-30', stock: 200, mrp: 15.00 },
  { id: 'PROD-003', name: 'Amoxicillin 250mg', manufacturer: 'MediLife', batchNo: 'AMX250-3C', expiryDate: '2025-08-01', stock: 80, mrp: 75.00 },
  { id: 'PROD-004', name: 'Vitamin C 1000mg', manufacturer: 'NutriWell', batchNo: 'VITC1K-4D', expiryDate: '2027-01-01', stock: 300, mrp: 120.75 },
  { id: 'PROD-005', name: 'Cough Syrup 100ml', manufacturer: 'Pharma Inc.', batchNo: 'CS100-5E', expiryDate: '2025-10-20', stock: 120, mrp: 90.00 },
];

export const DUMMY_CUSTOMERS: Customer[] = [
  { id: 'CUST-001', name: 'John Doe', phone: '555-0101', address: '123 Maple St' },
  { id: 'CUST-002', name: 'Jane Smith', phone: '555-0102', address: '456 Oak Ave' },
  { id: 'CUST-003', name: 'Peter Jones', phone: '555-0103', address: '789 Pine Ln' },
];

export const DUMMY_SUPPLIERS: Supplier[] = [
  { id: 'SUP-001', name: 'Pharma Distributors', phone: '555-0201', address: '123 Supply Rd' },
  { id: 'SUP-002', name: 'MediSupplies Co.', phone: '555-0202', address: '456 Med Blvd' },
  { id: 'SUP-003', name: 'Health Essentials Inc.', phone: '555-0203', address: '789 Wellness Ave' },
];

export const DUMMY_SALES: Sale[] = [
    {
        id: 'SALE-001',
        customerId: 'CUST-001',
        customerName: 'John Doe',
        date: new Date(Date.now() - 86400000).toISOString().split('T')[0], // Yesterday
        items: [
            { productId: 'PROD-001', productName: 'Paracetamol 500mg', batchNo: 'PC500-1A', quantity: 2, mrp: 25.50, total: 51.00 },
            { productId: 'PROD-005', productName: 'Cough Syrup 100ml', batchNo: 'CS100-5E', quantity: 1, mrp: 90.00, total: 90.00 },
        ],
        subtotal: 141.00,
        discount: 10.00,
        total: 131.00,
        amountPaid: 100.00,
        balance: 31.00,
    },
    {
        id: 'SALE-002',
        customerId: 'CUST-002',
        customerName: 'Jane Smith',
        date: new Date().toISOString().split('T')[0], // Today
        items: [
            { productId: 'PROD-002', productName: 'Aspirin 75mg', batchNo: 'ASP75-2B', quantity: 3, mrp: 15.00, total: 45.00 },
        ],
        subtotal: 45.00,
        discount: 0,
        total: 45.00,
        amountPaid: 45.00,
        balance: 0.00,
    },
];


export const DUMMY_PURCHASES: Purchase[] = [
    {
        id: 'PUR-001',
        supplierId: 'SUP-001',
        supplierName: 'Pharma Distributors',
        date: new Date(Date.now() - 86400000 * 5).toISOString().split('T')[0], // 5 days ago
        items: [
            { productId: 'PROD-001', productName: 'Paracetamol 500mg', quantity: 100, cost: 15.00, total: 1500.00 },
            { productId: 'PROD-002', productName: 'Aspirin 75mg', quantity: 200, cost: 8.00, total: 1600.00 },
        ],
        total: 3100.00,
    }
];