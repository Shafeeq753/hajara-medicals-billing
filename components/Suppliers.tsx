import React, { useState } from 'react';
import { Supplier } from '../types';
import Modal from './Modal';
import { PlusIcon, EditIcon, TrashIcon } from './icons/Icons';
import SupplierForm from './SupplierForm';

interface SuppliersProps {
  suppliers: Supplier[];
  onAddSupplier: (supplier: Omit<Supplier, 'id'>) => void;
  onUpdateSupplier: (supplier: Supplier) => void;
  onDeleteSupplier: (supplierId: string) => void;
}

const Suppliers = ({ suppliers, onAddSupplier, onUpdateSupplier, onDeleteSupplier }: SuppliersProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  const handleSaveSupplier = (supplier: Omit<Supplier, 'id'> | Supplier) => {
    if ('id' in supplier) {
      onUpdateSupplier(supplier);
    } else {
      onAddSupplier(supplier);
    }
    closeModal();
  };

  const openEditModal = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setIsModalOpen(true);
  };
  
  const openAddModal = () => {
    setEditingSupplier(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setEditingSupplier(null);
    setIsModalOpen(false);
  };
  
  const handleDeleteClick = (supplier: Supplier) => {
    if (window.confirm(`Are you sure you want to delete ${supplier.name}?`)) {
      onDeleteSupplier(supplier.id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-black">Suppliers</h2>
        <button
          onClick={openAddModal}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-blue-700 flex items-center gap-2"
        >
          <PlusIcon /> Add Supplier
        </button>
      </div>

      <div className="bg-white p-2 md:p-6 rounded-xl shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left responsive-table">
            <thead className="text-xs text-black uppercase bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3">Name</th>
                <th scope="col" className="px-6 py-3">Phone</th>
                <th scope="col" className="px-6 py-3">Address</th>
                <th scope="col" className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {suppliers.map(supplier => (
                <tr key={supplier.id} className="bg-white border-b hover:bg-gray-50">
                  <td data-label="Name" className="px-6 py-4 font-medium text-black whitespace-nowrap">{supplier.name}</td>
                  <td data-label="Phone" className="px-6 py-4">{supplier.phone}</td>
                  <td data-label="Address" className="px-6 py-4">{supplier.address}</td>
                  <td data-label="Actions" className="px-6 py-4">
                    <div className="flex items-center justify-end gap-4">
                      <button onClick={() => openEditModal(supplier)} className="text-black hover:text-black">
                        <EditIcon />
                      </button>
                      <button onClick={() => handleDeleteClick(supplier)} className="text-black hover:text-black">
                        <TrashIcon />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <Modal title={editingSupplier ? "Edit Supplier" : "Add New Supplier"} onClose={closeModal}>
          <SupplierForm onSave={handleSaveSupplier} onCancel={closeModal} supplierToEdit={editingSupplier || undefined} />
        </Modal>
      )}
    </div>
  );
};

export default Suppliers;