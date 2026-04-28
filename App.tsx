import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Customer, Product, Sale, Purchase, Supplier, User, LogEntry, View, PaymentRecord, Bill, CustomerMedicine, MoneyTransaction } from './types';
import { AppData, electron, emptyData, isElectron } from './lib/storage';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import Sales from './components/Sales';
import Customers from './components/Customers';
import Purchases from './components/Purchases';
import DailyPurchases from './components/DailyPurchases';
import Products from './components/Products';
import Suppliers from './components/Suppliers';
import Users from './components/Users';
import HistoryLog from './components/HistoryLog';
import Login from './components/Login';
import Accounts from './components/Accounts';
import PendingPayments from './components/PendingPayments';
import Billing from './components/Billing';
import Reports from './components/Reports';
import MoneyManagement from './components/MoneyManagement';
import Chatbot from './components/Chatbot';
import SetupWizard from './components/SetupWizard';
import Settings from './components/Settings';
import { SparklesIcon } from './components/icons/Icons';

type Phase = 'checkingPath' | 'needsSetup' | 'loading' | 'ready' | 'error';

const newId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

const App = () => {
  const [phase, setPhase] = useState<Phase>('checkingPath');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [isChatOpen, setIsChatOpen] = useState(false);

  const [data, setData] = useState<AppData>(emptyData);

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dirtyRef = useRef(false);
  const initializedRef = useRef(false);

  const bootstrap = useCallback(async () => {
    if (!isElectron()) {
      setErrorMsg('This build must run inside the Hajara Medicals desktop app.');
      setPhase('error');
      return;
    }
    try {
      const path = await electron().getStoragePath();
      if (!path) {
        setPhase('needsSetup');
        return;
      }
      setPhase('loading');
      const loaded = await electron().loadData();
      if (loaded && (loaded as { __error?: string }).__error) {
        setErrorMsg(`Could not read your data file: ${(loaded as { __error: string }).__error}`);
        setPhase('error');
        return;
      }
      const next = (loaded as AppData | null) ?? emptyData();
      if (!next.users || next.users.length === 0) {
        next.users = [{ id: newId('USER'), name: 'thalif', password: 'thalif' }];
      }
      const ensured: AppData = { ...emptyData(), ...next };
      setData(ensured);
      initializedRef.current = true;
      setPhase('ready');
    } catch (err) {
      setErrorMsg(String(err));
      setPhase('error');
    }
  }, []);

  useEffect(() => { bootstrap(); }, [bootstrap]);

  useEffect(() => {
    if (phase !== 'ready' || !initializedRef.current) return;
    dirtyRef.current = true;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      electron().saveData(data).catch(err => console.error('Save failed:', err));
      dirtyRef.current = false;
    }, 400);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [data, phase]);

  useEffect(() => {
    const flush = () => {
      if (dirtyRef.current && initializedRef.current) {
        electron().saveData(data).catch(() => {});
      }
    };
    window.addEventListener('beforeunload', flush);
    return () => window.removeEventListener('beforeunload', flush);
  }, [data]);

  const update = <K extends keyof AppData>(key: K, updater: (prev: AppData[K]) => AppData[K]) => {
    setData(prev => ({ ...prev, [key]: updater(prev[key]) }));
  };

  const addLogEntry = (action: string) => {
    if (!currentUser) return;
    const entry: LogEntry = {
      id: newId('LOG'),
      timestamp: new Date().toISOString(),
      userId: currentUser.id,
      userName: currentUser.name,
      action,
    };
    update('historyLog', list => [...list, entry]);
  };

  const handleLogin = (name: string, password: string) => {
    const user = data.users.find(u => u.name === name && u.password === password);
    if (user) {
      const { password: _pw, ...rest } = user;
      setCurrentUser(rest);
      setLoginError(null);
      const entry: LogEntry = {
        id: newId('LOG'),
        timestamp: new Date().toISOString(),
        userId: rest.id,
        userName: rest.name,
        action: 'User logged in.',
      };
      update('historyLog', list => [...list, entry]);
    } else {
      setLoginError('Invalid username or password.');
    }
  };

  const handleLogout = () => {
    if (currentUser) {
      addLogEntry('User logged out.');
      setCurrentUser(null);
      setActiveView('dashboard');
    }
  };

  const handleAddUser = async (user: Omit<User, 'id' | 'password'> & { password?: string }) => {
    const newUser: User = { id: newId('USER'), name: user.name, password: user.password };
    update('users', list => [...list, newUser]);
    addLogEntry(`Added new user: ${user.name}`);
  };

  const handleAddCustomer = async (customer: Omit<Customer, 'id'>) => {
    const newCustomer: Customer = { ...customer, id: newId('CUST') };
    update('customers', list => [...list, newCustomer]);
    addLogEntry(`Added customer: ${customer.name}`);
  };

  const handleUpdateCustomerMedicines = async (customerId: string, medicines: CustomerMedicine[]) => {
    let name = 'Unknown';
    update('customers', list => list.map(c => {
      if (c.id === customerId) { name = c.name; return { ...c, medicines }; }
      return c;
    }));
    addLogEntry(`Updated medicines for customer: ${name}`);
  };

  const handleUpdateCustomer = async (updatedCustomer: Customer) => {
    update('customers', list => list.map(c => c.id === updatedCustomer.id ? updatedCustomer : c));
    addLogEntry(`Updated details for customer: ${updatedCustomer.name}`);
  };

  const handleAddSupplier = async (supplier: Omit<Supplier, 'id'>) => {
    const newSupplier: Supplier = { ...supplier, id: newId('SUP') };
    update('suppliers', list => [...list, newSupplier]);
    addLogEntry(`Added supplier: ${supplier.name}`);
  };

  const handleUpdateSupplier = async (updatedSupplier: Supplier) => {
    update('suppliers', list => list.map(s => s.id === updatedSupplier.id ? updatedSupplier : s));
    addLogEntry(`Updated supplier: ${updatedSupplier.name}`);
  };

  const handleDeleteSupplier = async (supplierId: string) => {
    let name = 'Unknown';
    update('suppliers', list => list.filter(s => {
      if (s.id === supplierId) { name = s.name; return false; }
      return true;
    }));
    addLogEntry(`Deleted supplier: ${name}`);
  };

  const handleAddProduct = async (product: Omit<Product, 'id'>): Promise<Product> => {
    const newProduct: Product = { ...product, id: newId('PROD') };
    update('products', list => [...list, newProduct]);
    addLogEntry(`Added product: ${product.name}`);
    return newProduct;
  };

  const handleUpdateProduct = async (updatedProduct: Product) => {
    update('products', list => list.map(p => p.id === updatedProduct.id ? updatedProduct : p));
    addLogEntry(`Updated product: ${updatedProduct.name}`);
  };

  const handleDeleteProduct = async (productId: string) => {
    let name = 'Unknown';
    update('products', list => list.filter(p => {
      if (p.id === productId) { name = p.name; return false; }
      return true;
    }));
    addLogEntry(`Deleted product: ${name}`);
  };

  const handleAddSale = async (sale: Omit<Sale, 'id'>) => {
    const newSale: Sale = { ...sale, id: newId('SALE') };
    update('sales', list => [...list, newSale]);
    addLogEntry(`Created sale ${newSale.id} (Total: ₹${sale.amount.toFixed(2)})`);
  };

  const handleUpdateSale = async (updatedSale: Sale) => {
    update('sales', list => list.map(s => s.id === updatedSale.id ? updatedSale : s));
    addLogEntry(`Updated sale ${updatedSale.id}`);
  };

  const handleDeleteSale = async (saleId: string) => {
    update('sales', list => list.filter(s => s.id !== saleId));
    addLogEntry(`Deleted sale ${saleId}`);
  };

  const handleAddPurchase = async (purchaseData: any) => {
    const { initialPaidAmount, ...purchase } = purchaseData;
    const total = purchase.total;
    const paidAmount = initialPaidAmount !== undefined
      ? (parseFloat(initialPaidAmount) || 0)
      : (purchase.paymentMethod === 'Credit' ? 0 : total);

    let status: 'Paid' | 'Partially Paid' | 'Unpaid' = 'Unpaid';
    if (paidAmount >= total) status = 'Paid';
    else if (paidAmount > 0) status = 'Partially Paid';

    const sourceMap: Record<string, 'Stock' | 'Bank' | 'Savings'> = {
      'Cash': 'Stock',
      'Bank Transfer': 'Bank',
      'Savings': 'Savings',
    };

    const paymentHistory: PaymentRecord[] = paidAmount > 0 ? [{
      id: newId('PAY-INIT'),
      date: purchase.date,
      amount: paidAmount,
      source: sourceMap[purchase.paymentMethod] || 'Stock',
    }] : [];

    const newPurchase: Purchase = {
      ...purchase,
      id: newId('PUR'),
      paymentStatus: status,
      paidAmount,
      paymentHistory,
    };

    setData(prev => {
      const products = prev.products.map(p => {
        const item = newPurchase.items.find(it => it.productId === p.id);
        if (!item) return p;
        return { ...p, stock: p.stock + item.quantity, mrp: item.mrp };
      });
      return {
        ...prev,
        purchases: [...prev.purchases, newPurchase],
        products,
      };
    });

    addLogEntry(`Created purchase from ${newPurchase.supplierName} (Total: ₹${total.toFixed(2)}, Paid: ₹${paidAmount.toFixed(2)})`);
  };

  const handleDeletePurchase = async (purchaseId: string) => {
    setData(prev => {
      const target = prev.purchases.find(p => p.id === purchaseId);
      if (!target) return prev;
      const products = prev.products.map(p => {
        const item = target.items.find(it => it.productId === p.id);
        if (!item) return p;
        return { ...p, stock: p.stock - item.quantity };
      });
      return {
        ...prev,
        purchases: prev.purchases.filter(p => p.id !== purchaseId),
        products,
      };
    });
    addLogEntry(`Deleted purchase ${purchaseId}`);
  };

  const handleUpdatePurchasePayment = async (purchaseId: string, paymentRecord: Omit<PaymentRecord, 'id'>) => {
    let logged = false;
    update('purchases', list => list.map(p => {
      if (p.id !== purchaseId) return p;
      const newPaidAmount = p.paidAmount + paymentRecord.amount;
      let newStatus: 'Paid' | 'Partially Paid' | 'Unpaid' = 'Unpaid';
      if (newPaidAmount >= p.total) newStatus = 'Paid';
      else if (newPaidAmount > 0) newStatus = 'Partially Paid';
      const record: PaymentRecord = { ...paymentRecord, id: newId('PAY') };
      logged = true;
      return {
        ...p,
        paidAmount: newPaidAmount,
        paymentStatus: newStatus,
        paymentHistory: [...p.paymentHistory, record],
      };
    }));
    if (logged) {
      addLogEntry(`Recorded payment of ₹${paymentRecord.amount.toFixed(2)} from ${paymentRecord.source} for purchase ${purchaseId}.`);
    }
  };

  const handleAddBill = async (bill: Omit<Bill, 'id'>) => {
    const newBill: Bill = { ...bill, id: newId('BILL') };
    setData(prev => {
      const products = prev.products.map(p => {
        const item = newBill.items.find(it => it.productId === p.id);
        if (!item) return p;
        return { ...p, stock: p.stock - item.quantity };
      });
      return { ...prev, bills: [...prev.bills, newBill], products };
    });
    addLogEntry(`Created bill for ${bill.patientName} (Total: ₹${bill.grandTotal.toFixed(2)})`);
  };

  const handleUpdateBill = async (updatedBill: Bill) => {
    update('bills', list => list.map(b => b.id === updatedBill.id ? updatedBill : b));
    addLogEntry(`Updated bill ${updatedBill.id}`);
  };

  const handleAddMoneyTransaction = async (tx: Omit<MoneyTransaction, 'id'>) => {
    const newTx: MoneyTransaction = { ...tx, id: newId('MTX') };
    update('moneyTransactions', list => [...list, newTx]);
    addLogEntry(`${tx.category} of ₹${tx.amount.toFixed(2)} in ${tx.type}`);
  };

  const handleUpdateMoneyTransaction = async (updatedTx: MoneyTransaction) => {
    update('moneyTransactions', list => list.map(t => t.id === updatedTx.id ? updatedTx : t));
    addLogEntry(`Updated ${updatedTx.category} entry ${updatedTx.id}`);
  };

  const handleDeleteMoneyTransaction = async (txId: string) => {
    update('moneyTransactions', list => list.filter(t => t.id !== txId));
    addLogEntry(`Deleted money transaction ${txId}`);
  };

  const handleTransfer = async (from: 'Stock' | 'Bank' | 'Savings', to: 'Stock' | 'Bank' | 'Savings', amount: number) => {
    const ts = new Date().toISOString();
    const out: MoneyTransaction = {
      id: newId('MTX'), date: ts, amount: -amount, type: from, category: 'Transfer', description: `Transfer to ${to}`,
    };
    const inn: MoneyTransaction = {
      id: newId('MTX'), date: ts, amount, type: to, category: 'Transfer', description: `Transfer from ${from}`,
    };
    update('moneyTransactions', list => [...list, out, inn]);
    addLogEntry(`Transferred ₹${amount} from ${from} to ${to}`);
  };

  const stockAmount = useMemo(() => {
    const totalSaleCash = data.sales.reduce((sum, s) => sum + s.cash, 0);
    const manualAdjustments = data.moneyTransactions.filter(t => t.type === 'Stock').reduce((sum, t) => sum + t.amount, 0);
    const purchasePaymentsFromStock = data.purchases.reduce((sum, p) =>
      sum + p.paymentHistory.filter(pay => pay.source === 'Stock').reduce((s, pay) => s + pay.amount, 0), 0);
    return totalSaleCash + manualAdjustments - purchasePaymentsFromStock;
  }, [data.sales, data.moneyTransactions, data.purchases]);

  const savingsBalance = useMemo(() => {
    const totalSaleSavings = data.sales.reduce((sum, s) => sum + s.savings, 0);
    const manualAdjustments = data.moneyTransactions.filter(t => t.type === 'Savings').reduce((sum, t) => sum + t.amount, 0);
    const purchasePaymentsFromSavings = data.purchases.reduce((sum, p) =>
      sum + p.paymentHistory.filter(pay => pay.source === 'Savings').reduce((s, pay) => s + pay.amount, 0), 0);
    return totalSaleSavings + manualAdjustments - purchasePaymentsFromSavings;
  }, [data.sales, data.moneyTransactions, data.purchases]);

  const bankBalance = useMemo(() => {
    const totalBankFromSales = data.sales.reduce((sum, s) => sum + s.bank, 0);
    const totalBankFromBills = data.bills.reduce((sum, b) => sum + b.grandTotal, 0);
    const manualAdjustments = data.moneyTransactions.filter(t => t.type === 'Bank').reduce((sum, t) => sum + t.amount, 0);
    const purchasePaymentsFromBank = data.purchases.reduce((sum, p) =>
      sum + p.paymentHistory.filter(pay => pay.source === 'Bank').reduce((s, pay) => s + pay.amount, 0), 0);
    return totalBankFromSales + totalBankFromBills + manualAdjustments - purchasePaymentsFromBank;
  }, [data.sales, data.bills, data.moneyTransactions, data.purchases]);

  const handleStoragePathChanged = useCallback(async (_newPath: string) => {
    const loaded = await electron().loadData();
    if (loaded && !(loaded as { __error?: string }).__error) {
      const next = (loaded as AppData | null) ?? emptyData();
      if (!next.users || next.users.length === 0) {
        next.users = data.users.length ? data.users : [{ id: newId('USER'), name: 'thalif', password: 'thalif' }];
      }
      setData({ ...emptyData(), ...next });
    }
  }, [data.users]);

  if (phase === 'checkingPath' || phase === 'loading') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">{phase === 'loading' ? 'Loading data…' : 'Starting up…'}</p>
        </div>
      </div>
    );
  }

  if (phase === 'error') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-xl shadow border border-red-200 p-6 max-w-lg">
          <h2 className="text-xl font-bold text-red-700 mb-2">Something went wrong</h2>
          <p className="text-gray-700 text-sm mb-4">{errorMsg}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'needsSetup') {
    return <SetupWizard onComplete={() => bootstrap()} />;
  }

  const { customers, products, sales, purchases, suppliers, users, historyLog, bills, moneyTransactions } = data;

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard sales={sales} bills={bills} customers={customers} products={products} purchases={purchases} />;
      case 'accounts':
        return <Accounts setActiveView={setActiveView} />;
      case 'money':
        return (
          <MoneyManagement
            moneyTransactions={moneyTransactions}
            sales={sales}
            bills={bills}
            purchases={purchases}
            stockBalance={stockAmount}
            bankBalance={bankBalance}
            savingsBalance={savingsBalance}
            onAddTransaction={handleAddMoneyTransaction}
            onUpdateTransaction={handleUpdateMoneyTransaction}
            onDeleteTransaction={handleDeleteMoneyTransaction}
            onUpdateSale={handleUpdateSale}
            onUpdateBill={handleUpdateBill}
            onTransfer={handleTransfer}
          />
        );
      case 'billing':
        return <Billing bills={bills} products={products} onAddBill={handleAddBill} />;
      case 'sales':
        return <Sales sales={sales} onAddSale={handleAddSale} onDeleteSale={handleDeleteSale} stockAmount={stockAmount} bankBalance={bankBalance} savingsBalance={savingsBalance} />;
      case 'dailyPurchases':
        return <DailyPurchases purchases={purchases} onAddPurchase={handleAddPurchase} onUpdatePayment={handleUpdatePurchasePayment} products={products} suppliers={suppliers} onAddSupplier={handleAddSupplier} onDeletePurchase={handleDeletePurchase} onAddProduct={handleAddProduct} stockBalance={stockAmount} savingsBalance={savingsBalance} bankBalance={bankBalance} />;
      case 'purchases':
        return <Purchases purchases={purchases} onAddPurchase={handleAddPurchase} products={products} suppliers={suppliers} onAddSupplier={handleAddSupplier} onDeletePurchase={handleDeletePurchase} onAddProduct={handleAddProduct} stockBalance={stockAmount} savingsBalance={savingsBalance} bankBalance={bankBalance} />;
      case 'pendingPayments':
        return <PendingPayments purchases={purchases.filter(p => p.paymentMethod === 'Credit' || p.paymentStatus !== 'Paid')} onUpdatePayment={handleUpdatePurchasePayment} stockAmount={stockAmount} savingsBalance={savingsBalance} bankBalance={bankBalance} />;
      case 'customers':
        return <Customers customers={customers} onAddCustomer={handleAddCustomer} products={products} onUpdateCustomerMedicines={handleUpdateCustomerMedicines} onUpdateCustomer={handleUpdateCustomer} />;
      case 'suppliers':
        return <Suppliers suppliers={suppliers} purchases={purchases} onAddSupplier={handleAddSupplier} onUpdateSupplier={handleUpdateSupplier} onDeleteSupplier={handleDeleteSupplier} />;
      case 'products':
        return <Products products={products} purchases={purchases} onAddProduct={handleAddProduct} onUpdateProduct={handleUpdateProduct} onDeleteProduct={handleDeleteProduct} />;
      case 'reports':
        return <Reports sales={sales} purchases={purchases} bills={bills} logs={historyLog} products={products} />;
      case 'users':
        return <Users users={users.map(({ password: _p, ...rest }) => rest)} onAddUser={handleAddUser} />;
      case 'history':
        return <HistoryLog logs={historyLog} />;
      case 'settings':
        return <Settings data={data} onStoragePathChanged={handleStoragePathChanged} />;
      default:
        return <Dashboard sales={sales} bills={bills} customers={customers} products={products} purchases={purchases} />;
    }
  };

  if (!currentUser) {
    return <Login onLogin={handleLogin} error={loginError} />;
  }

  return (
    <div className="bg-slate-50 min-h-screen font-sans">
      <div className="md:flex">
        <Header activeView={activeView} setActiveView={setActiveView} currentUser={currentUser} onLogout={handleLogout} />
        <main className="flex-1 p-4 md:p-6 lg:p-8 relative">
          {renderContent()}

          <button
            onClick={() => setIsChatOpen(!isChatOpen)}
            className="fixed bottom-6 right-6 p-4 bg-blue-600 text-white rounded-full shadow-2xl hover:bg-blue-700 transition-all duration-300 z-40 flex items-center justify-center group"
            title="Ask AI Assistant"
          >
            <SparklesIcon />
            <span className="max-w-0 overflow-hidden group-hover:max-w-xs group-hover:ml-2 transition-all duration-500 ease-in-out whitespace-nowrap">
              Ask AI
            </span>
          </button>

          <Chatbot
            isOpen={isChatOpen}
            onClose={() => setIsChatOpen(false)}
            sales={sales}
            purchases={purchases}
            products={products}
            customers={customers}
            suppliers={suppliers}
            bills={bills}
          />
        </main>
      </div>
    </div>
  );
};

export default App;
