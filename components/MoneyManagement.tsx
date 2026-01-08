
import React, { useState, useMemo } from 'react';
import { MoneyTransaction, Sale, Bill, Purchase } from '../types';
import Modal from './Modal';
import { PlusIcon, EditIcon, TransferIcon, CashIcon, AccountsIcon, TrashIcon } from './icons/Icons';

interface MoneyManagementProps {
  moneyTransactions: MoneyTransaction[];
  sales: Sale[];
  bills: Bill[];
  purchases: Purchase[];
  stockBalance: number;
  bankBalance: number;
  onAddTransaction: (tx: Omit<MoneyTransaction, 'id'>) => void;
  onUpdateTransaction: (tx: MoneyTransaction) => void;
  onDeleteTransaction: (txId: string) => void;
  onUpdateSale: (sale: Sale) => void;
  onUpdateBill: (bill: Bill) => void;
  onTransfer: (from: 'Stock' | 'Bank', to: 'Stock' | 'Bank', amount: number) => void;
}

const MoneyManagement = ({ 
  moneyTransactions, 
  sales, 
  bills, 
  purchases, 
  stockBalance, 
  bankBalance,
  onAddTransaction,
  onUpdateTransaction,
  onDeleteTransaction,
  onUpdateSale,
  onUpdateBill,
  onTransfer
}: MoneyManagementProps) => {
  const [activeTab, setActiveTab] = useState<'stock' | 'bank' | 'transfer'>('stock');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);

  // Form states for Adjustments
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [txType, setTxType] = useState<'Stock' | 'Bank'>('Stock');

  // Form states for Sale Edit
  const [saleSavings, setSaleSavings] = useState('');
  const [saleBank, setSaleBank] = useState('');

  // Form states for Bill Edit
  const [billTotal, setBillTotal] = useState('');

  // Transfer states
  const [transferAmount, setTransferAmount] = useState('');
  const [fromAccount, setFromAccount] = useState<'Stock' | 'Bank'>('Stock');

  const ledgers = useMemo(() => {
    const stockLedger: any[] = [
      ...sales.map(s => ({ id: s.id, date: s.date, amount: s.savings, category: 'Sale', description: `Savings from ${s.id}`, originalItem: s })),
      ...moneyTransactions.filter(t => t.type === 'Stock').map(t => ({ ...t })),
      ...purchases.flatMap(p => p.paymentHistory.filter(h => h.source === 'Stock').map(h => ({
        id: h.id, date: h.date, amount: -h.amount, category: 'Purchase', description: `Payment to ${p.supplierName} (${p.id})`
      })))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const bankLedger: any[] = [
      ...sales.map(s => ({ id: s.id, date: s.date, amount: s.bank, category: 'Sale', description: `Bank deposit from ${s.id}`, originalItem: s })),
      ...bills.map(b => ({ id: b.id, date: b.date, amount: b.grandTotal, category: 'Bill', description: `Invoice collection from ${b.patientName} (${b.billNumber})`, originalItem: b })),
      ...moneyTransactions.filter(t => t.type === 'Bank').map(t => ({ ...t })),
      ...purchases.flatMap(p => p.paymentHistory.filter(h => h.source === 'Bank').map(h => ({
        id: h.id, date: h.date, amount: -h.amount, category: 'Purchase', description: `Bank payment to ${p.supplierName} (${p.id})`
      })))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return { stockLedger, bankLedger };
  }, [sales, bills, moneyTransactions, purchases]);

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // If editingItem is null, it's a NEW manual entry (Adjustment)
    if (!editingItem) {
      onAddTransaction({ 
        date, 
        amount: parseFloat(amount) || 0, 
        description, 
        type: txType, 
        category: 'Adjustment' 
      });
      resetForm();
      return;
    }

    // Otherwise, handle the specific category update
    if (editingItem.category === 'Sale') {
      const updatedSale = { 
        ...editingItem.originalItem, 
        savings: parseFloat(saleSavings) || 0, 
        bank: parseFloat(saleBank) || 0 
      };
      onUpdateSale(updatedSale);
    } else if (editingItem.category === 'Bill') {
      const updatedBill = { 
        ...editingItem.originalItem, 
        grandTotal: parseFloat(billTotal) || 0 
      };
      onUpdateBill(updatedBill);
    } else if (editingItem.category === 'Adjustment' || editingItem.category === 'Transfer') {
      onUpdateTransaction({ 
        ...editingItem, 
        date, 
        amount: parseFloat(amount) * (editingItem.amount < 0 ? -1 : 1), 
        description, 
        type: txType 
      });
    }
    resetForm();
  };

  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(transferAmount);
    if (isNaN(val) || val <= 0) return;
    const toAccount = fromAccount === 'Stock' ? 'Bank' : 'Stock';
    onTransfer(fromAccount, toAccount, val);
    setTransferAmount('');
  };

  const handleDelete = (tx: any) => {
    if (tx.id && (tx.category === 'Adjustment' || tx.category === 'Transfer')) {
        if (window.confirm("Are you sure you want to delete this manual adjustment?")) {
            onDeleteTransaction(tx.id);
        }
    } else {
        alert("Standard Sale/Bill/Purchase records can only be deleted from their respective management tabs (Accounts > Manage Sales or Manage Bills).");
    }
  };

  const resetForm = () => {
    setEditingItem(null);
    setAmount('');
    setDescription('');
    setSaleSavings('');
    setSaleBank('');
    setBillTotal('');
    setIsModalOpen(false);
  };

  const openEdit = (tx: any) => {
    setEditingItem(tx);
    if (tx.category === 'Sale') {
      setSaleSavings(tx.originalItem.savings.toString());
      setSaleBank(tx.originalItem.bank.toString());
    } else if (tx.category === 'Bill') {
      setBillTotal(tx.originalItem.grandTotal.toString());
    } else {
      setDate(tx.date);
      setAmount(Math.abs(tx.amount).toString());
      setDescription(tx.description);
      setTxType(tx.type);
    }
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-3xl font-bold text-black">Money Management</h2>
        <div className="flex bg-gray-200 p-1 rounded-xl shadow-inner w-full sm:w-auto">
          <button onClick={() => setActiveTab('stock')} className={`flex-1 sm:flex-none px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'stock' ? 'bg-white text-blue-600 shadow-md' : 'text-gray-600'}`}>Stock (Savings)</button>
          <button onClick={() => setActiveTab('bank')} className={`flex-1 sm:flex-none px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'bank' ? 'bg-white text-blue-600 shadow-md' : 'text-gray-600'}`}>Bank</button>
          <button onClick={() => setActiveTab('transfer')} className={`flex-1 sm:flex-none px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'transfer' ? 'bg-white text-blue-600 shadow-md' : 'text-gray-600'}`}>Transfer</button>
        </div>
      </div>

      {activeTab === 'transfer' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><TransferIcon /> New Transfer</h3>
            <form onSubmit={handleTransferSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${fromAccount === 'Stock' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`} onClick={() => setFromAccount('Stock')}>
                  <p className="text-xs text-gray-500 uppercase font-bold mb-1">From Stock</p>
                  <p className="font-bold">₹{stockBalance.toFixed(2)}</p>
                </div>
                <div className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${fromAccount === 'Bank' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`} onClick={() => setFromAccount('Bank')}>
                  <p className="text-xs text-gray-500 uppercase font-bold mb-1">From Bank</p>
                  <p className="font-bold">₹{bankBalance.toFixed(2)}</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold mb-2">Transfer Amount (₹)</label>
                <input type="number" step="0.01" value={transferAmount} onChange={e => setTransferAmount(e.target.value)} className="w-full p-4 border rounded-xl text-xl font-bold focus:ring-2 focus:ring-blue-500 bg-white" placeholder="0.00" required />
              </div>
              <p className="text-sm text-gray-500 text-center">Transferring to <span className="font-bold text-black">{fromAccount === 'Stock' ? 'Bank' : 'Stock'}</span></p>
              <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold shadow-lg hover:bg-blue-700 active:scale-95 transition-all">Execute Transfer</button>
            </form>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100 h-[500px] overflow-hidden flex flex-col">
            <h3 className="text-lg font-bold mb-4">Transfer History</h3>
            <div className="flex-1 overflow-y-auto space-y-3 pr-2">
              {moneyTransactions.filter(t => t.category === 'Transfer').map(t => (
                <div key={t.id} className={`p-4 rounded-xl border flex justify-between items-center ${t.amount < 0 ? 'bg-red-50 border-red-100' : 'bg-green-50 border-green-100'}`}>
                  <div className="flex-1">
                    <p className="font-bold text-sm">{t.description}</p>
                    <p className="text-xs text-gray-500">{new Date(t.date).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className={`font-bold ${t.amount < 0 ? 'text-red-600' : 'text-green-600'}`}>{t.amount > 0 ? '+' : ''}₹{t.amount.toFixed(2)}</p>
                    <button onClick={() => handleDelete(t)} className="text-gray-400 hover:text-red-600 transition-colors p-1"><TrashIcon /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-lg border-l-8 border-blue-600 flex justify-between items-center">
              <div>
                <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">{activeTab === 'stock' ? 'Current Savings' : 'Bank Balance'}</p>
                <p className="text-3xl font-black text-black">₹{(activeTab === 'stock' ? stockBalance : bankBalance).toFixed(2)}</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-2xl text-blue-600">
                {activeTab === 'stock' ? <CashIcon /> : <AccountsIcon />}
              </div>
            </div>
            <button 
              onClick={() => { setEditingItem(null); setTxType(activeTab === 'stock' ? 'Stock' : 'Bank'); setIsModalOpen(true); }}
              className="bg-white p-6 rounded-2xl shadow-lg border border-dashed border-gray-300 flex flex-col items-center justify-center gap-2 hover:border-blue-500 hover:bg-blue-50 group transition-all"
            >
              <div className="p-2 bg-gray-100 rounded-full group-hover:bg-blue-100 group-hover:text-blue-600"><PlusIcon /></div>
              <p className="font-bold text-gray-600 group-hover:text-blue-600 text-sm">Add Adjustment / Orphan stock</p>
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
             <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Description</th>
                    <th className="px-6 py-4 text-right">Amount</th>
                    <th className="px-6 py-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(activeTab === 'stock' ? ledgers.stockLedger : ledgers.bankLedger).map((tx, idx) => (
                    <tr key={tx.id || idx} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">{new Date(tx.date).toLocaleDateString()}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                          tx.category === 'Sale' ? 'bg-green-100 text-green-700' :
                          tx.category === 'Purchase' ? 'bg-red-100 text-red-700' :
                          tx.category === 'Bill' ? 'bg-blue-100 text-blue-700' :
                          'bg-purple-100 text-purple-700'
                        }`}>
                          {tx.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-800 font-medium">{tx.description}</td>
                      <td className={`px-6 py-4 text-right font-bold ${tx.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {tx.amount > 0 ? '+' : ''}₹{tx.amount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center gap-1">
                          {tx.category !== 'Purchase' && (
                            <button onClick={() => openEdit(tx)} className="p-2 text-gray-400 hover:text-blue-600 transition-colors">
                                <EditIcon />
                            </button>
                          )}
                          {(tx.category === 'Adjustment' || tx.category === 'Manual' || tx.category === 'Transfer') && (
                            <button onClick={() => handleDelete(tx)} className="p-2 text-gray-400 hover:text-red-600 transition-colors">
                                <TrashIcon />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
             </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <Modal title={editingItem ? `Edit ${editingItem.category}` : `Manual ${txType} Entry`} onClose={resetForm}>
          <form onSubmit={handleSaveEdit} className="space-y-4">
            {editingItem?.category === 'Sale' ? (
              <div className="space-y-4">
                <p className="text-xs bg-blue-50 p-2 rounded text-blue-800">You are editing the financial breakdown for Sale: <b>{editingItem.id}</b></p>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Savings Component (₹)</label>
                  <input type="number" step="0.01" value={saleSavings} onChange={e => setSaleSavings(e.target.value)} className="w-full p-2 border rounded-lg bg-white" required />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Bank Component (₹)</label>
                  <input type="number" step="0.01" value={saleBank} onChange={e => setSaleBank(e.target.value)} className="w-full p-2 border rounded-lg bg-white" required />
                </div>
              </div>
            ) : editingItem?.category === 'Bill' ? (
               <div className="space-y-4">
                <p className="text-xs bg-blue-50 p-2 rounded text-blue-800">You are editing the total amount for Bill: <b>{editingItem.originalItem.billNumber}</b></p>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Grand Total (₹)</label>
                  <input type="number" step="0.01" value={billTotal} onChange={e => setBillTotal(e.target.value)} className="w-full p-2 border rounded-lg bg-white" required />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Date</label>
                  <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full p-2 border rounded-lg bg-white" required />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Amount (₹)</label>
                  <input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} className="w-full p-2 border rounded-lg text-lg font-bold bg-white" placeholder="0.00" required />
                </div>
                 <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Account</label>
                  <select value={txType} onChange={e => setTxType(e.target.value as any)} className="w-full p-2 border rounded-lg bg-white">
                    <option value="Stock">Stock (Savings)</option>
                    <option value="Bank">Bank</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Description</label>
                  <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full p-2 border rounded-lg bg-white" placeholder="Reason for adjustment..." required />
                </div>
              </div>
            )}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <button type="button" onClick={resetForm} className="px-6 py-2 bg-gray-100 rounded-lg font-bold">Cancel</button>
              <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold shadow-md hover:bg-blue-700 transition-all">
                {editingItem ? "Update Record" : "Save Entry"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default MoneyManagement;
