import React, { useState, useEffect } from 'react';
import { Supplier } from '../types';

interface SupplierFormProps {
  onSave: (supplier: Omit<Supplier, 'id'> | Supplier) => void;
  onCancel: () => void;
  supplierToEdit?: Supplier;
}

const SupplierForm = ({ onSave, onCancel, supplierToEdit }: SupplierFormProps) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [dlNo, setDlNo] = useState('');

  useEffect(() => {
    if (supplierToEdit) {
      setName(supplierToEdit.name);
      setPhone(supplierToEdit.phone);
      setAddress(supplierToEdit.address);
      setGstNumber(supplierToEdit.gstNumber || '');
      setDlNo(supplierToEdit.dlNo || '');
    }
  }, [supplierToEdit]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) {
      alert("Name and Phone are required.");
      return;
    }
    const supplierData = { name, phone, address, gstNumber, dlNo };
    if (supplierToEdit) {
      onSave({ ...supplierData, id: supplierToEdit.id });
    } else {
      onSave(supplierData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-black">Name</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} className="mt-1 block w-full p-2 bg-white border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-black">Phone</label>
          <input type="text" value={phone} onChange={e => setPhone(e.target.value)} className="mt-1 block w-full p-2 bg-white border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" required />
        </div>
        <div className="md:col-span-2">
            <label className="block text-sm font-medium text-black">Address</label>
            <input type="text" value={address} onChange={e => setAddress(e.target.value)} className="mt-1 block w-full p-2 bg-white border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-black">GST Number</label>
          <input type="text" value={gstNumber} onChange={e => setGstNumber(e.target.value)} className="mt-1 block w-full p-2 bg-white border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-black">DL.No (Drug License)</label>
          <input type="text" value={dlNo} onChange={e => setDlNo(e.target.value)} className="mt-1 block w-full p-2 bg-white border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-4 border-t mt-4">
        <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-200 text-black rounded-md hover:bg-gray-300">Cancel</button>
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
          {supplierToEdit ? 'Update Supplier' : 'Save Supplier'}
        </button>
      </div>
    </form>
  );
};

export default SupplierForm;