import React, { useState, useMemo, useEffect } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, writeBatch, increment } from 'firebase/firestore';
import { db } from './firebase';
import { useCollection } from './hooks/useFirestore';
import { Customer, Product, Sale, Purchase, Supplier, User, LogEntry, View, PaymentRecord, Bill, CustomerMedicine, MoneyTransaction } from './types';
import { AppData } from './lib/storage';
import { getMirrorStatus, reconnectMirrorFolder, writeMirror } from './lib/localMirror';
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

const SETUP_FLAG = 'hajara_setup_done';

const App = () => {
  // First-run setup (choose local backup folder or skip → cloud only)
  const [setupDone, setSetupDone] = useState<boolean>(() => {
    try {
      return localStorage.getItem(SETUP_FLAG) === '1';
    } catch {
      return true;
    }
  });

  // Auth state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [showWelcome, setShowWelcome] = useState(false);

  // App state — real-time from Firestore
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [customers, customersLoading] = useCollection<Customer>('customers');
  const [products, productsLoading] = useCollection<Product>('products');
  const [sales, salesLoading] = useCollection<Sale>('sales');
  const [purchases, purchasesLoading] = useCollection<Purchase>('purchases');
  const [suppliers, suppliersLoading] = useCollection<Supplier>('suppliers');
  const [users, usersLoading] = useCollection<User>('users');
  const [historyLog] = useCollection<LogEntry>('historyLog');
  const [bills, billsLoading] = useCollection<Bill>('bills');
  const [moneyTransactions] = useCollection<MoneyTransaction>('moneyTransactions');

  const [isChatOpen, setIsChatOpen] = useState(false);

  // Local-backup permission state: shows a "resume" banner if a folder was
  // chosen but the browser dropped write permission (e.g. after a restart).
  const [mirrorPaused, setMirrorPaused] = useState(false);
  const [mirrorDismissed, setMirrorDismissed] = useState(false);

  const dataLoading =
    customersLoading || productsLoading || salesLoading || purchasesLoading ||
    suppliersLoading || usersLoading || billsLoading;

  // Full snapshot used for the local-folder mirror and exports.
  const data: AppData = useMemo(() => ({
    customers, products, sales, purchases, suppliers, users, historyLog, bills, moneyTransactions,
  }), [customers, products, sales, purchases, suppliers, users, historyLog, bills, moneyTransactions]);

  // Mirror every change to the local backup file (debounced). If a folder was
  // chosen but write permission lapsed, surface the "resume" banner instead.
  useEffect(() => {
    if (dataLoading) return;
    const t = setTimeout(async () => {
      const st = await getMirrorStatus();
      if (st.granted) {
        setMirrorPaused(false);
        await writeMirror(data).catch(() => {});
      } else if (st.hasFolder) {
        setMirrorPaused(true);
      }
    }, 600);
    return () => clearTimeout(t);
  }, [data, dataLoading]);

  const handleResumeBackup = async () => {
    // requestPermission needs a user gesture — this runs from the button click.
    const name = await reconnectMirrorFolder(true).catch(() => null);
    if (name) {
      setMirrorPaused(false);
      await writeMirror(data).catch(() => {});
    }
  };

  // Seed default user if the Firestore users collection is empty.
  useEffect(() => {
    if (!usersLoading && users.length === 0) {
      addDoc(collection(db, 'users'), { name: 'thalif', password: 'thalif' });
    }
  }, [usersLoading, users.length]);

  const completeSetup = () => {
    try { localStorage.setItem(SETUP_FLAG, '1'); } catch { /* ignore */ }
    setSetupDone(true);
  };

  const addLogEntry = async (action: string, user: User | null = currentUser) => {
    if (!user) return;
    await addDoc(collection(db, 'historyLog'), {
      timestamp: new Date().toISOString(),
      userId: user.id,
      userName: user.name,
      action,
    });
  };

  const handleLogin = (name: string, password: string) => {
    const user = users.find(u => u.name === name && u.password === password);
    if (user) {
      const { password: _pw, ...userWithoutPassword } = user;
      setCurrentUser(userWithoutPassword);
      setLoginError(null);
      setShowWelcome(true);
      addLogEntry('User logged in.', userWithoutPassword);
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
    await addDoc(collection(db, 'users'), { name: user.name, password: user.password });
    addLogEntry(`Added new user: ${user.name}`);
  };

  const handleAddCustomer = async (customer: Omit<Customer, 'id'>) => {
    await addDoc(collection(db, 'customers'), customer);
    addLogEntry(`Added customer: ${customer.name}`);
  };

  const handleUpdateCustomerMedicines = async (customerId: string, medicines: CustomerMedicine[]) => {
    await updateDoc(doc(db, 'customers', customerId), { medicines });
    const customerName = customers.find(c => c.id === customerId)?.name || 'Unknown';
    addLogEntry(`Updated medicines for customer: ${customerName}`);
  };

  const handleUpdateCustomer = async (updatedCustomer: Customer) => {
    const { id, ...data } = updatedCustomer;
    await updateDoc(doc(db, 'customers', id), data);
    addLogEntry(`Updated details for customer: ${updatedCustomer.name}`);
  };

  // Supplier CRUD
  const handleAddSupplier = async (supplier: Omit<Supplier, 'id'>) => {
    await addDoc(collection(db, 'suppliers'), supplier);
    addLogEntry(`Added supplier: ${supplier.name}`);
  };

  const handleUpdateSupplier = async (updatedSupplier: Supplier) => {
    const { id, ...data } = updatedSupplier;
    await updateDoc(doc(db, 'suppliers', id), data);
    addLogEntry(`Updated supplier: ${updatedSupplier.name}`);
  };

  const handleDeleteSupplier = async (supplierId: string) => {
    const supplierName = suppliers.find(s => s.id === supplierId)?.name || 'Unknown';
    await deleteDoc(doc(db, 'suppliers', supplierId));
    addLogEntry(`Deleted supplier: ${supplierName}`);
  };

  // Product CRUD
  const handleAddProduct = async (product: Omit<Product, 'id'>): Promise<Product> => {
    const docRef = await addDoc(collection(db, 'products'), product);
    addLogEntry(`Added product: ${product.name}`);
    return { ...product, id: docRef.id };
  };

  const handleUpdateProduct = async (updatedProduct: Product) => {
    const { id, ...data } = updatedProduct;
    await updateDoc(doc(db, 'products', id), data);
    addLogEntry(`Updated product: ${updatedProduct.name}`);
  };

  const handleDeleteProduct = async (productId: string) => {
    const productName = products.find(p => p.id === productId)?.name || 'Unknown';
    await deleteDoc(doc(db, 'products', productId));
    addLogEntry(`Deleted product: ${productName}`);
  };

  // Sale Handlers
  const handleAddSale = async (sale: Omit<Sale, 'id'>) => {
    const docRef = await addDoc(collection(db, 'sales'), sale);
    addLogEntry(`Created sale ${docRef.id} (Total: ₹${sale.amount.toFixed(2)})`);
  };

  const handleUpdateSale = async (updatedSale: Sale) => {
    const { id, ...data } = updatedSale;
    await updateDoc(doc(db, 'sales', id), data);
    addLogEntry(`Updated sale ${updatedSale.id}`);
  };

  const handleDeleteSale = async (saleId: string) => {
    await deleteDoc(doc(db, 'sales', saleId));
    addLogEntry(`Deleted sale ${saleId}`);
  };

  // Purchase Handlers
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
      id: `PAY-INIT-${Date.now()}`,
      date: purchase.date,
      amount: paidAmount,
      source: sourceMap[purchase.paymentMethod] || 'Stock',
    }] : [];

    const newPurchaseData = {
      ...purchase,
      paymentStatus: status,
      paidAmount,
      paymentHistory,
    };

    const batch = writeBatch(db);
    const purchaseRef = doc(collection(db, 'purchases'));
    batch.set(purchaseRef, newPurchaseData);

    if (newPurchaseData.items && newPurchaseData.items.length > 0) {
      for (const item of newPurchaseData.items) {
        if (item.productId) {
          const productRef = doc(db, 'products', item.productId);
          batch.update(productRef, { stock: increment(item.quantity), mrp: item.mrp });
        }
      }
    }

    await batch.commit();
    addLogEntry(`Created purchase from ${newPurchaseData.supplierName} (Total: ₹${total.toFixed(2)}, Paid: ₹${paidAmount.toFixed(2)})`);
  };

  const handleDeletePurchase = async (purchaseId: string) => {
    const purchaseToDelete = purchases.find(p => p.id === purchaseId);
    if (!purchaseToDelete) return;

    const batch = writeBatch(db);
    batch.delete(doc(db, 'purchases', purchaseId));

    if (purchaseToDelete.items && purchaseToDelete.items.length > 0) {
      for (const item of purchaseToDelete.items) {
        if (item.productId) {
          const productRef = doc(db, 'products', item.productId);
          batch.update(productRef, { stock: increment(-item.quantity) });
        }
      }
    }

    await batch.commit();
    addLogEntry(`Deleted purchase ${purchaseId}`);
  };

  const handleUpdatePurchasePayment = async (purchaseId: string, paymentRecord: Omit<PaymentRecord, 'id'>) => {
    const purchase = purchases.find(p => p.id === purchaseId);
    if (!purchase) return;

    const newPaidAmount = purchase.paidAmount + paymentRecord.amount;
    let newStatus: 'Paid' | 'Partially Paid' | 'Unpaid' = 'Unpaid';
    if (newPaidAmount >= purchase.total) newStatus = 'Paid';
    else if (newPaidAmount > 0) newStatus = 'Partially Paid';

    const newPaymentRecord = { ...paymentRecord, id: `PAY-${Date.now()}` };

    await updateDoc(doc(db, 'purchases', purchaseId), {
      paidAmount: newPaidAmount,
      paymentStatus: newStatus,
      paymentHistory: [...purchase.paymentHistory, newPaymentRecord],
    });

    addLogEntry(`Recorded payment of ₹${paymentRecord.amount.toFixed(2)} from ${paymentRecord.source} for purchase ${purchase.id}.`);
  };

  const handleAddBill = async (bill: Omit<Bill, 'id'>) => {
    const batch = writeBatch(db);
    const billRef = doc(collection(db, 'bills'));
    batch.set(billRef, bill);

    bill.items.forEach(item => {
      if (item.productId) {
        const productRef = doc(db, 'products', item.productId);
        batch.update(productRef, { stock: increment(-item.quantity) });
      }
    });

    await batch.commit();
    addLogEntry(`Created bill for ${bill.patientName} (Total: ₹${bill.grandTotal.toFixed(2)})`);
  };

  const handleUpdateBill = async (updatedBill: Bill) => {
    const { id, ...data } = updatedBill;
    await updateDoc(doc(db, 'bills', id), data);
    addLogEntry(`Updated bill ${updatedBill.id}`);
  };

  const handleAddMoneyTransaction = async (tx: Omit<MoneyTransaction, 'id'>) => {
    await addDoc(collection(db, 'moneyTransactions'), tx);
    addLogEntry(`${tx.category} of ₹${tx.amount.toFixed(2)} in ${tx.type}`);
  };

  const handleUpdateMoneyTransaction = async (updatedTx: MoneyTransaction) => {
    const { id, ...data } = updatedTx;
    await updateDoc(doc(db, 'moneyTransactions', id), data);
    addLogEntry(`Updated ${updatedTx.category} entry ${updatedTx.id}`);
  };

  const handleDeleteMoneyTransaction = async (txId: string) => {
    await deleteDoc(doc(db, 'moneyTransactions', txId));
    addLogEntry(`Deleted money transaction ${txId}`);
  };

  const handleTransfer = async (from: 'Stock' | 'Bank' | 'Savings', to: 'Stock' | 'Bank' | 'Savings', amount: number) => {
    const ts = new Date().toISOString();
    const batch = writeBatch(db);
    const txFromRef = doc(collection(db, 'moneyTransactions'));
    const txToRef = doc(collection(db, 'moneyTransactions'));

    batch.set(txFromRef, { date: ts, amount: -amount, type: from, category: 'Transfer', description: `Transfer to ${to}` });
    batch.set(txToRef, { date: ts, amount, type: to, category: 'Transfer', description: `Transfer from ${from}` });

    await batch.commit();
    addLogEntry(`Transferred ₹${amount} from ${from} to ${to}`);
  };

  const stockAmount = useMemo(() => {
    const totalSaleCash = sales.reduce((sum, sale) => sum + sale.cash, 0);
    const manualAdjustments = moneyTransactions.filter(t => t.type === 'Stock').reduce((sum, t) => sum + t.amount, 0);
    const purchasePaymentsFromStock = purchases.reduce((sum, purchase) =>
      sum + purchase.paymentHistory.filter(pay => pay.source === 'Stock').reduce((paySum, pay) => paySum + pay.amount, 0), 0);
    return totalSaleCash + manualAdjustments - purchasePaymentsFromStock;
  }, [sales, moneyTransactions, purchases]);

  const savingsBalance = useMemo(() => {
    const totalSaleSavings = sales.reduce((sum, sale) => sum + sale.savings, 0);
    const manualAdjustments = moneyTransactions.filter(t => t.type === 'Savings').reduce((sum, t) => sum + t.amount, 0);
    const purchasePaymentsFromSavings = purchases.reduce((sum, purchase) =>
      sum + purchase.paymentHistory.filter(pay => pay.source === 'Savings').reduce((paySum, pay) => paySum + pay.amount, 0), 0);
    return totalSaleSavings + manualAdjustments - purchasePaymentsFromSavings;
  }, [sales, moneyTransactions, purchases]);

  const bankBalance = useMemo(() => {
    const totalBankFromSales = sales.reduce((sum, sale) => sum + sale.bank, 0);
    const totalBankFromBills = bills.reduce((sum, bill) => sum + bill.grandTotal, 0);
    const manualAdjustments = moneyTransactions.filter(t => t.type === 'Bank').reduce((sum, t) => sum + t.amount, 0);
    const purchasePaymentsFromBank = purchases.reduce((sum, purchase) =>
      sum + purchase.paymentHistory.filter(pay => pay.source === 'Bank').reduce((paySum, pay) => paySum + pay.amount, 0), 0);
    return totalBankFromSales + totalBankFromBills + manualAdjustments - purchasePaymentsFromBank;
  }, [sales, bills, moneyTransactions, purchases]);

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
        return <Settings data={data} />;
      default:
        return <Dashboard sales={sales} bills={bills} customers={customers} products={products} purchases={purchases} />;
    }
  };

  if (!setupDone) {
    return <SetupWizard onComplete={completeSetup} />;
  }

  if (!currentUser) {
    return <Login onLogin={handleLogin} error={loginError} />;
  }

  if (dataLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading data…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen font-sans">
      <div className="md:flex">
        <Header activeView={activeView} setActiveView={setActiveView} currentUser={currentUser} onLogout={handleLogout} />
        <main className="flex-1 p-4 md:p-6 lg:p-8 relative">
          {mirrorPaused && !mirrorDismissed && (
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg px-4 py-3">
              <span className="text-sm font-medium">
                ⚠️ Local backup is paused — the browser needs permission to write to your folder again. (Your cloud data is unaffected.)
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleResumeBackup}
                  className="bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold py-1.5 px-3 rounded-lg"
                >
                  Resume Backup
                </button>
                <button
                  onClick={() => setMirrorDismissed(true)}
                  className="text-amber-700 hover:text-amber-900 text-sm font-medium py-1.5 px-2"
                  title="Hide until next time"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

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

      {showWelcome && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-green-100 rounded-full mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">Hello, {currentUser.name}!</h2>
            <p className="text-gray-600 mb-5">You are logged in.</p>
            <button
              onClick={() => setShowWelcome(false)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg"
            >
              Continue
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
