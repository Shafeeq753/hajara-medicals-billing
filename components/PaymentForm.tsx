
import React, { useState, useMemo } from 'react';
import { Purchase, PaymentRecord } from '../types';

interface PaymentFormProps {
  purchase: Purchase;
  onSave: (purchaseId: string, paymentRecord: Omit<PaymentRecord, 'id'>) => void;
  onCancel: () => void;
}

const PaymentForm = ({ purchase, onSave, onCancel }: PaymentFormProps) => {
  const [paymentType, setPaymentType] = useState<'partial' | 'full'>('partial');
  const [amountPaid, setAmountPaid] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [source, setSource] = useState<'Stock' | 'Bank'>('Stock');
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [error, setError] = useState('');

  const balanceDue = useMemo(() => purchase.total - purchase.paidAmount, [purchase]);

  const handlePaymentTypeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const type = e.target.value as 'partial' | 'full';
    setPaymentType(type);
    if (type === 'full') {
      setAmountPaid(balanceDue.toFixed(2));
    } else {
      setAmountPaid('');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setScreenshot(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const amount = parseFloat(amountPaid);

    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid amount.');
      return;
    }
    if (amount > balanceDue + 0.01) { // Adding small epsilon for floating point
      setError(`Amount cannot be greater than the balance due of ₹${balanceDue.toFixed(2)}.`);
      return;
    }
    if (!paymentDate) {
        setError('Please select a payment date.');
        return;
    }

    const newPaymentRecord: Omit<PaymentRecord, 'id'> = {
        date: paymentDate,
        amount: amount,
        source: source,
        ...(screenshot && { screenshotUrl: screenshot }),
    };

    onSave(purchase.id, newPaymentRecord);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-4 bg-gray-50 rounded-xl border text-sm space-y-2">
            <div className="flex justify-between items-center">
                <span className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Total Order Amount</span>
                <span className="font-black text-lg">₹{purchase.total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                <span className="text-green-600 font-bold uppercase tracking-widest text-[10px]">Previously Paid</span>
                <span className="font-bold text-green-700 text-md">₹{purchase.paidAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center pt-1">
                <span className="text-red-600 font-black uppercase tracking-widest text-xs">Remaining Balance</span>
                <span className="font-black text-2xl text-red-600">₹{balanceDue.toFixed(2)}</span>
            </div>
        </div>

        {purchase.paymentHistory.length > 0 && (
          <div className="p-3 bg-white border rounded-xl">
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Payment History</h4>
            <div className="max-h-24 overflow-y-auto space-y-1 pr-1">
              {purchase.paymentHistory.map((h, idx) => (
                <div key={h.id || idx} className="text-xs flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                  <div className="flex flex-col">
                    <span className="font-bold text-black">{new Date(h.date).toLocaleDateString()}</span>
                    <span className="text-[10px] text-gray-500">{h.source}</span>
                  </div>
                  <span className="font-black text-blue-700">₹{h.amount.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      
        <div className="pt-2">
            <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Next Payment Mode</label>
            <div className="flex bg-gray-100 p-1 rounded-xl gap-1">
                <button 
                  type="button" 
                  onClick={() => handlePaymentTypeChange({ target: { value: 'partial' } } as any)} 
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${paymentType === 'partial' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`}
                >
                  Pay Installment
                </button>
                <button 
                  type="button" 
                  onClick={() => handlePaymentTypeChange({ target: { value: 'full' } } as any)} 
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${paymentType === 'full' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`}
                >
                  Pay Full Remaining
                </button>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
              <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1">Paying Amount (₹)</label>
              <input 
                  type="number" 
                  step="0.01" 
                  value={amountPaid} 
                  onChange={e => setAmountPaid(e.target.value)} 
                  className="w-full p-3 border rounded-xl text-lg font-black bg-white focus:ring-2 focus:ring-blue-500 outline-none" 
                  required
                  placeholder="0.00"
                  readOnly={paymentType === 'full'}
              />
          </div>
          <div>
              <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1">Pay Through</label>
              <select 
                value={source} 
                onChange={e => setSource(e.target.value as any)} 
                className="w-full p-3 border rounded-xl text-sm font-bold bg-white focus:ring-2 focus:ring-blue-500 outline-none"
              >
                  <option value="Stock">Cash (Stock)</option>
                  <option value="Bank">Bank Transfer</option>
              </select>
          </div>
        </div>

        <div>
            <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1">Payment Date</label>
            <input 
                type="date" 
                value={paymentDate} 
                onChange={e => setPaymentDate(e.target.value)} 
                className="w-full p-2 border rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none" 
                required 
            />
        </div>

        <div>
            <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1">Receipt / Proof (Optional)</label>
            <input 
                type="file" 
                accept="image/*"
                onChange={handleFileChange}
                className="block w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-black file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" 
            />
            {screenshot && (
                <div className="mt-2">
                    <img src={screenshot} alt="Screenshot preview" className="max-h-24 rounded-lg border object-cover w-full" />
                </div>
            )}
        </div>
        
        {error && <p className="text-xs font-bold text-red-600 text-center bg-red-50 p-2 rounded-lg">{error}</p>}
        
        <div className="flex justify-end gap-2 pt-4 border-t mt-4">
            <button type="button" onClick={onCancel} className="px-6 py-2 bg-gray-100 text-black rounded-xl font-bold transition-colors hover:bg-gray-200">Cancel</button>
            <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-xl font-bold shadow-lg hover:bg-blue-700 transition-all active:scale-95">Record Payment</button>
        </div>
    </form>
  );
};

export default PaymentForm;
