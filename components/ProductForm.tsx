import React, { useState } from 'react';
import { Product } from '../types';

interface ProductFormProps {
  onSave: (product: Omit<Product, 'id'>) => void;
  onCancel: () => void;
}

const ProductForm: React.FC<ProductFormProps> = ({ onSave, onCancel }) => {
  const [name, setName] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [batchNo, setBatchNo] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [stock, setStock] = useState(0);
  const [mrp, setMrp] = useState(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !manufacturer || !batchNo || !expiryDate) {
      alert("All fields except Stock and MRP are required.");
      return;
    }
     if (stock < 0 || mrp < 0) {
      alert("Stock and MRP cannot be negative.");
      return;
    }
    onSave({ name, manufacturer, batchNo, expiryDate, stock, mrp });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-medium text-gray-700">Product Name</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} className="mt-1 block w-full p-2 bg-white border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" required />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Manufacturer</label>
                <input type="text" value={manufacturer} onChange={e => setManufacturer(e.target.value)} className="mt-1 block w-full p-2 bg-white border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" required />
            </div>
             <div>
                <label className="block text-sm font-medium text-gray-700">Batch No.</label>
                <input type="text" value={batchNo} onChange={e => setBatchNo(e.target.value)} className="mt-1 block w-full p-2 bg-white border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" required />
            </div>
             <div>
                <label className="block text-sm font-medium text-gray-700">Expiry Date</label>
                <input type="date" value={expiryDate} onChange={e => setExpiryDate(e.target.value)} className="mt-1 block w-full p-2 bg-white border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" required />
            </div>
             <div>
                <label className="block text-sm font-medium text-gray-700">Initial Stock</label>
                <input type="number" value={stock} onChange={e => setStock(parseInt(e.target.value) || 0)} className="mt-1 block w-full p-2 bg-white border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
            </div>
             <div>
                <label className="block text-sm font-medium text-gray-700">MRP (₹)</label>
                <input type="number" step="0.01" value={mrp} onChange={e => setMrp(parseFloat(e.target.value) || 0)} className="mt-1 block w-full p-2 bg-white border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
            </div>
       </div>
      <div className="flex justify-end gap-2 pt-4">
        <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancel</button>
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Save Product</button>
      </div>
    </form>
  );
};

export default ProductForm;