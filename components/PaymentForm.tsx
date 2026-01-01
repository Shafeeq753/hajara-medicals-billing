
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
    if (amount > balanceDue) {
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
        <div className="p-4 bg-gray-50 rounded-lg border text-sm">
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                <p><span className="font-semibold">Supplier:</span> {purchase.supplierName}</p>
                <p><span className="font-semibold">Total:</span> ₹{purchase.total.toFixed(2)}</p>
                <p><span className="font-semibold">Paid:</span> ₹{purchase.paidAmount.toFixed(2)}</p>
                <p className="font-bold text-black"><span className="font-semibold">Balance:</span> ₹{balanceDue.toFixed(2)}</p>
            </div>
        </div>
      
        <div>
            <label className="block text-sm font-medium text-black">Payment Type</label>
            <div className="mt-1 flex gap-4">
                <label className="flex items-center">
                    <input type="radio" name="paymentType" value="partial" checked={paymentType === 'partial'} onChange={handlePaymentTypeChange} className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300" />
                    <span className="ml-2 text-black">Partially Paid</span>
                </label>
                <label className="flex items-center">
                    <input type="radio" name="paymentType" value="full" checked={paymentType === 'full'} onChange={handlePaymentTypeChange} className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300" />
                    <span className="ml-2 text-black">Fully Paid</span>
                </label>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
              <label className="block text-sm font-medium text-black">Amount Paid (₹)</label>
              <input 
                  type="number" 
                  step="0.01" 
                  value={amountPaid} 
                  onChange={e => setAmountPaid(e.target.value)} 
                  className="mt-1 block w-full p-2 bg-white border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" 
                  required
                  readOnly={paymentType === 'full'}
              />
          </div>
          <div>
              <label className="block text-sm font-medium text-black">Payment Source</label>
              <select 
                value={source} 
                onChange={e => setSource(e.target.value as any)} 
                className="mt-1 block w-full p-2 bg-white border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              >
                  <option value="Stock">Savings (Stock)</option>
                  <option value="Bank">Bank</option>
              </select>
          </div>
        </div>

        <div>
            <label className="block text-sm font-medium text-black">Payment Date</label>
            <input 
                type="date" 
                value={paymentDate} 
                onChange={e => setPaymentDate(e.target.value)} 
                className="mt-1 block w-full p-2 bg-white border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" 
                required 
            />
        </div>

        <div>
            <label className="block text-sm font-medium text-black">Upload Screenshot (Optional)</label>
            <input 
                type="file" 
                accept="image/*"
                onChange={handleFileChange}
                className="mt-1 block w-full text-sm text-black file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-black hover:file:bg-blue-100" 
            />
            {screenshot && (
                <div className="mt-2">
                    <img src={screenshot} alt="Screenshot preview" className="max-h-32 rounded-md border" />
                </div>
            )}
        </div>
        
        {error && <p className="text-sm text-black">{error}</p>}
        
        <div className="flex justify-end gap-2 pt-4 border-t mt-4">
            <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-200 text-black rounded-md hover:bg-gray-300">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Save Payment</button>
        </div>
    </form>
  );
};

export default PaymentForm;
