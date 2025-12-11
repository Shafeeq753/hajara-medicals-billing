
import { Customer, Product, Sale, Purchase, Supplier, User } from '../types';

export const DUMMY_USERS: User[] = [
  { id: 'USER-001', name: 'thalif', password: 'thalif' },
];

export const DUMMY_PRODUCTS: Product[] = [
  { id: 'PROD-001', name: 'Paracetamol 500mg', manufacturer: 'Pharma Inc.', shelfLocation: 'A1', stock: 150, mrp: 25.50 },
  { id: 'PROD-002', name: 'Aspirin 75mg', manufacturer: 'HealthCorp', shelfLocation: 'A2', stock: 200, mrp: 15.00 },
  { id: 'PROD-003', name: 'Amoxicillin 250mg', manufacturer: 'MediLife', shelfLocation: 'B1', stock: 80, mrp: 75.00 },
  { id: 'PROD-004', name: 'Vitamin C 1000mg', manufacturer: 'NutriWell', shelfLocation: 'C3', stock: 300, mrp: 120.75 },
  { id: 'PROD-005', name: 'Cough Syrup 100ml', manufacturer: 'Pharma Inc.', shelfLocation: 'A1', stock: 120, mrp: 90.00 },
];

export const DUMMY_CUSTOMERS: Customer[] = [
  { 
    id: 'CUST-001', 
    name: 'John Doe', 
    phone: '555-0101', 
    address: '123 Maple St', 
    medicines: [
        { productId: 'PROD-001', dosage: '500mg', frequency: '1-0-1', duration: '5 days' },
        { productId: 'PROD-005', dosage: '10ml', frequency: '0-0-1', duration: '3 days' }
    ] 
  },
  { 
    id: 'CUST-002', 
    name: 'Jane Smith', 
    phone: '555-0102', 
    address: '456 Oak Ave', 
    medicines: [
        { productId: 'PROD-002', dosage: '75mg', frequency: '1-0-0', duration: '30 days' }
    ] 
  },
  { 
    id: 'CUST-003', 
    name: 'Peter Jones', 
    phone: '555-0103', 
    address: '789 Pine Ln', 
    medicines: [] 
  },
];

export const DUMMY_SUPPLIERS: Supplier[] = [
  { id: 'SUP-001', name: 'Pharma Distributors', phone: '555-0201', address: '123 Supply Rd', gstNumber: '29ABCDE1234F1Z5', dlNo: 'DL12345' },
  { id: 'SUP-002', name: 'MediSupplies Co.', phone: '555-0202', address: '456 Med Blvd', gstNumber: '27FGHIJ6789K1Z4', dlNo: 'DL67890' },
  { id: 'SUP-003', name: 'Health Essentials Inc.', phone: '555-0203', address: '789 Wellness Ave', gstNumber: '33LMNOP5432Q1Z3', dlNo: 'DL54321' },
];

export const DUMMY_SALES: Sale[] = [
    {
        id: 'SALE-001',
        date: new Date(Date.now() - 86400000).toISOString().split('T')[0], // Yesterday
        amount: 1500.00,
        cashType: 'Cash',
        savings: 150.00,
    },
    {
        id: 'SALE-002',
        date: new Date().toISOString().split('T')[0], // Today
        amount: 2350.50,
        cashType: 'Bank',
        savings: 210.00,
    },
];


export const DUMMY_PURCHASES: Purchase[] = [
    {
        id: 'PUR-001',
        supplierId: 'SUP-001',
        supplierName: 'Pharma Distributors',
        date: new Date(Date.now() - 86400000 * 5).toISOString().split('T')[0], // 5 days ago
        paymentMethod: 'Credit',
        items: [
            { 
                productId: 'PROD-001', 
                productName: 'Paracetamol 500mg', 
                quantity: 100, 
                packaging: '10x10',
                rate: 15.00,
                mrp: 25.50,
                discount: 5, // %
                amount: 1500.00, // 100 * 15.00
                hsnCode: '30049099',
                cgst: 6, // %
                sgst: 6, // %
                igst: 0, // %
                batchNo: 'PC500-1A', 
                expiryDate: '2025-12-31' 
            },
            { 
                productId: 'PROD-002', 
                productName: 'Aspirin 75mg', 
                quantity: 200, 
                packaging: '10x10',
                rate: 8.00,
                mrp: 15.00,
                discount: 0,
                amount: 1600.00, // 200 * 8.00
                hsnCode: '30049099',
                cgst: 2.5,
                sgst: 2.5,
                igst: 0,
                batchNo: 'ASP75-2B', 
                expiryDate: '2026-06-30'
            },
        ],
        roundOff: 0.00,
        total: 3276.00,
        paymentStatus: 'Unpaid',
        paidAmount: 0,
        paymentHistory: [],
    }
];