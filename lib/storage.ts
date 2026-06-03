import {
  Customer, Product, Sale, Purchase, Supplier, User, LogEntry, Bill, MoneyTransaction,
} from '../types';

/**
 * The full application data set. Firestore is the source of truth (one collection
 * per field); this shape is assembled in memory for the local-folder mirror and
 * for exports.
 */
export interface AppData {
  customers: Customer[];
  products: Product[];
  sales: Sale[];
  purchases: Purchase[];
  suppliers: Supplier[];
  users: User[];
  historyLog: LogEntry[];
  bills: Bill[];
  moneyTransactions: MoneyTransaction[];
}

export const emptyData = (): AppData => ({
  customers: [],
  products: [],
  sales: [],
  purchases: [],
  suppliers: [],
  users: [],
  historyLog: [],
  bills: [],
  moneyTransactions: [],
});
