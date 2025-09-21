
import React, { useState, useMemo, useEffect } from 'react';
import { Purchase, Product, PurchaseItem, Supplier } from '../types';
import { TrashIcon, PlusIcon } from './icons/Icons';
import Modal from './Modal';

// Purchase Form Component (for modal)
const PurchaseForm = ({
  products,
  suppliers,
  onSave,
  onCancel,
}: {
  products: Product[];
  suppliers: Supplier[];
  onSave: (purchase: Omit<Purchase, 'id'>) => void;
  onCancel: () => void;
}) => {
  const [supplierId, setSupplierId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [items, setItems] = useState<Omit<PurchaseItem, 'total' | 'productName'>[]>([]);
  const [purchaseGst, setPurchaseGst] = useState(0);
  const [salesGst, setSalesGst] = useState(0);
  const [productSearch, setProductSearch] = useState('');

  const filteredProducts = useMemo(() => {
    if (productSearch.length < 2) return [];
    const addedProductIds = items.map(item => item.productId);
    return products.filter(
      p => p.name.toLowerCase().includes(productSearch.toLowerCase()) && !addedProductIds.includes(p.id)
    );
  }, [productSearch, products, items]);

  const grandTotal = useMemo(() => items.reduce((sum, item) => sum + item.quantity * item.cost, 0), [items]);

  const addProductToPurchase = (product: Product) => {
    setItems(prev => [...prev, {
      productId: product.id,
      quantity: 1,
      cost: 0,
      batchNo: '',
      expiryDate: '',
    }]);
    setProductSearch('');
  };

  const updateItem = (productId: string, field: keyof Omit<PurchaseItem, 'productId' | 'total' | 'productName'>, value: string | number) => {
    setItems(prev => prev.map(item => 
      item.productId === productId ? { ...item, [field]: value } : item
    ));
  };
  
  const removeItem = (productId: string) => {
    setItems(prev => prev.filter(item => item.productId !== productId));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierId || items.length === 0) {
      alert('Please select a supplier and add at least one product.');
      return;
    }
     if (items.some(i => !i.batchNo || !i.expiryDate || i.quantity <= 0 || i.cost <= 0)) {
        alert('Please fill all details (quantity, cost, batch no, expiry date) for each product.');
        return;
    }

    const supplier = suppliers.find(s => s.id === supplierId);
    if (!supplier) return;

    const finalItems: PurchaseItem[] = items.map(item => {
      const product = products.find(p => p.id === item.productId);
      return {
        ...item,
        productName: product?.name || 'Unknown',
        total: item.quantity * item.cost,
      };
    });

    onSave({
      supplierId,
      supplierName: supplier.name,
      date,
      items: finalItems,
      total: grandTotal,
      purchaseGst,
      salesGst,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium">Supplier</label>
          <select value={supplierId} onChange={e => setSupplierId(e.target.value)} className="mt-1 w-full p-2 bg-white border rounded-md" required>
            <option value="" disabled>Select a supplier</option>
            {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">Order Date</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className="mt-1 w-full p-2 bg-white border rounded-md" required />
        </div>
      </div>

      <div className="relative border-t pt-4">
        <label className="block text-sm font-medium">Add Product</label>
        <input
          type="text"
          value={productSearch}
          onChange={e => setProductSearch(e.target.value)}
          placeholder="Type to search products..."
          className="mt-1 w-full p-2 bg-white border rounded-md"
        />
        {filteredProducts.length > 0 && (
          <ul className="absolute z-20 w-full bg-white border rounded-md mt-1 max-h-48 overflow-y-auto shadow-lg">
            {filteredProducts.map(p => (
              <li key={p.id} onClick={() => addProductToPurchase(p)} className="p-2 hover:bg-blue-100 cursor-pointer">
                {p.name}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="overflow-x-auto max-h-[30vh]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="p-2 text-left">Product</th>
              <th className="p-2 text-left">Qty</th>
              <th className="p-2 text-left">Cost</th>
              <th className="p-2 text-left">Batch No.</th>
              <th className="p-2 text-left">Expiry</th>
              <th className="p-2"></th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => {
              const product = products.find(p => p.id === item.productId);
              return (
                <tr key={item.productId} className="border-b">
                  <td className="p-1 font-medium">{product?.name}</td>
                  <td className="p-1"><input type="number" min="1" value={item.quantity} onChange={e => updateItem(item.productId, 'quantity', parseInt(e.target.value) || 1)} className="w-20 p-1 border rounded-md" /></td>
                  <td className="p-1"><input type="number" min="0.01" step="0.01" value={item.cost} onChange={e => updateItem(item.productId, 'cost', parseFloat(e.target.value) || 0)} className="w-24 p-1 border rounded-md" /></td>
                  <td className="p-1"><input type="text" value={item.batchNo} onChange={e => updateItem(item.productId, 'batchNo', e.target.value)} className="w-28 p-1 border rounded-md" /></td>
                  <td className="p-1"><input type="date" value={item.expiryDate} onChange={e => updateItem(item.productId, 'expiryDate', e.target.value)} className="w-36 p-1 border rounded-md" /></td>
                  <td className="p-1 text-right"><button type="button" onClick={() => removeItem(item.productId)}><TrashIcon /></button></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t pt-4">
        <div>
          <label className="block text-sm font-medium">Purchase GST (₹)</label>
          <input type="number" step="0.01" value={purchaseGst} onChange={e => setPurchaseGst(parseFloat(e.target.value) || 0)} className="mt-1 w-full p-2 bg-white border rounded-md" />
        </div>
        <div>
          <label className="block text-sm font-medium">Sales GST (₹)</label>
          <input type="number" step="0.01" value={salesGst} onChange={e => setSalesGst(parseFloat(e.target.value) || 0)} className="mt-1 w-full p-2 bg-white border rounded-md" />
        </div>
        <div className="text-right self-end">
            <span className="font-bold text-lg">Total: ₹{grandTotal.toFixed(2)}</span>
        </div>
      </div>
      
      <div className="flex justify-end gap-2 pt-4 border-t mt-4">
        <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-200 rounded-md">Cancel</button>
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md">Save Purchase</button>
      </div>
    </form>
  );
};


// Main Component
interface PurchasesProps {
  purchases: Purchase[];
  onAddPurchase: (purchase: Omit<Purchase, 'id'>) => void;
  products: Product[];
  suppliers: Supplier[];
  onAddSupplier: (supplier: Omit<Supplier, 'id'>) => void;
  onDeletePurchase: (purchaseId: string) => void;
}

const Purchases = ({ purchases, onAddPurchase, products, suppliers, onAddSupplier, onDeletePurchase }: PurchasesProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSavePurchase = (purchase: Omit<Purchase, 'id'>) => {
    onAddPurchase(purchase);
    setIsModalOpen(false);
  };
  
  const handleDeleteClick = (purchaseId: string) => {
    if (window.confirm(`Are you sure you want to delete purchase ${purchaseId}? This will deduct the items from stock.`)) {
      onDeletePurchase(purchaseId);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Recent Purchases</h2>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-blue-700 flex items-center gap-2"
        >
          <PlusIcon /> Add Purchase
        </button>
      </div>
      
      <div className="bg-white p-2 md:p-6 rounded-xl shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left responsive-table">
            <thead className="text-xs uppercase bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3">Purchase ID</th>
                <th scope="col" className="px-6 py-3">Supplier</th>
                <th scope="col" className="px-6 py-3">Date</th>
                <th scope="col" className="px-6 py-3 text-right">Total</th>
                <th scope="col" className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {purchases.map(purchase => (
                <tr key={purchase.id} className="bg-white border-b hover:bg-gray-50">
                  <td data-label="Purchase ID" className="px-6 py-4 font-medium whitespace-nowrap">{purchase.id}</td>
                  <td data-label="Supplier" className="px-6 py-4">{purchase.supplierName}</td>
                  <td data-label="Date" className="px-6 py-4">{new Date(purchase.date).toLocaleDateString()}</td>
                  <td data-label="Total" className="px-6 py-4 font-semibold text-right">₹{purchase.total.toFixed(2)}</td>
                  <td data-label="Actions" className="px-6 py-4 text-right">
                    <button onClick={() => handleDeleteClick(purchase.id)} className="hover:text-black">
                      <TrashIcon />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <Modal title="Add New Purchase" onClose={() => setIsModalOpen(false)} size="xl">
          <PurchaseForm 
            products={products}
            suppliers={suppliers}
            onSave={handleSavePurchase}
            onCancel={() => setIsModalOpen(false)}
          />
        </Modal>
      )}
    </div>
  );
};

export default Purchases;
