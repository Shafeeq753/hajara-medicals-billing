
import React, { useState, useMemo } from 'react';
import { Customer, Product, CustomerMedicine } from '../types';
import Modal from './Modal';
import { PlusIcon } from './icons/Icons';
import CustomerForm from './CustomerForm';

interface ManageCustomerMedicinesProps {
  customer: Customer;
  products: Product[];
  onSave: (customerId: string, medicines: CustomerMedicine[]) => void;
  onCancel: () => void;
}

const ManageCustomerMedicines = ({ customer, products, onSave, onCancel }: ManageCustomerMedicinesProps) => {
  const [medicines, setMedicines] = useState<CustomerMedicine[]>(customer.medicines || []);
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

  const handleSave = () => {
    onSave(customer.id, medicines);
    onCancel();
  };

  return (
    <div className="space-y-4">
      <div>
        <h4 className="font-semibold text-black mb-2">Current Medicines:</h4>
        <div className="bg-gray-50 p-2 rounded-md max-h-60 overflow-y-auto">
          {medicines.length > 0 ? (
            <div className="space-y-2">
                {medicines.map(m => {
                const product = products.find(p => p.id === m.productId);
                return (
                    <div key={m.productId} className="flex justify-between items-start bg-white border p-2 rounded-md shadow-sm">
                        <div className="text-sm">
                             <div className="font-bold text-black">{product?.name || 'Unknown Product'}</div>
                             <div className="text-gray-600 text-xs grid grid-cols-2 gap-x-4 mt-1">
                                <span>Dosage: {m.dosage}</span>
                                <span>Freq: {m.frequency}</span>
                                <span>Duration: {m.duration}</span>
                             </div>
                        </div>
                        <button onClick={() => handleRemoveMedicine(m.productId)} className="text-red-500 hover:text-red-700 font-bold ml-2">
                            &times;
                        </button>
                    </div>
                );
                })}
            </div>
          ) : (
            <p className="text-black text-sm p-2">No medicines assigned.</p>
          )}
        </div>
      </div>

      <div className="border-t pt-4">
        <h4 className="font-semibold text-black mb-2">Add New Medicine:</h4>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-2">
             <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-700">Product</label>
                <select 
                    value={selectedProductId} 
                    onChange={e => setSelectedProductId(e.target.value)}
                    className="w-full p-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm"
                >
                    <option value="" disabled>Select a product...</option>
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
                 <input type="text" placeholder="e.g. 5 days" value={duration} onChange={e => setDuration(e.target.value)} className="w-full p-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm" />
            </div>
            <div className="flex items-end">
                <button 
                    onClick={handleAddMedicine}
                    disabled={!selectedProductId}
                    className="w-full bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 disabled:bg-gray-400 text-sm"
                >
                    Add to List
                </button>
            </div>
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
  onUpdateCustomerMedicines: (customerId: string, medicines: CustomerMedicine[]) => void;
}

const Customers = ({ customers, onAddCustomer, products, onUpdateCustomerMedicines }: CustomersProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMedicineModalOpen, setIsMedicineModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCustomerId, setExpandedCustomerId] = useState<string | null>(null);

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

  const toggleExpand = (id: string) => {
      setExpandedCustomerId(prev => prev === id ? null : id);
  }

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
                     {/* Desktop View */}
                    <div className="hidden md:block">
                        {customer.medicines?.length > 0 ? (
                            <ul className="list-disc list-inside text-xs">
                                {customer.medicines.map((m, idx) => {
                                    const p = products.find(prod => prod.id === m.productId);
                                    return <li key={idx}><span className="font-semibold">{p?.name}</span> ({m.dosage}, {m.frequency})</li>;
                                })}
                            </ul>
                        ) : 'None'}
                    </div>

                    {/* Mobile View - Toggle */}
                    <div className="md:hidden">
                        {expandedCustomerId === customer.id ? (
                             <div className="mt-2 p-2 bg-gray-50 rounded border">
                                {customer.medicines?.length > 0 ? (
                                    <ul className="space-y-2 text-xs">
                                        {customer.medicines.map((m, idx) => {
                                            const p = products.find(prod => prod.id === m.productId);
                                            return (
                                                <li key={idx} className="flex flex-col">
                                                    <span className="font-bold text-black">{p?.name}</span>
                                                    <span className="text-gray-600">Dosage: {m.dosage}</span>
                                                    <span className="text-gray-600">Freq: {m.frequency}</span>
                                                    <span className="text-gray-600">Duration: {m.duration}</span>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                ) : <span className="text-xs">No medicines assigned.</span>}
                                <button onClick={() => toggleExpand(customer.id)} className="mt-2 text-blue-600 text-xs font-semibold underline">
                                    Hide Medicines
                                </button>
                             </div>
                        ) : (
                             <button onClick={() => toggleExpand(customer.id)} className="text-blue-600 font-medium text-sm">
                                View Medicines ({customer.medicines?.length || 0})
                             </button>
                        )}
                    </div>
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