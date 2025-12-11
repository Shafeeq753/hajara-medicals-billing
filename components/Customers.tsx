
import React, { useState, useMemo } from 'react';
import { Customer, Product } from '../types';
import Modal from './Modal';
import { PlusIcon } from './icons/Icons';
import CustomerForm from './CustomerForm';

interface ManageCustomerMedicinesProps {
  customer: Customer;
  products: Product[];
  onSave: (customerId: string, productIds: string[]) => void;
  onCancel: () => void;
}

const ManageCustomerMedicines = ({ customer, products, onSave, onCancel }: ManageCustomerMedicinesProps) => {
  const [usedIds, setUsedIds] = useState<string[]>(customer.usedProductIds || []);
  const [selectedProductId, setSelectedProductId] = useState('');

  const availableProducts = useMemo(() => {
    return products.filter(p => !usedIds.includes(p.id));
  }, [products, usedIds]);

  const handleAddMedicine = () => {
    if (selectedProductId && !usedIds.includes(selectedProductId)) {
      setUsedIds(prev => [...prev, selectedProductId]);
      setSelectedProductId('');
    }
  };

  const handleRemoveMedicine = (productId: string) => {
    setUsedIds(prev => prev.filter(id => id !== productId));
  };

  const handleSave = () => {
    onSave(customer.id, usedIds);
    onCancel();
  };

  return (
    <div className="space-y-4">
      <div>
        <h4 className="font-semibold text-black mb-2">Current Medicines:</h4>
        <div className="flex flex-wrap gap-2 min-h-[40px]">
          {usedIds.length > 0 ? (
            usedIds.map(pid => {
              const product = products.find(p => p.id === pid);
              return (
                <span key={pid} className="flex items-center bg-blue-100 text-black text-sm font-medium px-2.5 py-1 rounded-full">
                  {product?.name || 'Unknown Product'}
                  <button onClick={() => handleRemoveMedicine(pid)} className="ml-2 text-black hover:text-black font-bold">
                    &times;
                  </button>
                </span>
              );
            })
          ) : (
            <p className="text-black px-2.5 py-1">No medicines assigned.</p>
          )}
        </div>
      </div>

      <div className="border-t pt-4">
        <h4 className="font-semibold text-black mb-2">Add New Medicine:</h4>
        <div className="flex items-center gap-2">
          <select 
            value={selectedProductId} 
            onChange={e => setSelectedProductId(e.target.value)}
            className="flex-grow p-2 bg-white border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="" disabled>Select a product...</option>
            {availableProducts.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <button 
            onClick={handleAddMedicine}
            disabled={!selectedProductId}
            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 disabled:bg-gray-400"
          >
            Add
          </button>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t mt-4">
        <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancel</button>
        <button type="button" onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Save Changes</button>
      </div>
    </div>
  );
};

interface CustomersProps {
  customers: Customer[];
  onAddCustomer: (customer: Omit<Customer, 'id'>) => void;
  products: Product[];
  onUpdateCustomerMedicines: (customerId: string, productIds: string[]) => void;
}

const Customers = ({ customers, onAddCustomer, products, onUpdateCustomerMedicines }: CustomersProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMedicineModalOpen, setIsMedicineModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm)
    );
  }, [customers, searchTerm]);

  const handleSaveCustomer = (customer: Omit<Customer, 'id'>) => {
    onAddCustomer(customer);
    setIsModalOpen(false);
  }
  
  const handleOpenMedicineModal = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsMedicineModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-black">Customers</h2>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-blue-700 flex items-center gap-2"
        >
          <PlusIcon /> Add Customer
        </button>
      </div>

      <div className="bg-white p-2 md:p-6 rounded-xl shadow-lg">
        <div>
          <input
            type="text"
            placeholder="Search by name or phone..."
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
                <th scope="col" className="px-6 py-3">Medicines Used</th>
                <th scope="col" className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map(customer => (
                <tr key={customer.id} className="bg-white border-b hover:bg-gray-50">
                  <td data-label="Name" className="px-6 py-4 font-medium text-black whitespace-nowrap">{customer.name}</td>
                  <td data-label="Phone" className="px-6 py-4">{customer.phone}</td>
                  <td data-label="Medicines Used" className="px-6 py-4">
                    <span className="line-clamp-2">
                        {customer.usedProductIds?.length > 0
                          ? customer.usedProductIds.map(pid => products.find(p => p.id === pid)?.name).filter(Boolean).join(', ')
                          : 'None'}
                    </span>
                  </td>
                   <td data-label="Actions" className="px-6 py-4 text-right">
                    <button onClick={() => handleOpenMedicineModal(customer)} className="font-medium text-black hover:underline">
                      Manage Medicines
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredCustomers.length === 0 && <p className="text-center text-black py-4">No customers found.</p>}
        </div>
      </div>

      {isModalOpen && (
        <Modal title="Add New Customer" onClose={() => setIsModalOpen(false)}>
          <CustomerForm onSave={handleSaveCustomer} onCancel={() => setIsModalOpen(false)} products={products} />
        </Modal>
      )}

      {isMedicineModalOpen && selectedCustomer && (
        <Modal title={`Medicines for ${selectedCustomer.name}`} onClose={() => setIsMedicineModalOpen(false)}>
          <ManageCustomerMedicines
            customer={selectedCustomer}
            products={products}
            onSave={onUpdateCustomerMedicines}
            onCancel={() => setIsMedicineModalOpen(false)}
          />
        </Modal>
      )}
    </div>
  );
};

export default Customers;
