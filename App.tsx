import React, { useState } from 'react';
import { Customer, Product, Sale, Purchase, Supplier } from './types';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import Sales from './components/Sales';
import Customers from './components/Customers';
import Purchases from './components/Purchases';
import Reports from './components/Reports';
import ProductsComponent from './components/Products';
import Suppliers from './components/Suppliers';
import { DUMMY_CUSTOMERS, DUMMY_PRODUCTS, DUMMY_SALES, DUMMY_PURCHASES, DUMMY_SUPPLIERS } from './data/mockData';

export type View = 'dashboard' | 'sales' | 'purchases' | 'customers' | 'reports' | 'products' | 'suppliers';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [customers, setCustomers] = useState<Customer[]>(DUMMY_CUSTOMERS);
  const [products, setProducts] = useState<Product[]>(DUMMY_PRODUCTS);
  const [sales, setSales] = useState<Sale[]>(DUMMY_SALES);
  const [purchases, setPurchases] = useState<Purchase[]>(DUMMY_PURCHASES);
  const [suppliers, setSuppliers] = useState<Supplier[]>(DUMMY_SUPPLIERS);

  const handleAddCustomer = (customer: Omit<Customer, 'id'>) => {
    const newCustomer: Customer = { ...customer, id: `CUST-${Date.now()}` };
    setCustomers(prev => [...prev, newCustomer]);
  };

  const handleAddSupplier = (supplier: Omit<Supplier, 'id'>) => {
    const newSupplier: Supplier = { ...supplier, id: `SUP-${Date.now()}` };
    setSuppliers(prev => [...prev, newSupplier]);
  };

  const handleAddProduct = (product: Omit<Product, 'id'>) => {
    const newProduct: Product = { ...product, id: `PROD-${Date.now()}` };
    setProducts(prev => [newProduct, ...prev]);
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
  }

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard sales={sales} customers={customers} products={products} />;
      case 'sales':
        return <Sales customers={customers} products={products} onAddSale={handleAddSale} onAddCustomer={handleAddCustomer} />;
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
      default:
        return <Dashboard sales={sales} customers={customers} products={products} />;
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen font-sans">
       <div className="md:flex">
        <Header activeView={activeView} setActiveView={setActiveView} />
        <main className="flex-1 p-4 md:p-6 lg:p-8">
           <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6 rounded-md shadow-sm" role="alert">
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