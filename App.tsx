
import React, { useState, useMemo } from 'react';
import { Customer, Product, Sale, Purchase, Supplier, User, LogEntry, View, PaymentRecord, Bill, CustomerMedicine, MoneyTransaction } from './types';
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
import { SparklesIcon } from './components/icons/Icons';
import { DUMMY_CUSTOMERS, DUMMY_PRODUCTS, DUMMY_SALES, DUMMY_PURCHASES, DUMMY_SUPPLIERS, DUMMY_USERS } from './data/mockData';

const App = () => {
  // Auth state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);

  // App state
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [customers, setCustomers] = useState<Customer[]>(DUMMY_CUSTOMERS);
  const [products, setProducts] = useState<Product[]>(DUMMY_PRODUCTS);
  const [sales, setSales] = useState<Sale[]>(DUMMY_SALES);
  const [purchases, setPurchases] = useState<Purchase[]>(DUMMY_PURCHASES);
  const [suppliers, setSuppliers] = useState<Supplier[]>(DUMMY_SUPPLIERS);
  const [users, setUsers] = useState<User[]>(() => JSON.parse(JSON.stringify(DUMMY_USERS)));
  const [historyLog, setHistoryLog] = useState<LogEntry[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [moneyTransactions, setMoneyTransactions] = useState<MoneyTransaction[]>([]);
  
  // Chatbot State
  const [isChatOpen, setIsChatOpen] = useState(false);

  const addLogEntry = (action: string) => {
    if (!currentUser) return;
    const newLog: LogEntry = {
      id: `LOG-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: currentUser.id,
      userName: currentUser.name,
      action: action,
    };
    setHistoryLog(prev => [newLog, ...prev]);
  };

  const handleLogin = (name: string, password: string) => {
    const user = users.find(u => u.name === name && u.password === password);
    if (user) {
        const { password, ...userWithoutPassword } = user;
        setCurrentUser(userWithoutPassword);
        setLoginError(null);
        addLogEntry('User logged in.');
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

  const handleAddUser = (user: Omit<User, 'id' | 'password'> & { password?: string }) => {
    const newUser: User = { ...user, id: `USER-${Date.now()}`, password: user.password };
    setUsers(prev => [...prev, newUser]);
    addLogEntry(`Added new user: ${user.name}`);
  };

  const handleAddCustomer = (customer: Omit<Customer, 'id'>) => {
    const newCustomer: Customer = { ...customer, id: `CUST-${Date.now()}`};
    setCustomers(prev => [...prev, newCustomer]);
    addLogEntry(`Added customer: ${customer.name}`);
  };

  const handleUpdateCustomerMedicines = (customerId: string, medicines: CustomerMedicine[]) => {
    setCustomers(prev => prev.map(c => 
      c.id === customerId ? { ...c, medicines: medicines } : c
    ));
    const customerName = customers.find(c => c.id === customerId)?.name || 'Unknown';
    addLogEntry(`Updated medicines for customer: ${customerName}`);
  };

  const handleUpdateCustomer = (updatedCustomer: Customer) => {
    setCustomers(prev => prev.map(c => c.id === updatedCustomer.id ? updatedCustomer : c));
    addLogEntry(`Updated details for customer: ${updatedCustomer.name}`);
  }

  // Supplier CRUD
  const handleAddSupplier = (supplier: Omit<Supplier, 'id'>) => {
    const newSupplier: Supplier = { ...supplier, id: `SUP-${Date.now()}` };
    setSuppliers(prev => [...prev, newSupplier]);
    addLogEntry(`Added supplier: ${supplier.name}`);
  };
  
  const handleUpdateSupplier = (updatedSupplier: Supplier) => {
    setSuppliers(prev => prev.map(s => s.id === updatedSupplier.id ? updatedSupplier : s));
    addLogEntry(`Updated supplier: ${updatedSupplier.name}`);
  };

  const handleDeleteSupplier = (supplierId: string) => {
    const supplierName = suppliers.find(s => s.id === supplierId)?.name || 'Unknown';
    setSuppliers(prev => prev.filter(s => s.id !== supplierId));
    addLogEntry(`Deleted supplier: ${supplierName}`);
  };

  // Product CRUD
  const handleAddProduct = (product: Omit<Product, 'id'>): Product => {
    const newProduct: Product = { ...product, id: `PROD-${Date.now()}` };
    setProducts(prev => [newProduct, ...prev]);
    addLogEntry(`Added product: ${product.name}`);
    return newProduct;
  };
  
  const handleUpdateProduct = (updatedProduct: Product) => {
    setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
    addLogEntry(`Updated product: ${updatedProduct.name}`);
  };

  const handleDeleteProduct = (productId: string) => {
    const productName = products.find(p => p.id === productId)?.name || 'Unknown';
    setProducts(prev => prev.filter(p => p.id !== productId));
    addLogEntry(`Deleted product: ${productName}`);
  };

  // Sale Handlers
  const handleAddSale = (sale: Omit<Sale, 'id'>) => {
    const newSale = { ...sale, id: `SALE-${Date.now()}` };
    setSales(prev => [newSale, ...prev]);
    addLogEntry(`Created sale ${newSale.id} (Total: ₹${newSale.amount.toFixed(2)})`);
  };

  const handleUpdateSale = (updatedSale: Sale) => {
    setSales(prev => prev.map(s => s.id === updatedSale.id ? updatedSale : s));
    addLogEntry(`Updated sale ${updatedSale.id}`);
  };

  const handleDeleteSale = (saleId: string) => {
    setSales(prev => prev.filter(s => s.id !== saleId));
    addLogEntry(`Deleted sale ${saleId}`);
  };

  // Purchase Handlers
  const handleAddPurchase = (purchaseData: any) => {
    const { initialPaidAmount, ...purchase } = purchaseData;
    
    // Status Logic for Purchase Entry
    const total = purchase.total;
    const paidAmount = initialPaidAmount !== undefined ? (parseFloat(initialPaidAmount) || 0) : (purchase.paymentMethod === 'Credit' ? 0 : total);
    
    let status: 'Paid' | 'Partially Paid' | 'Unpaid' = 'Unpaid';
    if (paidAmount >= total) status = 'Paid';
    else if (paidAmount > 0) status = 'Partially Paid';
    else status = 'Unpaid';

    const sourceMap: Record<string, 'Stock' | 'Bank' | 'Savings'> = {
      'Cash': 'Stock',
      'Bank Transfer': 'Bank',
      'Savings': 'Savings'
    };

    const newPurchase: Purchase = {
      ...purchase,
      id: `PUR-${Date.now()}`,
      paymentStatus: status,
      paidAmount: paidAmount,
      paymentHistory: paidAmount > 0 ? [{
        id: `PAY-INIT-${Date.now()}`,
        date: purchase.date,
        amount: paidAmount,
        source: sourceMap[purchase.paymentMethod] || 'Stock'
      }] : [],
    };
    
    setPurchases(prev => [newPurchase, ...prev]);
    
    // Update stock if items exist
    if (newPurchase.items && newPurchase.items.length > 0) {
        setProducts(prevProducts => {
          const productMap = new Map<string, Product>(prevProducts.map(p => [p.id, { ...p }]));
          newPurchase.items.forEach(item => {
              const product = productMap.get(item.productId);
              if (product) {
                  product.stock += item.quantity;
                  product.mrp = item.mrp;
              }
          });
          return Array.from(productMap.values());
        });
    }

    addLogEntry(`Created purchase ${newPurchase.id} from ${newPurchase.supplierName} (Total: ₹${newPurchase.total.toFixed(2)}, Paid: ₹${paidAmount.toFixed(2)})`);
  };

  const handleDeletePurchase = (purchaseId: string) => {
    const purchaseToDelete = purchases.find(p => p.id === purchaseId);
    if (!purchaseToDelete) return;

    if (purchaseToDelete.items && purchaseToDelete.items.length > 0) {
        setProducts(prevProducts => {
            const productMap = new Map<string, Product>(prevProducts.map(p => [p.id, { ...p }]));
            purchaseToDelete.items.forEach(item => {
                const product = productMap.get(item.productId);
                if (product) {
                    product.stock -= item.quantity;
                }
            });
            return Array.from(productMap.values());
        });
    }
    
    setPurchases(prev => prev.filter(p => p.id !== purchaseId));
    addLogEntry(`Deleted purchase ${purchaseId}`);
  };

  const handleUpdatePurchasePayment = (purchaseId: string, paymentRecord: Omit<PaymentRecord, 'id'>) => {
    setPurchases(prev => prev.map(p => {
      if (p.id === purchaseId) {
        const newPaidAmount = p.paidAmount + paymentRecord.amount;
        // Correct status logic for installments
        let newStatus: 'Paid' | 'Partially Paid' | 'Unpaid' = 'Unpaid';
        if (newPaidAmount >= p.total) newStatus = 'Paid';
        else if (newPaidAmount > 0) newStatus = 'Partially Paid';
        else newStatus = 'Unpaid';
        
        const newHistory = [...p.paymentHistory, { ...paymentRecord, id: `PAY-${Date.now()}` }];
        
        addLogEntry(`Recorded payment of ₹${paymentRecord.amount.toFixed(2)} from ${paymentRecord.source} for purchase ${p.id}.`);

        return {
          ...p,
          paidAmount: newPaidAmount,
          paymentStatus: newStatus,
          paymentHistory: newHistory,
        };
      }
      return p;
    }));
  };

  const handleAddBill = (bill: Omit<Bill, 'id'>) => {
    const newBill: Bill = { ...bill, id: `BILL-${Date.now()}` };
    setBills(prev => [newBill, ...prev]);
    setProducts(prevProducts => {
      const productMap = new Map<string, Product>(prevProducts.map(p => [p.id, { ...p }]));
      newBill.items.forEach(item => {
          const product = productMap.get(item.productId);
          if (product) {
              product.stock -= item.quantity;
          }
      });
      return Array.from(productMap.values());
    });
    addLogEntry(`Created bill ${newBill.id} for ${newBill.patientName} (Total: ₹${newBill.grandTotal.toFixed(2)})`);
  };

  const handleUpdateBill = (updatedBill: Bill) => {
    setBills(prev => prev.map(b => b.id === updatedBill.id ? updatedBill : b));
    addLogEntry(`Updated bill ${updatedBill.id}`);
  };

  const handleAddMoneyTransaction = (tx: Omit<MoneyTransaction, 'id'>) => {
    const newTx: MoneyTransaction = { ...tx, id: `TX-${Date.now()}` };
    setMoneyTransactions(prev => [newTx, ...prev]);
    addLogEntry(`${tx.category} of ₹${tx.amount.toFixed(2)} in ${tx.type}`);
  };

  const handleUpdateMoneyTransaction = (updatedTx: MoneyTransaction) => {
    setMoneyTransactions(prev => prev.map(tx => tx.id === updatedTx.id ? updatedTx : tx));
    addLogEntry(`Updated ${updatedTx.category} entry ${updatedTx.id}`);
  };

  const handleDeleteMoneyTransaction = (txId: string) => {
    setMoneyTransactions(prev => prev.filter(tx => tx.id !== txId));
    addLogEntry(`Deleted money transaction ${txId}`);
  };

  const handleTransfer = (from: 'Stock' | 'Bank' | 'Savings', to: 'Stock' | 'Bank' | 'Savings', amount: number) => {
    const ts = new Date().toISOString();
    const txIdBase = Date.now();
    const txFrom: MoneyTransaction = {
      id: `TX-${txIdBase}-OUT`,
      date: ts,
      amount: -amount,
      type: from,
      category: 'Transfer',
      description: `Transfer to ${to}`
    };
    const txTo: MoneyTransaction = {
      id: `TX-${txIdBase}-IN`,
      date: ts,
      amount: amount,
      type: to,
      category: 'Transfer',
      description: `Transfer from ${from}`
    };
    setMoneyTransactions(prev => [txFrom, txTo, ...prev]);
    addLogEntry(`Transferred ₹${amount} from ${from} to ${to}`);
  };

  const stockAmount = useMemo(() => {
    const totalSaleCash = sales.reduce((sum, sale) => sum + sale.cash, 0);
    const manualAdjustments = moneyTransactions.filter(t => t.type === 'Stock').reduce((sum, t) => sum + t.amount, 0);
    const purchasePaymentsFromStock = purchases.reduce((sum, purchase) => {
       return sum + purchase.paymentHistory.filter(pay => pay.source === 'Stock').reduce((paySum, pay) => paySum + pay.amount, 0);
    }, 0);
    return totalSaleCash + manualAdjustments - purchasePaymentsFromStock;
  }, [sales, moneyTransactions, purchases]);

  const savingsBalance = useMemo(() => {
    const totalSaleSavings = sales.reduce((sum, sale) => sum + sale.savings, 0);
    const manualAdjustments = moneyTransactions.filter(t => t.type === 'Savings').reduce((sum, t) => sum + t.amount, 0);
    const purchasePaymentsFromSavings = purchases.reduce((sum, purchase) => {
        return sum + purchase.paymentHistory.filter(pay => pay.source === 'Savings').reduce((paySum, pay) => paySum + pay.amount, 0);
    }, 0);
    return totalSaleSavings + manualAdjustments - purchasePaymentsFromSavings;
  }, [sales, moneyTransactions, purchases]);

  const bankBalance = useMemo(() => {
    const totalBankFromSales = sales.reduce((sum, sale) => sum + sale.bank, 0);
    const totalBankFromBills = bills.reduce((sum, bill) => sum + bill.grandTotal, 0);
    const manualAdjustments = moneyTransactions.filter(t => t.type === 'Bank').reduce((sum, t) => sum + t.amount, 0);
    const purchasePaymentsFromBank = purchases.reduce((sum, purchase) => {
        return sum + purchase.paymentHistory.filter(pay => pay.source === 'Bank').reduce((paySum, pay) => paySum + pay.amount, 0);
    }, 0);
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
        return <Users users={users.map(({password, ...rest}) => rest)} onAddUser={handleAddUser} />;
      case 'history':
        return <HistoryLog logs={historyLog} />;
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
