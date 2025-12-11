
import React, { useState, useMemo } from 'react';
import { Sale } from '../types';
import Modal from './Modal';
import { PlusIcon, TrashIcon, CurrencyIcon } from './icons/Icons';

// New Sale Form component for the modal
const SaleForm = ({ onSave, onCancel }: {
  onSave: (sale: Omit<Sale, 'id'>) => void;
  onCancel: () => void;
}) => {
  const [amount, setAmount] = useState('');
  const [bank, setBank] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [savings, setSavings] = useState('0');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !date) {
      alert('Amount and Date are required.');
      return;
    }
    onSave({
      amount: parseFloat(amount),
      bank: parseFloat(bank) || 0,
      date,
      savings: parseFloat(savings) || 0,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-black">Amount (₹)</label>
        <input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} className="mt-1 block w-full p-2 bg-white border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" required />
      </div>
      <div>
        <label className="block text-sm font-medium text-black">Bank (₹)</label>
        <input type="number" step="0.01" value={bank} onChange={e => setBank(e.target.value)} className="mt-1 block w-full p-2 bg-white border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
      </div>
      <div>
        <label className="block text-sm font-medium text-black">Date</label>
        <input type="date" value={date} onChange={e => setDate(e.target.value)} className="mt-1 block w-full p-2 bg-white border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" required />
      </div>
      <div>
        <label className="block text-sm font-medium text-black">Savings (Optional, ₹)</label>
        <input type="number" step="0.01" value={savings} onChange={e => setSavings(e.target.value)} className="mt-1 block w-full p-2 bg-white border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
      </div>
      <div className="flex justify-end gap-2 pt-4 border-t mt-4">
        <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-200 text-black rounded-md hover:bg-gray-300">Cancel</button>
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Save Sale</button>
      </div>
    </form>
  );
};

// Main Sales component
interface SalesProps {
  sales: Sale[];
  onAddSale: (sale: Omit<Sale, 'id'>) => void;
  onDeleteSale: (saleId: string) => void;
  stockAmount: number;
}

const Sales = ({ sales, onAddSale, onDeleteSale, stockAmount }: SalesProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredSales = useMemo(() => {
     return sales.filter(s => 
        s.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.date.includes(searchTerm)
     );
  }, [sales, searchTerm]);

  const handleSaveSale = (sale: Omit<Sale, 'id'>) => {
    onAddSale(sale);
    setIsModalOpen(false);
  };

  const handleDeleteClick = (saleId: string) => {
    if (window.confirm(`Are you sure you want to delete sale ${saleId}? This action cannot be undone.`)) {
      onDeleteSale(saleId);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-black">Recent Sales</h2>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-blue-700 flex items-center gap-2"
        >
          <PlusIcon /> Add Sales / Billing
        </button>
      </div>
      
      <div className={`p-6 rounded-xl shadow-lg flex items-center space-x-4 ${stockAmount >= 0 ? 'bg-white' : 'bg-red-50'}`}>
        <div className={`p-3 rounded-full ${stockAmount >= 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
          <CurrencyIcon />
        </div>
        <div>
          <p className="text-sm font-medium text-black">Total Savings (Stock Amount)</p>
          <p className={`text-2xl font-bold ${stockAmount >= 0 ? 'text-black' : 'text-red-600'}`}>₹{stockAmount.toFixed(2)}</p>
        </div>
      </div>

      <div className="bg-white p-2 md:p-6 rounded-xl shadow-lg">
        <div>
          <input
            type="text"
            placeholder="Search by ID or Date..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full max-w-sm p-2 bg-white border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 mb-4"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left responsive-table">
            <thead className="text-xs text-black uppercase bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3">Sale ID</th>
                <th scope="col" className="px-6 py-3">Date</th>
                <th scope="col" className="px-6 py-3 text-right">Amount</th>
                <th scope="col" className="px-6 py-3 text-right">Bank</th>
                <th scope="col" className="px-6 py-3 text-right">Savings</th>
                <th scope="col" className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSales.map(sale => (
                <tr key={sale.id} className="bg-white border-b hover:bg-gray-50">
                  <td data-label="Sale ID" className="px-6 py-4 font-medium text-black whitespace-nowrap">{sale.id}</td>
                  <td data-label="Date" className="px-6 py-4">{new Date(sale.date).toLocaleDateString()}</td>
                  <td data-label="Amount" className="px-6 py-4 font-semibold text-black text-right">₹{sale.amount.toFixed(2)}</td>
                  <td data-label="Bank" className="px-6 py-4 text-black text-right">₹{sale.bank.toFixed(2)}</td>
                  <td data-label="Savings" className="px-6 py-4 text-black text-right">₹{sale.savings.toFixed(2)}</td>
                  <td data-label="Actions" className="px-6 py-4 text-right">
                    <button onClick={() => handleDeleteClick(sale.id)} className="text-black hover:text-black">
                      <TrashIcon />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredSales.length === 0 && <p className="text-center text-black py-4">No sales found.</p>}
        </div>
      </div>

      {isModalOpen && (
        <Modal title="Add New Sale / Billing" onClose={() => setIsModalOpen(false)}>
          <SaleForm onSave={handleSaveSale} onCancel={() => setIsModalOpen(false)} />
        </Modal>
      )}
    </div>
  );
};

export default Sales;