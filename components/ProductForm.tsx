import React, { useState, useEffect } from 'react';
import { Product } from '../types';

interface ProductFormProps {
  onSave: (product: Omit<Product, 'id'> | Product) => void;
  onCancel: () => void;
  productToEdit?: Product;
}

const ProductForm = ({ onSave, onCancel, productToEdit }: ProductFormProps) => {
  const [name, setName] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [batchNo, setBatchNo] = useState('');
  const [shelfLocation, setShelfLocation] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [stock, setStock] = useState(0);
  const [mrp, setMrp] = useState(0);

  useEffect(() => {
    if (productToEdit) {
      setName(productToEdit.name);
      setManufacturer(productToEdit.manufacturer);
      setBatchNo(productToEdit.batchNo);
      setShelfLocation(productToEdit.shelfLocation);
      setExpiryDate(productToEdit.expiryDate);
      setStock(productToEdit.stock);
      setMrp(productToEdit.mrp);
    }
  }, [productToEdit]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !manufacturer || !batchNo || !shelfLocation || !expiryDate) {
      alert("All fields are required.");
      return;
    }
     if (stock < 0 || mrp < 0) {
      alert("Stock and MRP cannot be negative.");
      return;
    }
    const productData = { name, manufacturer, batchNo, shelfLocation, expiryDate, stock, mrp };
    if (productToEdit) {
      onSave({ ...productData, id: productToEdit.id });
    } else {
      onSave(productData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-medium text-black">Product Name</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} className="mt-1 block w-full p-2 bg-white border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" required />
            </div>
            <div>
                <label className="block text-sm font-medium text-black">Manufacturer</label>
                <input type="text" value={manufacturer} onChange={e => setManufacturer(e.target.value)} className="mt-1 block w-full p-2 bg-white border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" required />
            </div>
             <div>
                <label className="block text-sm font-medium text-black">Batch No.</label>
                <input type="text" value={batchNo} onChange={e => setBatchNo(e.target.value)} className="mt-1 block w-full p-2 bg-white border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" required />
            </div>
             <div>
                <label className="block text-sm font-medium text-black">Shelf Location</label>
                <input type="text" value={shelfLocation} onChange={e => setShelfLocation(e.target.value)} placeholder="e.g. A1, B2" className="mt-1 block w-full p-2 bg-white border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" required />
            </div>
             <div>
                <label className="block text-sm font-medium text-black">Expiry Date</label>
                <input type="date" value={expiryDate} onChange={e => setExpiryDate(e.target.value)} className="mt-1 block w-full p-2 bg-white border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" required />
            </div>
             <div>
                <label className="block text-sm font-medium text-black">Stock</label>
                <input type="number" value={stock} onChange={e => setStock(parseInt(e.target.value) || 0)} className="mt-1 block w-full p-2 bg-white border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
            </div>
             <div>
                <label className="block text-sm font-medium text-black">MRP (₹)</label>
                <input type="number" step="0.01" value={mrp} onChange={e => setMrp(parseFloat(e.target.value) || 0)} className="mt-1 block w-full p-2 bg-white border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
            </div>
       </div>
      <div className="flex justify-end gap-2 pt-4">
        <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-200 text-black rounded-md hover:bg-gray-300">Cancel</button>
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            {productToEdit ? 'Update Product' : 'Save Product'}
        </button>
      </div>
    </form>
  );
};

export default ProductForm;