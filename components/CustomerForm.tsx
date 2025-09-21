import React, { useState, useMemo } from 'react';
import { Customer, Product } from '../types';

interface CustomerFormProps {
  onSave: (customer: Omit<Customer, 'id'>) => void;
  onCancel: () => void;
  products: Product[];
}

const CustomerForm = ({ onSave, onCancel, products }: CustomerFormProps) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [usedProductIds, setUsedProductIds] = useState<string[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');

  const availableProducts = useMemo(() => {
    return products.filter(p => !usedProductIds.includes(p.id));
  }, [products, usedProductIds]);

  const handleAddMedicine = () => {
    if (selectedProductId && !usedProductIds.includes(selectedProductId)) {
      setUsedProductIds(prev => [...prev, selectedProductId]);
      setSelectedProductId('');
    }
  };

  const handleRemoveMedicine = (productId: string) => {
    setUsedProductIds(prev => prev.filter(id => id !== productId));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) {
      alert("Name and Phone are required.");
      return;
    }
    onSave({ name, phone, address, usedProductIds });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-black">Name</label>
        <input type="text" value={name} onChange={e => setName(e.target.value)} className="mt-1 block w-full p-2 bg-white border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" required />
      </div>
      <div>
        <label className="block text-sm font-medium text-black">Phone</label>
        <input type="text" value={phone} onChange={e => setPhone(e.target.value)} className="mt-1 block w-full p-2 bg-white border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" required />
      </div>
      <div>
        <label className="block text-sm font-medium text-black">Address</label>
        <input type="text" value={address} onChange={e => setAddress(e.target.value)} className="mt-1 block w-full p-2 bg-white border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
      </div>
      
      <div className="border-t pt-4">
        <h4 className="font-semibold text-black mb-2">Assign Medicines (Optional):</h4>
        <div className="flex items-center gap-2 mb-2">
          <select 
            value={selectedProductId} 
            onChange={e => setSelectedProductId(e.target.value)}
            className="flex-grow p-2 bg-white border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="" disabled>Select a product to add...</option>
            {availableProducts.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <button 
            type="button"
            onClick={handleAddMedicine}
            disabled={!selectedProductId}
            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 disabled:bg-gray-400"
          >
            Add
          </button>
        </div>
         <div className="flex flex-wrap gap-2 min-h-[40px] bg-gray-50 p-2 rounded-md">
          {usedProductIds.length > 0 ? (
            usedProductIds.map(pid => {
              const product = products.find(p => p.id === pid);
              return (
                <span key={pid} className="flex items-center bg-blue-100 text-black text-sm font-medium px-2.5 py-1 rounded-full">
                  {product?.name || 'Unknown'}
                  <button onClick={() => handleRemoveMedicine(pid)} className="ml-2 text-black hover:text-black font-bold">
                    &times;
                  </button>
                </span>
              );
            })
          ) : (
            <p className="text-black px-2.5 py-1 text-sm">No medicines assigned.</p>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t mt-4">
        <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-200 text-black rounded-md hover:bg-gray-300">Cancel</button>
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Save Customer</button>
      </div>
    </form>
  );
};

export default CustomerForm;