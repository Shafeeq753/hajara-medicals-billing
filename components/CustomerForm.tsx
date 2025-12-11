
import React, { useState, useMemo } from 'react';
import { Customer, Product, CustomerMedicine } from '../types';

interface CustomerFormProps {
  onSave: (customer: Omit<Customer, 'id'>) => void;
  onCancel: () => void;
  products: Product[];
}

const CustomerForm = ({ onSave, onCancel, products }: CustomerFormProps) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [medicines, setMedicines] = useState<CustomerMedicine[]>([]);
  
  // New medicine input states
  const [selectedProductId, setSelectedProductId] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState('');
  const [duration, setDuration] = useState('');

  const availableProducts = useMemo(() => {
    return products.filter(p => !medicines.some(m => m.productId === p.id));
  }, [products, medicines]);

  const handleAddMedicine = () => {
    if (selectedProductId) {
      setMedicines(prev => [...prev, {
          productId: selectedProductId,
          dosage: dosage || '',
          frequency: frequency || '',
          duration: duration || ''
      }]);
      setSelectedProductId('');
      setDosage('');
      setFrequency('');
      setDuration('');
    }
  };

  const handleRemoveMedicine = (productId: string) => {
    setMedicines(prev => prev.filter(m => m.productId !== productId));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) {
      alert("Name and Phone are required.");
      return;
    }
    onSave({ name, phone, address, medicines });
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-2 mb-2 items-end">
          <div className="lg:col-span-2">
              <label className="block text-xs font-medium text-gray-700">Product</label>
              <select 
                value={selectedProductId} 
                onChange={e => setSelectedProductId(e.target.value)}
                className="w-full p-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm"
              >
                <option value="" disabled>Select product...</option>
                {availableProducts.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
          </div>
          <div>
              <label className="block text-xs font-medium text-gray-700">Dosage</label>
              <input type="text" placeholder="e.g. 500mg" value={dosage} onChange={e => setDosage(e.target.value)} className="w-full p-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm" />
          </div>
          <div>
               <label className="block text-xs font-medium text-gray-700">Frequency</label>
               <input type="text" placeholder="e.g. 1-0-1" value={frequency} onChange={e => setFrequency(e.target.value)} className="w-full p-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm" />
          </div>
          <div>
               <label className="block text-xs font-medium text-gray-700">Duration</label>
               <div className="flex gap-1">
                 <input type="text" placeholder="e.g. 5 days" value={duration} onChange={e => setDuration(e.target.value)} className="w-full p-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm" />
                 <button 
                    type="button"
                    onClick={handleAddMedicine}
                    disabled={!selectedProductId}
                    className="bg-blue-500 text-white px-3 py-2 rounded-md hover:bg-blue-600 disabled:bg-gray-400"
                  >
                    Add
                  </button>
               </div>
          </div>
        </div>
         <div className="flex flex-col gap-2 min-h-[40px] bg-gray-50 p-2 rounded-md">
          {medicines.length > 0 ? (
            medicines.map(m => {
              const product = products.find(p => p.id === m.productId);
              return (
                <div key={m.productId} className="flex justify-between items-center bg-white border p-2 rounded-md text-sm shadow-sm">
                  <div>
                    <span className="font-semibold text-black">{product?.name || 'Unknown'}</span>
                    <span className="text-gray-500 text-xs ml-2">({m.dosage}, {m.frequency}, {m.duration})</span>
                  </div>
                  <button onClick={() => handleRemoveMedicine(m.productId)} className="text-red-500 hover:text-red-700 font-bold px-2">
                    &times;
                  </button>
                </div>
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