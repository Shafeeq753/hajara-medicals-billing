
import React, { useState, useMemo, useRef } from 'react';
import { Purchase, Product, Supplier, PaymentRecord } from '../types';
import { TrashIcon, PlusIcon, SpinnerIcon, CameraIcon, BoxIcon, CashIcon } from './icons/Icons';
import Modal from './Modal';
import PaymentForm from './PaymentForm';
import { GoogleGenAI, Type } from "@google/genai";

const PurchaseForm = ({
  products,
  suppliers,
  onSave,
  onCancel,
}: {
  products: Product[];
  suppliers: Supplier[];
  onSave: (purchase: any) => void;
  onCancel: () => void;
}) => {
  const [supplierId, setSupplierId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [invoiceNo, setInvoiceNo] = useState('');
  const [paymentChoice, setPaymentChoice] = useState<'Full' | 'Partial' | 'Later'>('Full');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Bank Transfer'>('Bank Transfer');
  const [baseAmount, setBaseAmount] = useState('');
  const [roundOff, setRoundOff] = useState('0');
  const [partialPaidAmount, setPartialPaidAmount] = useState('');
  
  const [isProcessing, setIsProcessing] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

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

  const handleAutofill = async (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setIsProcessing(true);
      try {
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
          const reader = new FileReader();
          const base64 = await new Promise((res) => {
              reader.onload = () => res((reader.result as string).split(',')[1]);
              reader.readAsDataURL(file);
          });
          const response = await ai.models.generateContent({
              model: 'gemini-3-flash-preview',
              contents: { parts: [{ inlineData: { data: base64, mimeType: file.type } }, { text: "Parse this pharmacy purchase bill. Extract the total amount, supplier, invoice, date." }] },
              config: { 
                responseMimeType: 'application/json', 
                responseSchema: { 
                  type: Type.OBJECT, 
                  properties: { 
                    supplierName: { type: Type.STRING }, 
                    totalAmount: { type: Type.NUMBER },
                    invoiceNo: { type: Type.STRING },
                    date: { type: Type.STRING }
                  } 
                } 
              }
          });
          const data = JSON.parse(response.text);
          const matchedSupplier = suppliers.find(s => s.name.toLowerCase().includes(data.supplierName?.toLowerCase()));
          if (matchedSupplier) setSupplierId(matchedSupplier.id);
          if (data.totalAmount) setBaseAmount(data.totalAmount.toString());
          if (data.invoiceNo) setInvoiceNo(data.invoiceNo);
          if (data.date) setDate(data.date);
      } catch (err) { 
        alert("Failed to parse."); 
      } finally { 
        setIsProcessing(false); 
      }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierId) return alert("Please select a supplier.");
    if (!baseAmount || parseFloat(baseAmount) < 0) return alert("Please enter a valid bill amount.");
    
    if (paymentChoice === 'Partial' && (parseFloat(partialPaidAmount) <= 0 || !partialPaidAmount)) {
        return alert("Please enter the amount you are paying partially.");
    }
    if (paymentChoice === 'Partial' && paidNowValue > netTotal) {
        return alert("Partial payment cannot exceed the total amount.");
    }

    const supplier = suppliers.find(s => s.id === supplierId);
    if (!supplier) return alert("Selected supplier data missing.");
    
    onSave({
        supplierId, 
        supplierName: supplier.name, 
        date, 
        invoiceNo,
        paymentMethod: paymentChoice === 'Later' ? 'Credit' : (paymentMethod === 'Cash' ? 'Cash' : 'Bank Transfer'),
        items: [], 
        total: netTotal,
        roundOff: parseFloat(roundOff) || 0,
        initialPaidAmount: paidNowValue
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex justify-between items-center border-b pb-4">
          <h3 className="text-xl font-bold">Daily Purchase Entry</h3>
          <button type="button" onClick={() => imageInputRef.current?.click()} className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors hover:bg-green-700">
            {isProcessing ? <SpinnerIcon /> : <CameraIcon />} Autofill Bill
          </button>
          <input type="file" ref={imageInputRef} className="hidden" onChange={handleAutofill} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-bold mb-1">Supplier</label>
          <select value={supplierId} onChange={e => setSupplierId(e.target.value)} className="w-full p-2 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none" required>
            <option value="">Select Supplier</option>
            {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-bold mb-1">Invoice No</label>
          <input type="text" value={invoiceNo} onChange={e => setInvoiceNo(e.target.value)} className="w-full p-2 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Optional" />
        </div>
        <div>
          <label className="block text-sm font-bold mb-1">Date</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full p-2 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none" required />
        </div>
      </div>

      <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex flex-col">
                  <span className="text-sm font-bold text-blue-800 uppercase tracking-wide">Payment Timing</span>
                  <p className="text-xs text-blue-600">Choose your payment mode.</p>
              </div>
              <div className="flex bg-white p-1 rounded-lg shadow-sm border overflow-hidden">
                  <button type="button" onClick={() => setPaymentChoice('Full')} className={`px-4 py-2 rounded-md text-xs font-bold transition-all ${paymentChoice === 'Full' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>Pay in Full</button>
                  <button type="button" onClick={() => setPaymentChoice('Partial')} className={`px-4 py-2 rounded-md text-xs font-bold transition-all ${paymentChoice === 'Partial' ? 'bg-orange-500 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>Pay Partial</button>
                  <button type="button" onClick={() => setPaymentChoice('Later')} className={`px-4 py-2 rounded-md text-xs font-bold transition-all ${paymentChoice === 'Later' ? 'bg-gray-700 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>Pay Later</button>
              </div>
          </div>

          {(paymentChoice === 'Full' || paymentChoice === 'Partial') && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-blue-100 animate-fade-in">
                  <div>
                      <label className="block text-xs font-bold text-blue-800 mb-1">Payment Method</label>
                      <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as any)} className="w-full p-2 border rounded-lg bg-white text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                          <option value="Bank Transfer">Bank Transfer</option>
                          <option value="Cash">Cash (Stock)</option>
                      </select>
                  </div>
                  {paymentChoice === 'Partial' && (
                    <div>
                        <label className="block text-xs font-bold text-blue-800 mb-1">Amount to Pay Now (₹)</label>
                        <input 
                            type="number" 
                            step="0.01" 
                            value={partialPaidAmount} 
                            onChange={e => setPartialPaidAmount(e.target.value)} 
                            className="w-full p-2 border rounded-lg bg-white text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none" 
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
                  <label className="block text-sm font-bold mb-1">Total Bill Amount (₹)</label>
                  <input 
                      type="number" 
                      step="0.01" 
                      value={baseAmount} 
                      onChange={e => setBaseAmount(e.target.value)} 
                      className="w-full p-4 border rounded-xl text-xl font-bold bg-white focus:ring-2 focus:ring-blue-500 outline-none" 
                      placeholder="0.00" 
                      required
                  />
              </div>
              <div>
                  <label className="block text-sm font-bold mb-1">Extras / Round Off (₹)</label>
                  <input 
                      type="number" 
                      step="0.01" 
                      value={roundOff} 
                      onChange={e => setRoundOff(e.target.value)} 
                      className="w-full p-4 border rounded-xl text-xl font-bold bg-white focus:ring-2 focus:ring-blue-500 outline-none" 
                      placeholder="0.00" 
                  />
              </div>
          </div>

          <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 space-y-3">
              <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500 font-medium">Net Total:</span>
                  <span className="font-bold text-lg">₹{netTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                  <span className="text-green-600 font-medium">Amount Paying Now:</span>
                  <span className="font-bold text-green-700">₹{paidNowValue.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                  <span className="font-black text-xl text-black">BALANCE DUE:</span> 
                  <span className={`font-black text-2xl ${balanceDue > 0 ? 'text-red-600' : 'text-blue-700'}`}>₹{balanceDue.toFixed(2)}</span>
              </div>
          </div>
      </div>

      <div className="flex justify-end gap-3 pt-6 border-t">
        <button type="button" onClick={onCancel} className="px-8 py-3 bg-gray-100 rounded-xl font-bold transition-colors hover:bg-gray-200 text-black">Cancel</button>
        <button type="submit" className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg hover:bg-blue-700 transition-all active:scale-95">Submit Entry</button>
      </div>
    </form>
  );
};

const DailyPurchases = ({ purchases, onAddPurchase, onUpdatePayment, products, suppliers, onDeletePurchase }: any) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [paymentModalPurchase, setPaymentModalPurchase] = useState<Purchase | null>(null);
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
                    <p className="text-sm text-gray-500">Track inventory cost additions for {new Date().toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                     <button 
                        onClick={() => setShowLaterOnly(!showLaterOnly)} 
                        className={`flex-1 md:flex-none px-4 py-2 rounded-xl text-xs font-bold transition-all border ${showLaterOnly ? 'bg-red-100 border-red-200 text-red-700' : 'bg-white text-gray-600'}`}
                    >
                        {showLaterOnly ? 'Showing Unpaid/Partial' : 'Show Outstanding Only'}
                    </button>
                    <button onClick={() => setIsModalOpen(true)} className="flex-1 md:flex-none bg-blue-600 text-white px-6 py-2 rounded-xl shadow-lg font-bold flex items-center justify-center gap-2 transition-transform active:scale-95">
                        <PlusIcon /> New Entry
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 border-b text-xs font-black uppercase text-gray-500 tracking-wider">
                            <tr>
                                <th className="px-6 py-4">ID</th>
                                <th className="px-6 py-4">Supplier</th>
                                <th className="px-6 py-4">Status</th>
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
                                        <td className="px-6 py-4 font-medium text-gray-400">{p.id.slice(-6)}</td>
                                        <td className="px-6 py-4 font-bold text-black">{p.supplierName}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase ${p.paymentStatus === 'Paid' ? 'bg-green-100 text-green-700' : (p.paymentStatus === 'Partially Paid' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700')}`}>
                                                {p.paymentStatus}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right font-medium text-black">₹{p.total.toFixed(2)}</td>
                                        <td className="px-6 py-4 text-right text-green-600 font-bold">₹{p.paidAmount.toFixed(2)}</td>
                                        <td className="px-6 py-4 text-right text-red-600 font-black">₹{balance.toFixed(2)}</td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex justify-center gap-2">
                                                {p.paymentStatus !== 'Paid' && (
                                                    <button onClick={() => setPaymentModalPurchase(p)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Pay Installment">
                                                        <CashIcon />
                                                    </button>
                                                )}
                                                <button onClick={() => onDeletePurchase(p.id)} className="p-2 text-gray-300 hover:text-red-600 transition-colors"><TrashIcon /></button>
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
                        products={products} 
                        suppliers={suppliers} 
                        onSave={(data: any) => { onAddPurchase(data); setIsModalOpen(false); }} 
                        onCancel={() => setIsModalOpen(false)}
                    />
                </Modal>
            )}

            {paymentModalPurchase && (
                <Modal title={`Pay Installment: ${paymentModalPurchase.id.slice(-6)}`} onClose={() => setPaymentModalPurchase(null)}>
                    <PaymentForm
                        purchase={paymentModalPurchase}
                        onSave={handleSaveInstallment}
                        onCancel={() => setPaymentModalPurchase(null)}
                    />
                </Modal>
            )}
        </div>
    );
};

export default DailyPurchases;
