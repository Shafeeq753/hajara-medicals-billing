
import React, { useState, useMemo } from 'react';
import { Sale } from '../types';
import Modal from './Modal';
import { PlusIcon, TrashIcon, CurrencyIcon, AccountsIcon, BoxIcon } from './icons/Icons';

// New Sale Form component for the modal
const SaleForm = ({ onSave, onCancel }: {
  onSave: (sale: Omit<Sale, 'id'>) => void;
  onCancel: () => void;
}) => {
  const [cash, setCash] = useState('');
  const [bank, setBank] = useState('');
  const [savings, setSavings] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const total = useMemo(() => {
    return (parseFloat(cash) || 0) + (parseFloat(bank) || 0) + (parseFloat(savings) || 0);
  }, [cash, bank, savings]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (total <= 0) {
      alert('Total amount must be greater than zero.');
      return;
    }
    if (!date) {
      alert('Date is required.');
      return;
    }
    onSave({
      cash: parseFloat(cash) || 0,
      bank: parseFloat(bank) || 0,
      savings: parseFloat(savings) || 0,
      amount: total,
      date,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-bold text-black">Cash in Counter (₹)</label>
        <input type="number" step="0.01" value={cash} onChange={e => setCash(e.target.value)} className="mt-1 block w-full p-2 bg-white border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-black font-bold" placeholder="0.00" />
      </div>
      <div>
        <label className="block text-sm font-bold text-black">Bank Transfer (₹)</label>
        <input type="number" step="0.01" value={bank} onChange={e => setBank(e.target.value)} className="mt-1 block w-full p-2 bg-white border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-black font-bold" placeholder="0.00" />
      </div>
      <div>
        <label className="block text-sm font-bold text-black">Savings / Reserve (₹)</label>
        <input type="number" step="0.01" value={savings} onChange={e => setSavings(e.target.value)} className="mt-1 block w-full p-2 bg-white border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-black font-bold" placeholder="0.00" />
      </div>
      <div>
        <label className="block text-sm font-bold text-black">Sale Date</label>
        <input type="date" value={date} onChange={e => setDate(e.target.value)} className="mt-1 block w-full p-2 bg-white border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-black" required />
      </div>
      
      <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex justify-between items-center mt-6">
          <span className="font-black text-black text-lg uppercase tracking-widest">Total Daily Sale:</span>
          <span className="text-2xl font-black text-blue-600">₹{total.toFixed(2)}</span>
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t mt-4">
        <button type="button" onClick={onCancel} className="px-6 py-2 bg-gray-200 text-black rounded-lg font-bold transition-colors hover:bg-gray-300">Cancel</button>
        <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold shadow-lg hover:bg-blue-700 transition-all active:scale-95">Save Sale Entry</button>
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
  bankBalance: number;
  savingsBalance: number;
}

const Sales = ({ sales, onAddSale, onDeleteSale, stockAmount, bankBalance, savingsBalance }: SalesProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredSales = useMemo(() => {
     return sales.filter(s => 
        s.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.date.includes(searchTerm)
     ).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
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
        <h2 className="text-3xl font-bold text-black">Direct Sales Log</h2>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-blue-700 flex items-center gap-2"
        >
          <PlusIcon /> Add Sales Entry
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={`p-4 rounded-xl shadow-md flex items-center space-x-3 ${stockAmount >= 0 ? 'bg-white' : 'bg-red-50'}`}>
          <div className={`p-2 rounded-full ${stockAmount >= 0 ? 'bg-blue-100 text-blue-600' : 'bg-red-100 text-red-600'}`}>
            <CurrencyIcon />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-500 uppercase">Stock (Counter)</p>
            <p className={`text-lg font-bold ${stockAmount >= 0 ? 'text-black' : 'text-red-600'}`}>₹{stockAmount.toFixed(2)}</p>
          </div>
        </div>

        <div className={`p-4 rounded-xl shadow-md flex items-center space-x-3 ${savingsBalance >= 0 ? 'bg-white' : 'bg-red-50'}`}>
          <div className={`p-2 rounded-full ${savingsBalance >= 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
            <BoxIcon />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-500 uppercase">Savings</p>
            <p className={`text-lg font-bold ${savingsBalance >= 0 ? 'text-black' : 'text-red-600'}`}>₹{savingsBalance.toFixed(2)}</p>
          </div>
        </div>

        <div className={`p-4 rounded-xl shadow-md flex items-center space-x-3 ${bankBalance >= 0 ? 'bg-white' : 'bg-red-50'}`}>
          <div className={`p-2 rounded-full ${bankBalance >= 0 ? 'bg-purple-100 text-purple-600' : 'bg-red-100 text-red-600'}`}>
            <AccountsIcon />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-500 uppercase">Bank Balance</p>
            <p className={`text-lg font-bold ${bankBalance >= 0 ? 'text-black' : 'text-red-600'}`}>₹{bankBalance.toFixed(2)}</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-2 md:p-6 rounded-xl shadow-lg">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <input
            type="text"
            placeholder="Search by ID or Date..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full max-w-sm p-2 bg-white border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left responsive-table">
            <thead className="text-[10px] text-gray-400 uppercase bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3">Date</th>
                <th scope="col" className="px-6 py-3 text-right">Counter Cash</th>
                <th scope="col" className="px-6 py-3 text-right">Bank</th>
                <th scope="col" className="px-6 py-3 text-right">Savings</th>
                <th scope="col" className="px-6 py-3 text-right font-black">Day Total</th>
                <th scope="col" className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSales.map(sale => (
                <tr key={sale.id} className="bg-white border-b hover:bg-gray-50 transition-colors">
                  <td data-label="Date" className="px-6 py-4 font-bold text-black">{new Date(sale.date).toLocaleDateString()}</td>
                  <td data-label="Cash" className="px-6 py-4 text-gray-600 text-right">₹{(sale.cash || 0).toFixed(2)}</td>
                  <td data-label="Bank" className="px-6 py-4 text-gray-600 text-right">₹{(sale.bank || 0).toFixed(2)}</td>
                  <td data-label="Savings" className="px-6 py-4 text-gray-600 text-right">₹{(sale.savings || 0).toFixed(2)}</td>
                  <td data-label="Total Amount" className="px-6 py-4 font-black text-blue-700 text-right">₹{(sale.amount || 0).toFixed(2)}</td>
                  <td data-label="Actions" className="px-6 py-4 text-right">
                    <button onClick={() => handleDeleteClick(sale.id)} className="text-gray-300 hover:text-red-600 transition-colors">
                      <TrashIcon />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredSales.length === 0 && <div className="text-center text-gray-500 py-12">No sales entries matching your search.</div>}
        </div>
      </div>

      {isModalOpen && (
        <Modal title="Add New Sale Entry" onClose={() => setIsModalOpen(false)}>
          <SaleForm onSave={handleSaveSale} onCancel={() => setIsModalOpen(false)} />
        </Modal>
      )}
    </div>
  );
};

export default Sales;
