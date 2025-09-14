import React, { useState } from 'react';
import { Customer, Product, Sale, Purchase, Supplier, User, LogEntry } from './types';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import Sales from './components/Sales';
import Customers from './components/Customers';
import Purchases from './components/Purchases';
import Reports from './components/Reports';
import ProductsComponent from './components/Products';
import Suppliers from './components/Suppliers';
import Users from './components/Users';
import HistoryLog from './components/HistoryLog';
import Login from './components/Login';
import { DUMMY_CUSTOMERS, DUMMY_PRODUCTS, DUMMY_SALES, DUMMY_PURCHASES, DUMMY_SUPPLIERS, DUMMY_USERS } from './data/mockData';

export type View = 'dashboard' | 'sales' | 'purchases' | 'customers' | 'reports' | 'products' | 'suppliers' | 'users' | 'history';

const App: React.FC = () => {
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
  const [users, setUsers] = useState<User[]>(DUMMY_USERS);
  const [historyLog, setHistoryLog] = useState<LogEntry[]>([]);

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
    const user = DUMMY_USERS.find(u => u.name === name && u.password === password);
    if (user) {
        const { password, ...userWithoutPassword } = user;
        setCurrentUser(userWithoutPassword);
        setLoginError(null);
        // This is a special case, we log *after* setting the user
        const newLog: LogEntry = {
            id: `LOG-${Date.now()}`,
            timestamp: new Date().toISOString(),
            userId: user.id,
            userName: user.name,
            action: 'User logged in.',
        };
        setHistoryLog(prev => [newLog, ...prev]);
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
    // Also update DUMMY_USERS so login works for the new user in this session
    DUMMY_USERS.push(newUser);
    addLogEntry(`Added new user: ${user.name}`);
  };


  const handleAddCustomer = (customer: Omit<Customer, 'id'>) => {
    const newCustomer: Customer = { ...customer, id: `CUST-${Date.now()}` };
    setCustomers(prev => [...prev, newCustomer]);
    addLogEntry(`Added customer: ${customer.name}`);
  };

  const handleAddSupplier = (supplier: Omit<Supplier, 'id'>) => {
    const newSupplier: Supplier = { ...supplier, id: `SUP-${Date.now()}` };
    setSuppliers(prev => [...prev, newSupplier]);
    addLogEntry(`Added supplier: ${supplier.name}`);
  };

  const handleAddProduct = (product: Omit<Product, 'id'>) => {
    const newProduct: Product = { ...product, id: `PROD-${Date.now()}` };
    setProducts(prev => [newProduct, ...prev]);
    addLogEntry(`Added product: ${product.name}`);
  };

  const handleAddSale = (sale: Sale) => {
    setSales(prev => [sale, ...prev]);
    // Update product stock
    setProducts(prevProducts => {
      const updatedProducts = [...prevProducts];
      sale.items.forEach(item => {
        const productIndex = updatedProducts.findIndex(p => p.id === item.productId);
        if (productIndex !== -1) {
          updatedProducts[productIndex].stock -= item.quantity;
        }
      });
      return updatedProducts;
    });
    addLogEntry(`Created sale ${sale.id} for ${sale.customerName} (Total: ₹${sale.total.toFixed(2)})`);
  };

  const handleAddPurchase = (purchase: Purchase) => {
    setPurchases(prev => [purchase, ...prev]);
     // Update product stock
    setProducts(prevProducts => {
      const productMap = new Map(prevProducts.map(p => [p.id, { ...p }]));
      purchase.items.forEach(item => {
          const product = productMap.get(item.productId);
          if (product) {
              product.stock += item.quantity;
          }
      });
      return Array.from(productMap.values());
    });
    addLogEntry(`Created purchase ${purchase.id} from ${purchase.supplierName} (Total: ₹${purchase.total.toFixed(2)})`);
  }

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard sales={sales} customers={customers} products={products} />;
      case 'sales':
        return <Sales sales={sales} customers={customers} products={products} onAddSale={handleAddSale} onAddCustomer={handleAddCustomer} />;
      case 'purchases':
        return <Purchases onAddPurchase={handleAddPurchase} products={products} suppliers={suppliers} onAddSupplier={handleAddSupplier} />;
      case 'customers':
        return <Customers customers={customers} onAddCustomer={handleAddCustomer} />;
      case 'suppliers':
        return <Suppliers suppliers={suppliers} onAddSupplier={handleAddSupplier} />;
      case 'products':
        return <ProductsComponent products={products} onAddProduct={handleAddProduct} />;
      case 'reports':
        return <Reports sales={sales} />;
      case 'users':
        return <Users users={users.map(({password, ...rest}) => rest)} onAddUser={handleAddUser} />;
      case 'history':
        return <HistoryLog logs={historyLog} />;
      default:
        return <Dashboard sales={sales} customers={customers} products={products} />;
    }
  };

  if (!currentUser) {
    return <Login onLogin={handleLogin} error={loginError} />;
  }

  return (
    <div className="bg-slate-50 min-h-screen font-sans">
       <div className="md:flex">
        <Header activeView={activeView} setActiveView={setActiveView} currentUser={currentUser} onLogout={handleLogout} />
        <main className="flex-1 p-4 md:p-6 lg:p-8">
           <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-900 p-4 mb-6 rounded-md shadow-sm" role="alert">
            <p className="font-bold">Demonstration Only</p>
            <p>All data is stored in-memory and will be lost upon refreshing the page.</p>
          </div>
          {renderContent()}
        </main>
       </div>
    </div>
  );
};

export default App;