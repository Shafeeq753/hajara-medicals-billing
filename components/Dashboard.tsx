import React, { useMemo } from 'react';
import { Sale, Customer, Product, Purchase, PurchaseItem } from '../types';
import { CurrencyIcon, UsersIcon, WarningIcon, BoxIcon, CalendarIcon } from './icons/Icons';

interface DashboardProps {
  sales: Sale[];
  customers: Customer[];
  products: Product[];
  purchases: Purchase[];
}

const StatCard = ({ title, value, icon, color }: { title: string; value: string | number; icon: React.ReactNode; color: string }) => (
  <div className="bg-white p-6 rounded-xl shadow-lg flex items-center space-x-4 transition-transform transform hover:-translate-y-1">
    <div className={`p-3 rounded-full ${color}`}>
      {icon}
    </div>
    <div>
      <p className="text-sm font-medium text-black">{title}</p>
      <p className="text-2xl font-bold text-black">{value}</p>
    </div>
  </div>
);

const SalesChart = ({ sales }: { sales: Sale[] }) => {
    const { salesByDay, dayLabels, maxSale } = useMemo(() => {
        const today = new Date();
        const salesByDay: number[] = Array(7).fill(0);
        const days = Array(7).fill(0).map((_, i) => {
            const d = new Date();
            d.setDate(today.getDate() - i);
            return d.toISOString().split('T')[0];
        }).reverse();

        sales.forEach(sale => {
            const saleDate = new Date(sale.date).toISOString().split('T')[0];
            const index = days.indexOf(saleDate);
            if (index !== -1) {
                salesByDay[index] += sale.amount;
            }
        });

        const dayLabels = days.map(dStr => new Date(dStr + 'T00:00:00Z').toLocaleDateString('en-US', { weekday: 'short' }));
        const maxSale = Math.max(...salesByDay, 1); // Avoid division by zero

        return { salesByDay, dayLabels, maxSale };
    }, [sales]);

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg">
            <h3 className="text-xl font-semibold text-black mb-4">Sales (Last 7 Days)</h3>
            <div className="flex justify-around items-end h-64 border-l border-b border-gray-200 pl-4 pb-4">
                {salesByDay.map((amount, index) => (
                    <div key={index} className="flex flex-col items-center w-1/8">
                         <div className="text-xs font-bold text-black">₹{amount.toFixed(0)}</div>
                        <div
                            className="w-8 md:w-12 bg-blue-500 hover:bg-blue-600 rounded-t-md transition-all duration-300"
                            style={{ height: `${(amount / maxSale) * 100}%` }}
                            title={`₹${amount.toFixed(2)}`}
                        ></div>
                        <div className="mt-2 text-sm text-black">{dayLabels[index]}</div>
                    </div>
                ))}
            </div>
        </div>
    );
};


const Dashboard = ({ sales, customers, products, purchases }: DashboardProps) => {
  const totalRevenue = sales.reduce((sum, sale) => sum + sale.amount, 0);
  const totalCustomers = customers.length;
  const lowStockCount = products.filter(p => p.stock < 50).length;

  const lowStockProducts = useMemo(() => products.filter(p => p.stock < 50).sort((a,b) => a.stock - b.stock), [products]);

  const nearingExpiryProducts = useMemo(() => {
    const today = new Date();
    const expiryLimit = new Date();
    expiryLimit.setDate(today.getDate() + 90);

    const productMap = new Map(products.map(p => [p.id, p]));
    const expiringBatches: PurchaseItem[] = [];

    purchases.forEach(purchase => {
      purchase.items.forEach(item => {
        const expiryDate = new Date(item.expiryDate);
        const product = productMap.get(item.productId);
        
        // Only consider batches for products that are currently in stock
        if (product && product.stock > 0 && expiryDate >= today && expiryDate <= expiryLimit) {
          expiringBatches.push(item);
        }
      });
    });
    
    // Sort by expiry date, soonest first
    return expiringBatches.sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());
  }, [products, purchases]);


  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold text-black">Dashboard</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard 
          title="Total Revenue" 
          value={`₹${totalRevenue.toFixed(2)}`} 
          icon={<CurrencyIcon />} 
          color="bg-green-100 text-green-600" 
        />
        <StatCard 
          title="Total Customers" 
          value={totalCustomers} 
          icon={<UsersIcon />} 
          color="bg-blue-100 text-blue-600" 
        />
        <StatCard 
          title="Low Stock (<50)" 
          value={lowStockCount} 
          icon={<BoxIcon />} 
          color="bg-red-100 text-red-600" 
        />
      </div>
      
      <SalesChart sales={sales} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h3 className="text-xl font-semibold text-black mb-4 flex items-center"><BoxIcon /> <span className="ml-2">Low Stock Items</span></h3>
          <div className="max-h-80 overflow-y-auto pr-2">
            <ul className="space-y-3">
              {lowStockProducts.length > 0 ? lowStockProducts.map(p => (
                <li key={p.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-semibold text-black">{p.name}</p>
                    <p className="text-sm text-black">{p.manufacturer}</p>
                  </div>
                  <span className="font-bold text-black text-lg">{p.stock}</span>
                </li>
              )) : <p className="text-black">No products are low on stock.</p>}
            </ul>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h3 className="text-xl font-semibold text-black mb-4 flex items-center"><CalendarIcon /> <span className="ml-2">Batches Nearing Expiry (90 days)</span></h3>
          <div className="max-h-80 overflow-y-auto pr-2">
            <ul className="space-y-3">
              {nearingExpiryProducts.length > 0 ? nearingExpiryProducts.map((batch, index) => (
                <li key={`${batch.productId}-${batch.batchNo}-${index}`} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                   <div>
                    <p className="font-semibold text-black">{batch.productName}</p>
                    <p className="text-sm text-black">Batch: {batch.batchNo}</p>
                  </div>
                  <span className="font-semibold text-black">{new Date(batch.expiryDate).toLocaleDateString()}</span>
                </li>
              )) : <p className="text-black">No products nearing expiry.</p>}
            </ul>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Dashboard;