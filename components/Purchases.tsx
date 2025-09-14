import React, { useState, useMemo, useEffect } from 'react';
import { Purchase, Product, PurchaseItem, Supplier } from '../types';
import { TrashIcon, PlusIcon } from './icons/Icons';
import Modal from './Modal';
import SupplierForm from './SupplierForm';

interface PurchasesProps {
  onAddPurchase: (purchase: Purchase) => void;
  products: Product[];
  suppliers: Supplier[];
  onAddSupplier: (supplier: Omit<Supplier, 'id'>) => void;
}

const Purchases: React.FC<PurchasesProps> = ({ onAddPurchase, products, suppliers, onAddSupplier }) => {
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);
  const [currentItems, setCurrentItems] = useState<PurchaseItem[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);

  useEffect(() => {
    if (productSearch.length > 1) {
      setFilteredProducts(
        products.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()))
      );
    } else {
      setFilteredProducts([]);
    }
  }, [productSearch, products]);

  const total = useMemo(() => currentItems.reduce((sum, item) => sum + item.total, 0), [currentItems]);

  const addProductToPurchase = (product: Product) => {
    const existingItem = currentItems.find(item => item.productId === product.id);
    if (existingItem) {
      alert('Product already added. You can update the quantity below.');
    } else {
      const newItem: PurchaseItem = {
        productId: product.id,
        productName: product.name,
        quantity: 1,
        cost: 0,
        total: 0,
      };
      setCurrentItems(prev => [...prev, newItem]);
    }
    setProductSearch('');
    setFilteredProducts([]);
  };

  const updateItem = (productId: string, field: 'quantity' | 'cost', value: number) => {
    if (value < 0) value = 0;
    setCurrentItems(prevItems => prevItems.map(item => {
      if (item.productId === productId) {
        const updatedItem = { ...item, [field]: value };
        updatedItem.total = updatedItem.quantity * updatedItem.cost;
        return updatedItem;
      }
      return item;
    }));
  };

  const removeItem = (productId: string) => {
    setCurrentItems(prev => prev.filter(item => item.productId !== productId));
  };

  const resetForm = () => {
    setSelectedSupplierId(null);
    setCurrentItems([]);
    setProductSearch('');
  };

  const handleSavePurchase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplierId) {
      alert('Please select a supplier.');
      return;
    }
    const supplier = suppliers.find(s => s.id === selectedSupplierId);
    if (!supplier) {
      alert('Invalid supplier selected.');
      return;
    }
    if (currentItems.length === 0) {
      alert('Please add at least one product.');
      return;
    }
    if (currentItems.some(item => item.quantity <= 0 || item.cost <= 0)) {
        alert('Please ensure all items have a valid quantity and cost.');
        return;
    }

    const newPurchase: Purchase = {
      id: `PUR-${Date.now()}`,
      supplierId: selectedSupplierId,
      supplierName: supplier.name,
      date: new Date().toISOString(),
      items: currentItems,
      total,
    };

    onAddPurchase(newPurchase);
    resetForm();
  };
  
  const handleSaveSupplier = (supplier: Omit<Supplier, 'id'>) => {
    onAddSupplier(supplier);
    setIsSupplierModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-800">New Purchase</h2>
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <form onSubmit={handleSavePurchase} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="supplierName" className="block text-sm font-medium text-gray-700">Supplier</label>
              <div className="flex items-center gap-2 mt-1">
                 <select
                    id="supplierName"
                    value={selectedSupplierId || ''}
                    onChange={(e) => setSelectedSupplierId(e.target.value)}
                    className="block w-full p-2 bg-white border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    required
                 >
                    <option value="" disabled>Select a supplier</option>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                 </select>
                 <button type="button" onClick={() => setIsSupplierModalOpen(true)} className="flex-shrink-0 bg-blue-500 text-white px-3 py-2 rounded-md hover:bg-blue-600 flex items-center">
                    <PlusIcon /> <span className="ml-1 hidden sm:inline">New</span>
                 </button>
              </div>
            </div>
            <div className="relative">
              <label htmlFor="productSearch" className="block text-sm font-medium text-gray-700">Search Product to Add</label>
              <input
                id="productSearch"
                type="text"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="Type to search products..."
                className="mt-1 w-full p-2 bg-white border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
              {filteredProducts.length > 0 && (
                <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-md mt-1 max-h-60 overflow-y-auto shadow-lg">
                  {filteredProducts.map(p => (
                    <li
                      key={p.id}
                      onClick={() => addProductToPurchase(p)}
                      className="p-2 hover:bg-blue-100 cursor-pointer"
                    >
                      {p.name} (Current Stock: {p.stock})
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="overflow-x-auto border-t pt-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Purchase Items</h3>
            <table className="w-full text-left responsive-table">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="p-2 font-medium text-gray-600">Product</th>
                  <th className="p-2 font-medium text-gray-600 text-center">Quantity</th>
                  <th className="p-2 font-medium text-gray-600 text-right">Cost per Item</th>
                  <th className="p-2 font-medium text-gray-600 text-right">Total</th>
                  <th className="p-2"></th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map(item => (
                  <tr key={item.productId}>
                    <td data-label="Product" className="font-medium text-gray-800">{item.productName}</td>
                    <td data-label="Quantity">
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateItem(item.productId, 'quantity', parseInt(e.target.value, 10) || 0)}
                        className="w-24 p-1 bg-white border border-gray-300 rounded-md text-center mx-auto md:ml-auto md:mr-0"
                        min="1"
                      />
                    </td>
                    <td data-label="Cost/Item">
                      <input
                        type="number"
                        step="0.01"
                        value={item.cost}
                        onChange={(e) => updateItem(item.productId, 'cost', parseFloat(e.target.value) || 0)}
                        className="w-24 p-1 bg-white border border-gray-300 rounded-md ml-auto text-right"
                        min="0.01"
                      />
                    </td>
                    <td data-label="Total" className="text-right font-semibold">₹{item.total.toFixed(2)}</td>
                    <td data-label="Action">
                      <button type="button" onClick={() => removeItem(item.productId)} className="text-red-500 hover:text-red-700 block ml-auto">
                        <TrashIcon />
                      </button>
                    </td>
                  </tr>
                ))}
                 {currentItems.length === 0 && (
                    <tr className="md:table-row">
                        <td colSpan={5} className="text-center p-4 text-gray-500 block md:table-cell">No products added yet.</td>
                    </tr>
                 )}
              </tbody>
               <tfoot className="hidden md:table-footer-group">
                  <tr className="border-t">
                    <td colSpan={3} className="p-2 text-right font-bold text-lg text-gray-700">Grand Total:</td>
                    <td className="p-2 text-right font-bold text-lg text-blue-600">₹{total.toFixed(2)}</td>
                    <td></td>
                  </tr>
               </tfoot>
            </table>
             <div className="md:hidden text-right mt-4 p-4 bg-gray-50 rounded-lg">
                <span className="font-bold text-lg text-gray-700">Grand Total:</span>
                <span className="font-bold text-lg text-blue-600 ml-2">₹{total.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button type="submit" className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            disabled={currentItems.length === 0 || !selectedSupplierId}
            >
              Save Purchase
            </button>
          </div>
        </form>
      </div>

       {isSupplierModalOpen && (
        <Modal title="Add New Supplier" onClose={() => setIsSupplierModalOpen(false)}>
          <SupplierForm onSave={handleSaveSupplier} onCancel={() => setIsSupplierModalOpen(false)} />
        </Modal>
      )}
    </div>
  );
};

export default Purchases;