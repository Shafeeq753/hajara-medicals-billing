import React, { useState } from 'react';
import { Supplier } from '../types';
import Modal from './Modal';
import { PlusIcon } from './icons/Icons';
import SupplierForm from './SupplierForm';

interface SuppliersProps {
  suppliers: Supplier[];
  onAddSupplier: (supplier: Omit<Supplier, 'id'>) => void;
}

const Suppliers: React.FC<SuppliersProps> = ({ suppliers, onAddSupplier }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSaveSupplier = (supplier: Omit<Supplier, 'id'>) => {
    onAddSupplier(supplier);
    setIsModalOpen(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-800">Suppliers</h2>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-blue-700 flex items-center gap-2"
        >
          <PlusIcon /> Add Supplier
        </button>
      </div>

      <div className="bg-white p-2 md:p-6 rounded-xl shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left responsive-table">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="p-3 font-medium text-gray-600">Name</th>
                <th className="p-3 font-medium text-gray-600">Phone</th>
                <th className="p-3 font-medium text-gray-600">Address</th>
              </tr>
            </thead>
            <tbody>
              {suppliers.map(supplier => (
                <tr key={supplier.id}>
                  <td data-label="Name" className="font-semibold text-gray-700">{supplier.name}</td>
                  <td data-label="Phone" className="text-gray-700">{supplier.phone}</td>
                  <td data-label="Address" className="text-gray-500">{supplier.address}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <Modal title="Add New Supplier" onClose={() => setIsModalOpen(false)}>
          <SupplierForm onSave={handleSaveSupplier} onCancel={() => setIsModalOpen(false)} />
        </Modal>
      )}
    </div>
  );
};

export default Suppliers;
