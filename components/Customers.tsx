
import React, { useState } from 'react';
import { Customer } from '../types';
import Modal from './Modal';
import { PlusIcon } from './icons/Icons';
import CustomerForm from './CustomerForm';

interface CustomersProps {
  customers: Customer[];
  onAddCustomer: (customer: Omit<Customer, 'id'>) => void;
}

const Customers: React.FC<CustomersProps> = ({ customers, onAddCustomer }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSaveCustomer = (customer: Omit<Customer, 'id'>) => {
    onAddCustomer(customer);
    setIsModalOpen(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-900">Customers</h2>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-blue-700 flex items-center gap-2"
        >
          <PlusIcon /> Add Customer
        </button>
      </div>

      <div className="bg-white p-2 md:p-6 rounded-xl shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left responsive-table">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="p-3 font-medium text-gray-800">Name</th>
                <th className="p-3 font-medium text-gray-800">Phone</th>
                <th className="p-3 font-medium text-gray-800">Address</th>
              </tr>
            </thead>
            <tbody>
              {customers.map(customer => (
                <tr key={customer.id}>
                  <td data-label="Name" className="font-semibold text-gray-900">{customer.name}</td>
                  <td data-label="Phone" className="text-gray-900">{customer.phone}</td>
                  <td data-label="Address" className="text-gray-700">{customer.address}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <Modal title="Add New Customer" onClose={() => setIsModalOpen(false)}>
          <CustomerForm onSave={handleSaveCustomer} onCancel={() => setIsModalOpen(false)} />
        </Modal>
      )}
    </div>
  );
};

export default Customers;