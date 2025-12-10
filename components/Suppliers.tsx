
import React, { useState, useMemo } from 'react';
import { Supplier, Purchase } from '../types';
import Modal from './Modal';
import { PlusIcon, EditIcon, TrashIcon } from './icons/Icons';
import SupplierForm from './SupplierForm';

interface SuppliersProps {
  suppliers: Supplier[];
  purchases: Purchase[];
  onAddSupplier: (supplier: Omit<Supplier, 'id'>) => void;
  onUpdateSupplier: (supplier: Supplier) => void;
  onDeleteSupplier: (supplierId: string) => void;
}

const Suppliers = ({ suppliers, purchases, onAddSupplier, onUpdateSupplier, onDeleteSupplier }: SuppliersProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [historySupplier, setHistorySupplier] = useState<Supplier | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredSuppliers = useMemo(() => {
    return suppliers.filter(s => 
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.phone.includes(searchTerm) ||
      s.gstNumber.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [suppliers, searchTerm]);

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

  const closeHistoryModal = () => {
    setHistorySupplier(null);
  };
  
  const handleDeleteClick = (supplier: Supplier) => {
    if (window.confirm(`Are you sure you want to delete ${supplier.name}?`)) {
      onDeleteSupplier(supplier.id);
    }
  };

  const handleViewHistory = (supplier: Supplier) => {
    setHistorySupplier(supplier);
  };

  const purchaseHistory = useMemo(() => {
    if (!historySupplier) return [];
    return purchases.filter(p => p.supplierId === historySupplier.id)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [historySupplier, purchases]);

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
        <div>
          <input
            type="text"
            placeholder="Search by name, phone or GST..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full max-w-sm p-2 bg-white border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 mb-4"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left responsive-table">
            <thead className="text-xs text-black uppercase bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3">Name</th>
                <th scope="col" className="px-6 py-3">Phone</th>
                <th scope="col" className="px-6 py-3">Address</th>
                <th scope="col" className="px-6 py-3">GST Number</th>
                <th scope="col" className="px-6 py-3">DL.No</th>
                <th scope="col" className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSuppliers.map(supplier => (
                <tr key={supplier.id} className="bg-white border-b hover:bg-gray-50">
                  <td data-label="Name" className="px-6 py-4 font-medium text-black whitespace-nowrap">
                     <button 
                      onClick={() => handleViewHistory(supplier)}
                      className="font-medium text-black hover:underline text-left"
                    >
                      {supplier.name}
                    </button>
                  </td>
                  <td data-label="Phone" className="px-6 py-4">{supplier.phone}</td>
                  <td data-label="Address" className="px-6 py-4">{supplier.address}</td>
                  <td data-label="GST Number" className="px-6 py-4">{supplier.gstNumber}</td>
                  <td data-label="DL.No" className="px-6 py-4">{supplier.dlNo}</td>
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
          {filteredSuppliers.length === 0 && <p className="text-center text-black py-4">No suppliers found.</p>}
        </div>
      </div>

      {isModalOpen && (
        <Modal title={editingSupplier ? "Edit Supplier" : "Add New Supplier"} onClose={closeModal}>
          <SupplierForm onSave={handleSaveSupplier} onCancel={closeModal} supplierToEdit={editingSupplier || undefined} />
        </Modal>
      )}

      {historySupplier && (
        <Modal title={`Details for ${historySupplier.name}`} onClose={closeHistoryModal} size="lg">
           <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg border">
                  <h4 className="font-bold text-lg mb-2 text-black">{historySupplier.name}</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-sm text-black">
                      <p><span className="font-semibold">Phone:</span> {historySupplier.phone}</p>
                      <p><span className="font-semibold">Address:</span> {historySupplier.address}</p>
                      <p><span className="font-semibold">GST No:</span> {historySupplier.gstNumber}</p>
                      <p><span className="font-semibold">DL No:</span> {historySupplier.dlNo}</p>
                  </div>
              </div>
              
              <h4 className="text-md font-semibold text-black pt-2 border-t">Purchase History</h4>

              {purchaseHistory.length > 0 ? (
                <div className="overflow-y-auto max-h-[40vh]">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-black uppercase bg-gray-100 sticky top-0">
                      <tr>
                        <th scope="col" className="px-4 py-2">Date</th>
                        <th scope="col" className="px-4 py-2">Purchase ID</th>
                        <th scope="col" className="px-4 py-2 text-right">Total Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {purchaseHistory.map(record => (
                        <tr key={record.id} className="bg-white border-b hover:bg-gray-50">
                          <td className="px-4 py-2">{new Date(record.date).toLocaleDateString()}</td>
                          <td className="px-4 py-2">{record.id}</td>
                          <td className="px-4 py-2 text-right font-semibold">₹{record.total.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-black text-center py-4">No purchase history found for this supplier.</p>
              )}

              <div className="flex justify-end pt-4 border-t">
                <button onClick={closeHistoryModal} className="px-4 py-2 bg-gray-200 text-black rounded-md hover:bg-gray-300">
                  Close
                </button>
              </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Suppliers;
