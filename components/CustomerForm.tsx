
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
  
  // Medicine Input States
  const [selectedProductId, setSelectedProductId] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState('');
  const [strength, setStrength] = useState('');
  const [instructions, setInstructions] = useState('');

  const availableProducts = useMemo(() => {
    const usedIds = medicines.map(m => m.productId);
    return products.filter(p => !usedIds.includes(p.id));
  }, [products, medicines]);

  const handleAddMedicine = () => {
    if (selectedProductId) {
      const newMedicine: CustomerMedicine = {
          productId: selectedProductId,
          dosage,
          frequency,
          strength,
          instructions
      };
      setMedicines(prev => [...prev, newMedicine]);
      // Reset inputs
      setSelectedProductId('');
      setDosage('');
      setFrequency('');
      setStrength('');
      setInstructions('');
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2 p-2 bg-gray-50 rounded-md border">
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium">Product</label>
            <select 
                value={selectedProductId} 
                onChange={e => setSelectedProductId(e.target.value)}
                className="w-full p-2 bg-white border border-gray-300 rounded-md text-sm"
            >
                <option value="" disabled>Select a product...</option>
                {availableProducts.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
                ))}
            </select>
          </div>
          <div>
              <label className="block text-xs font-medium">Dosage</label>
              <input type="text" placeholder="e.g. 1 tab" value={dosage} onChange={e => setDosage(e.target.value)} className="w-full p-2 bg-white border rounded-md text-sm" />
          </div>
          <div>
               <label className="block text-xs font-medium">Strength/Power</label>
               <input type="text" placeholder="e.g. 500mg" value={strength} onChange={e => setStrength(e.target.value)} className="w-full p-2 bg-white border rounded-md text-sm" />
          </div>
          <div>
               <label className="block text-xs font-medium">Frequency</label>
               <input type="text" placeholder="e.g. Morning, Night" value={frequency} onChange={e => setFrequency(e.target.value)} className="w-full p-2 bg-white border rounded-md text-sm" />
          </div>
           <div>
               <label className="block text-xs font-medium">Instructions</label>
               <input type="text" placeholder="e.g. After food" value={instructions} onChange={e => setInstructions(e.target.value)} className="w-full p-2 bg-white border rounded-md text-sm" />
          </div>
          <div className="sm:col-span-2 text-right">
             <button 
                type="button"
                onClick={handleAddMedicine}
                disabled={!selectedProductId}
                className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 disabled:bg-gray-400 text-sm"
            >
                Add Medicine
            </button>
          </div>
        </div>

         <div className="space-y-2 mt-2">
          {medicines.length > 0 ? (
            medicines.map(m => {
              const product = products.find(p => p.id === m.productId);
              return (
                <div key={m.productId} className="flex justify-between items-center bg-blue-50 border border-blue-200 p-2 rounded-md">
                   <div className="text-sm">
                       <p className="font-semibold text-black">{product?.name || 'Unknown'}</p>
                       <p className="text-xs text-gray-600">
                           {m.strength && `${m.strength} • `}{m.dosage} • {m.frequency} • {m.instructions}
                       </p>
                   </div>
                  <button onClick={() => handleRemoveMedicine(m.productId)} className="text-red-500 hover:text-red-700 font-bold px-2">
                    &times;
                  </button>
                </div>
              );
            })
          ) : (
            <p className="text-black text-sm p-2 text-center text-gray-500">No medicines added.</p>
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