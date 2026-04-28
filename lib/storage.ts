import {
  Customer, Product, Sale, Purchase, Supplier, User, LogEntry, Bill, MoneyTransaction,
} from '../types';

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

declare global {
  interface Window {
    electronAPI?: {
      isElectron: true;
      getStoragePath: () => Promise<string | null>;
      pickStoragePath: () => Promise<string | null>;
      loadData: () => Promise<AppData | { __error: string } | null>;
      saveData: (data: AppData) => Promise<true>;
      exportExcel: (sheets: Record<string, unknown[]>) => Promise<string | null>;
      openStorageFolder: () => Promise<true>;
    };
  }
}

export const isElectron = (): boolean => typeof window !== 'undefined' && !!window.electronAPI;

export const electron = () => {
  if (!window.electronAPI) {
    throw new Error('Electron API not available — this build must run inside the desktop app.');
  }
  return window.electronAPI;
};
