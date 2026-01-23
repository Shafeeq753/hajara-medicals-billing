
import React, { useState, useMemo, useRef } from 'react';
import { Purchase, Product, Supplier, PaymentRecord } from '../types';
import { TrashIcon, PlusIcon, SpinnerIcon, CameraIcon, BoxIcon, CashIcon } from './icons/Icons';
import Modal from './Modal';
import PaymentForm from './PaymentForm';

const PurchaseForm = ({
  stockBalance,
  savingsBalance,
  bankBalance,
  onSave,
  onCancel,
}: {
  stockBalance: number;
  savingsBalance: number;
  bankBalance: number;
  onSave: (purchase: any) => void;
  onCancel: () => void;
}) => {
  const [supplierName, setSupplierName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentChoice, setPaymentChoice] = useState<'Full' | 'Partial' | 'Later'>('Full');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Bank Transfer' | 'Savings'>('Bank Transfer');
  const [baseAmount, setBaseAmount] = useState('');
  const [roundOff, setRoundOff] = useState('0');
  const [partialPaidAmount, setPartialPaidAmount] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const netTotal = useMemo(() => {
    const amount = parseFloat(baseAmount) || 0;
    const extra = parseFloat(roundOff) || 0;
    return amount + extra;
  }, [baseAmount, roundOff]);

  const paidNowValue = useMemo(() => {
    if (paymentChoice === 'Full') return netTotal;
    if (paymentChoice === 'Partial') return parseFloat(partialPaidAmount) || 0;
    return 0;
  }, [paymentChoice, netTotal, partialPaidAmount]);

  const balanceDue = netTotal - paidNowValue;

  const currentAvailable = useMemo(() => {
    return paymentMethod === 'Cash' ? stockBalance : paymentMethod === 'Savings' ? savingsBalance : bankBalance;
  }, [paymentMethod, stockBalance, savingsBalance, bankBalance]);

  const isInsufficient = useMemo(() => {
    return (paymentChoice !== 'Later' && paidNowValue > currentAvailable);
  }, [paymentChoice, paidNowValue, currentAvailable]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!supplierName) return setErrorMessage("Please enter a supplier name.");
    if (!baseAmount || parseFloat(baseAmount) <= 0) return setErrorMessage("Please enter a valid bill amount.");
    
    if (paymentChoice === 'Partial' && (parseFloat(partialPaidAmount) <= 0 || !partialPaidAmount)) {
        return setErrorMessage("Please enter the amount you are paying partially.");
    }
    if (paymentChoice === 'Partial' && paidNowValue > netTotal) {
        return setErrorMessage("Partial payment cannot exceed the total amount.");
    }

    // Balance check
    if (isInsufficient) {
        setErrorMessage(`⚠️ Insufficient Funds! You only have ₹${currentAvailable.toFixed(2)} in ${paymentMethod === 'Cash' ? 'Stock' : paymentMethod}.`);
        return;
    }

    onSave({
        supplierId: `DAILY-${Date.now()}`, 
        supplierName: supplierName, 
        date, 
        paymentMethod: paymentChoice === 'Later' ? 'Credit' : paymentMethod,
        items: [], 
        total: netTotal,
        roundOff: parseFloat(roundOff) || 0,
        initialPaidAmount: paidNowValue
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex justify-between items-center border-b pb-4">
          <h3 className="text-2xl font-bold text-black">Quick Purchase Entry</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <label className="block text-sm font-bold mb-1 text-black">Supplier</label>
          <input 
            type="text" 
            value={supplierName} 
            onChange={e => { setSupplierName(e.target.value); setErrorMessage(''); }} 
            className="w-full p-3 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none text-black" 
            placeholder="Select Supplier" 
            required 
          />
        </div>
        <div>
          <label className="block text-sm font-bold mb-1 text-black">Date</label>
          <input 
            type="date" 
            value={date} 
            onChange={e => setDate(e.target.value)} 
            className="w-full p-3 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none text-black" 
            required 
          />
        </div>
      </div>

      <div className="p-5 bg-blue-50 rounded-xl border border-blue-100 space-y-5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex flex-col">
                  <span className="text-sm font-black text-black uppercase tracking-wide">PAYMENT ALLOCATION</span>
                  <p className="text-xs text-gray-600">Choose where the money comes from.</p>
              </div>
              <div className="flex bg-white p-1 rounded-xl shadow-sm border overflow-hidden">
                  <button type="button" onClick={() => { setPaymentChoice('Full'); setErrorMessage(''); }} className={`px-5 py-2.5 rounded-lg text-xs font-bold transition-all ${paymentChoice === 'Full' ? 'bg-blue-600 text-white shadow-lg' : 'text-black hover:bg-gray-50'}`}>Pay in Full</button>
                  <button type="button" onClick={() => { setPaymentChoice('Partial'); setErrorMessage(''); }} className={`px-5 py-2.5 rounded-lg text-xs font-bold transition-all ${paymentChoice === 'Partial' ? 'bg-blue-600 text-white shadow-lg' : 'text-black hover:bg-gray-50'}`}>Pay Partial</button>
                  <button type="button" onClick={() => { setPaymentChoice('Later'); setErrorMessage(''); }} className={`px-5 py-2.5 rounded-lg text-xs font-bold transition-all ${paymentChoice === 'Later' ? 'bg-blue-600 text-white shadow-lg' : 'text-black hover:bg-gray-50'}`}>Pay Later</button>
              </div>
          </div>

          {(paymentChoice === 'Full' || paymentChoice === 'Partial') && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-blue-100 animate-fade-in">
                  <div>
                      <label className="block text-sm font-bold text-black mb-1">Fund Source</label>
                      <select value={paymentMethod} onChange={e => { setPaymentMethod(e.target.value as any); setErrorMessage(''); }} className="w-full p-3 border rounded-lg bg-white text-sm focus:ring-2 focus:ring-blue-500 outline-none text-black font-medium">
                          <option value="Bank Transfer">Bank Account (₹{bankBalance.toFixed(2)})</option>
                          <option value="Cash">Counter Cash (₹{stockBalance.toFixed(2)})</option>
                          <option value="Savings">Savings Reserve (₹{savingsBalance.toFixed(2)})</option>
                      </select>
                  </div>
                  {paymentChoice === 'Partial' && (
                    <div>
                        <label className="block text-sm font-bold text-black mb-1">Amount to Pay Now (₹)</label>
                        <input 
                            type="number" 
                            step="0.01" 
                            value={partialPaidAmount} 
                            onChange={e => { setPartialPaidAmount(e.target.value); setErrorMessage(''); }} 
                            className="w-full p-3 border rounded-lg bg-white text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none text-black" 
                            placeholder="Enter amount" 
                            required
                        />
                    </div>
                  )}
              </div>
          )}
      </div>

      <div className="border-t pt-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                  <label className="block text-sm font-bold mb-1 text-black">Total Bill Amount (₹)</label>
                  <input 
                      type="number" 
                      step="0.01" 
                      value={baseAmount} 
                      onChange={e => { setBaseAmount(e.target.value); setErrorMessage(''); }} 
                      className="w-full p-4 border rounded-xl text-xl font-bold bg-white focus:ring-2 focus:ring-blue-500 outline-none text-black" 
                      placeholder="0.00" 
                      required
                  />
              </div>
              <div>
                  <label className="block text-sm font-bold mb-1 text-black">Extras / Adjustments (₹)</label>
                  <input 
                      type="number" 
                      step="0.01" 
                      value={roundOff} 
                      onChange={e => { setRoundOff(e.target.value); setErrorMessage(''); }} 
                      className="w-full p-4 border rounded-xl text-xl font-bold bg-white focus:ring-2 focus:ring-blue-500 outline-none text-black" 
                      placeholder="0.00" 
                  />
              </div>
          </div>

          <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 space-y-3">
              <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500 font-medium">Net Bill Value:</span>
                  <span className="font-bold text-lg text-black">₹{netTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                  <span className="text-green-600 font-medium">Payment Recorded:</span>
                  <span className="font-bold text-green-700">₹{paidNowValue.toFixed(2)} ({paymentChoice === 'Later' ? 'Credit' : paymentMethod})</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                  <span className="font-black text-xl text-black">OUTSTANDING:</span> 
                  <span className={`font-black text-2xl ${balanceDue > 0 ? 'text-red-600' : 'text-blue-700'}`}>₹{balanceDue.toFixed(2)}</span>
              </div>
          </div>
      </div>

      {errorMessage && (
        <div className="p-4 bg-red-100 border border-red-200 text-red-700 rounded-xl font-bold text-sm animate-pulse">
            {errorMessage}
        </div>
      )}

      <div className="flex justify-end gap-3 pt-6 border-t">
        <button type="button" onClick={onCancel} className="px-8 py-3 bg-gray-100 rounded-xl font-bold transition-colors hover:bg-gray-200 text-black">Cancel</button>
        <button 
            type="submit" 
            disabled={isInsufficient && paymentChoice !== 'Later'}
            className={`px-8 py-3 rounded-xl font-bold shadow-lg transition-all active:scale-95 ${isInsufficient && paymentChoice !== 'Later' ? 'bg-gray-400 cursor-not-allowed text-white' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
        >
            Record Entry
        </button>
      </div>
    </form>
  );
};

const DailyPurchases = ({ purchases, onAddPurchase, onUpdatePayment, products, suppliers, onDeletePurchase, stockBalance, savingsBalance, bankBalance }: any) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [paymentModalPurchase, setPaymentModalPurchase] = useState<Purchase | null>(null);
    const [historyModalPurchase, setHistoryModalPurchase] = useState<Purchase | null>(null);
    const [showLaterOnly, setShowLaterOnly] = useState(false);

    const todayStr = new Date().toISOString().split('T')[0];
    const dailyItems = useMemo(() => {
        let items = purchases.filter((p: any) => p.date === todayStr);
        if (showLaterOnly) items = items.filter((p: any) => p.paymentStatus !== 'Paid');
        return items;
    }, [purchases, showLaterOnly, todayStr]);

    const handleSaveInstallment = (purchaseId: string, paymentRecord: Omit<PaymentRecord, 'id'>) => {
        onUpdatePayment(purchaseId, paymentRecord);
        setPaymentModalPurchase(null);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-black text-black">Daily Purchases</h2>
                    <p className="text-sm text-gray-500">Inventory cost additions for {new Date().toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                     <button 
                        onClick={() => setShowLaterOnly(!showLaterOnly)} 
                        className={`flex-1 md:flex-none px-4 py-2 rounded-xl text-xs font-bold transition-all border ${showLaterOnly ? 'bg-red-100 border-red-200 text-red-700' : 'bg-white text-gray-600'}`}
                    >
                        {showLaterOnly ? 'Unpaid Only' : 'Show Outstanding'}
                    </button>
                    <button onClick={() => setIsModalOpen(true)} className="flex-1 md:flex-none bg-blue-600 text-white px-6 py-2 rounded-xl shadow-lg font-bold flex items-center justify-center gap-2 transition-transform active:scale-95">
                        <PlusIcon /> Quick Entry
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 border-b text-[10px] font-black uppercase text-gray-500 tracking-wider">
                            <tr>
                                <th className="px-6 py-4">ID</th>
                                <th className="px-6 py-4">Supplier</th>
                                <th className="px-6 py-4">Payment</th>
                                <th className="px-6 py-4 text-right">Total</th>
                                <th className="px-6 py-4 text-right">Paid</th>
                                <th className="px-6 py-4 text-right">Balance</th>
                                <th className="px-6 py-4 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {dailyItems.map((p: any) => {
                                const balance = p.total - p.paidAmount;
                                return (
                                    <tr key={p.id} className="hover:bg-gray-50 transition-all">
                                        <td className="px-6 py-4 font-medium text-gray-400">
                                          <button onClick={() => setHistoryModalPurchase(p)} className="hover:underline">
                                            {p.id.slice(-6)}
                                          </button>
                                        </td>
                                        <td className="px-6 py-4 font-bold text-black">{p.supplierName}</td>
                                        <td className="px-6 py-4">
                                            <button onClick={() => setHistoryModalPurchase(p)}>
                                              <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase ${p.paymentStatus === 'Paid' ? 'bg-green-100 text-green-700' : (p.paymentStatus === 'Partially Paid' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700')}`}>
                                                  {p.paymentStatus}
                                              </span>
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 text-right font-medium text-black">₹{p.total.toFixed(2)}</td>
                                        <td className="px-6 py-4 text-right text-green-600 font-bold">
                                          <button onClick={() => setHistoryModalPurchase(p)} className="hover:underline">
                                            ₹{p.paidAmount.toFixed(2)}
                                          </button>
                                        </td>
                                        <td className="px-6 py-4 text-right text-red-600 font-black">₹{balance.toFixed(2)}</td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex justify-center gap-2">
                                                {p.paymentStatus !== 'Paid' && (
                                                    <button onClick={() => setPaymentModalPurchase(p)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Pay Balance">
                                                        <CashIcon />
                                                    </button>
                                                )}
                                                <button onClick={() => onDeletePurchase(p.id)} className="p-2 text-gray-200 hover:text-red-600 transition-colors"><TrashIcon /></button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                {dailyItems.length === 0 && (
                    <div className="p-20 text-center flex flex-col items-center gap-3">
                        <div className="p-4 bg-gray-50 rounded-full text-gray-300"><BoxIcon /></div>
                        <p className="text-gray-500 font-bold">No purchase records found for today.</p>
                        <button onClick={() => setIsModalOpen(true)} className="text-blue-600 hover:underline text-sm font-bold">Add your first entry &rarr;</button>
                    </div>
                )}
            </div>

            {isModalOpen && (
                <Modal title="New Daily Entry" onClose={() => setIsModalOpen(false)} size="lg">
                    <PurchaseForm 
                        stockBalance={stockBalance}
                        savingsBalance={savingsBalance}
                        bankBalance={bankBalance}
                        onSave={(data: any) => { onAddPurchase(data); setIsModalOpen(false); }} 
                        onCancel={() => setIsModalOpen(false)}
                    />
                </Modal>
            )}

            {paymentModalPurchase && (
                <Modal title={`Adjust Payment: ${paymentModalPurchase.id.slice(-6)}`} onClose={() => setPaymentModalPurchase(null)}>
                    <PaymentForm
                        purchase={paymentModalPurchase}
                        stockAmount={stockBalance}
                        savingsBalance={savingsBalance}
                        bankBalance={bankBalance}
                        onSave={handleSaveInstallment}
                        onCancel={() => setPaymentModalPurchase(null)}
                    />
                </Modal>
            )}

            {historyModalPurchase && (
                <Modal title={`Payment Ledger: ${historyModalPurchase.id.slice(-6)}`} onClose={() => setHistoryModalPurchase(null)} size="lg">
                    <div className="space-y-4">
                        <div className="p-4 bg-gray-50 rounded-xl border text-sm grid grid-cols-2 gap-4">
                            <div>
                                <span className="text-[10px] font-black text-gray-400 uppercase block">Supplier</span>
                                <span className="font-bold text-black">{historyModalPurchase.supplierName}</span>
                            </div>
                            <div>
                                <span className="text-[10px] font-black text-gray-400 uppercase block">Total Bill</span>
                                <span className="font-bold text-black">₹{historyModalPurchase.total.toFixed(2)}</span>
                            </div>
                        </div>
                        
                        <div className="overflow-hidden border rounded-xl">
                            <table className="w-full text-xs text-left">
                                <thead className="bg-gray-100 border-b text-[10px] font-black uppercase text-gray-500">
                                    <tr>
                                        <th className="px-4 py-3">Date</th>
                                        <th className="px-4 py-3">Source</th>
                                        <th className="px-4 py-3 text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {historyModalPurchase.paymentHistory.map((h, idx) => (
                                        <tr key={h.id || idx}>
                                            <td className="px-4 py-3 text-gray-600 font-medium">{new Date(h.date).toLocaleDateString()}</td>
                                            <td className="px-4 py-3">
                                                <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold uppercase text-[9px]">{h.source}</span>
                                            </td>
                                            <td className="px-4 py-3 text-right font-black text-green-700">₹{h.amount.toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="bg-gray-50 border-t">
                                    <tr>
                                        <td colSpan={2} className="px-4 py-3 font-bold text-black text-right uppercase text-[10px]">Total Paid:</td>
                                        <td className="px-4 py-3 text-right font-black text-green-700 text-sm">₹{historyModalPurchase.paidAmount.toFixed(2)}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                        <div className="flex justify-end pt-2">
                            <button onClick={() => setHistoryModalPurchase(null)} className="px-6 py-2 bg-gray-100 rounded-xl font-bold hover:bg-gray-200">Close</button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default DailyPurchases;
