
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Purchase, Product, PurchaseItem, Supplier } from '../types';
// Added BoxIcon to imports
import { TrashIcon, PlusIcon, SpinnerIcon, CameraIcon, BoxIcon } from './icons/Icons';
import Modal from './Modal';
import { GoogleGenAI, Type } from "@google/genai";

// Reusing Approval modal logic locally
const ApprovalModalContent = ({ data, onConfirm, onReject }: {
  data: any,
  onConfirm: () => void,
  onReject: () => void
}) => {
    const unmatchedItems = data.items.filter((i: any) => !i.matchedProduct);

    return (
        <div className="space-y-4 text-sm">
            <div className="p-4 bg-gray-50 rounded-lg border">
                <h3 className="font-bold text-lg mb-2 text-black">Extracted Details</h3>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                    <p><span className="font-semibold">Supplier:</span> {data.supplierName}</p>
                    <p className={data.matchedSupplier ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                        Status: {data.matchedSupplier ? `Matched (${data.matchedSupplier.name})` : 'Not Matched'}
                    </p>
                    <p><span className="font-semibold">Date:</span> {data.date}</p>
                    <p><span className="font-semibold">Invoice No:</span> {data.invoiceNo || 'N/A'}</p>
                </div>
            </div>
            
            {unmatchedItems.length > 0 && (
                 <div className="p-3 bg-blue-100 border border-blue-300 rounded-lg">
                    <p className="font-semibold text-black">{unmatchedItems.length} new product(s) will be automatically created.</p>
                </div>
            )}
            
            <h4 className="text-md font-semibold text-black pt-2 border-t">Items ({data.items.length})</h4>
            <div className="overflow-y-auto max-h-[30vh]">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b">
                    <th className="p-1 text-left">Product</th>
                    <th className="p-1 text-right">Qty</th>
                    <th className="p-1 text-right">Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((item: any, index: number) => (
                    <tr key={index} className="border-b">
                      <td className="p-1">{item.productName}</td>
                      <td className="p-1 text-right">{item.quantity}</td>
                      <td className="p-1 text-right">{item.rate?.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t mt-4">
                <button type="button" onClick={onReject} className="px-4 py-2 bg-gray-200 rounded-md">Reject</button>
                <button type="button" onClick={onConfirm} className="px-4 py-2 bg-blue-600 text-white rounded-md">Confirm</button>
            </div>
        </div>
    );
};

const PurchaseForm = ({
  products,
  suppliers,
  onSave,
  onCancel,
  onAddProduct,
}: {
  products: Product[];
  suppliers: Supplier[];
  onSave: (purchase: Omit<Purchase, 'id' | 'paymentStatus' | 'paidAmount' | 'paymentHistory'>) => void;
  onCancel: () => void;
  onAddProduct: (product: Omit<Product, 'id'>) => Product;
}) => {
  const [supplierId, setSupplierId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [invoiceNo, setInvoiceNo] = useState('');
  // "Now" defaults to Bank Transfer, "Later" to Credit
  const [paymentChoice, setPaymentChoice] = useState<'Now' | 'Later'>('Now');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Bank Transfer'>('Bank Transfer');
  const [items, setItems] = useState<Omit<PurchaseItem, 'amount' | 'productName'>[]>([]);
  const [selectedProductIdToAdd, setSelectedProductIdToAdd] = useState('');
  const [roundOff, setRoundOff] = useState('0');
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [autofilledData, setAutofilledData] = useState<any | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const availableProducts = useMemo(() => {
    const addedProductIds = items.map(item => item.productId);
    return products.filter(p => !addedProductIds.includes(p.id));
  }, [products, items]);

  const totals = useMemo(() => {
    let subTotal = 0;
    let totalGst = 0;
    items.forEach(item => {
        const itemAmount = (Number(item.quantity) || 0) * (Number(item.rate) || 0);
        const discounted = itemAmount * (1 - (Number(item.discount) || 0) / 100);
        subTotal += discounted;
        totalGst += discounted * (((Number(item.cgst) || 0) + (Number(item.sgst) || 0) + (Number(item.igst) || 0)) / 100);
    });
    const net = subTotal + totalGst + (parseFloat(roundOff) || 0);
    return { subTotal, totalGst, net };
  }, [items, roundOff]);

  const handleAddProductClick = () => {
    const prod = products.find(p => p.id === selectedProductIdToAdd);
    if (prod) {
        setItems(prev => [...prev, {
            productId: prod.id,
            quantity: 1, packaging: '', rate: 0, mrp: prod.mrp || 0,
            discount: 0, hsnCode: '', cgst: 0, sgst: 0, igst: 0, batchNo: '', expiryDate: ''
        }]);
        setSelectedProductIdToAdd('');
    }
  };

  const updateItem = (productId: string, field: string, value: any) => {
    setItems(prev => prev.map(item => item.productId === productId ? { ...item, [field]: value } : item));
  };

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
              contents: { parts: [{ inlineData: { data: base64, mimeType: file.type } }, { text: "Parse this pharmacy purchase bill. Extract items, supplier, invoice, date." }] },
              config: { responseMimeType: 'application/json', responseSchema: { type: Type.OBJECT, properties: { supplierName: { type: Type.STRING }, items: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { productName: { type: Type.STRING }, quantity: { type: Type.NUMBER }, rate: { type: Type.NUMBER } } } } } } }
          });
          setAutofilledData(JSON.parse(response.text));
      } catch (err) { alert("Failed to parse."); } finally { setIsProcessing(false); }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierId || items.length === 0) return alert("Select supplier and items.");
    const supplier = suppliers.find(s => s.id === supplierId);
    onSave({
        supplierId, supplierName: supplier!.name, date, invoiceNo,
        paymentMethod: paymentChoice === 'Later' ? 'Credit' : paymentMethod,
        items: items.map(i => ({ ...i, productName: products.find(p => p.id === i.productId)!.name, amount: i.quantity * i.rate })),
        total: totals.net
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex justify-between items-center border-b pb-4">
          <h3 className="text-xl font-bold">Daily Purchase Entry</h3>
          <button type="button" onClick={() => imageInputRef.current?.click()} className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2">
            {isProcessing ? <SpinnerIcon /> : <CameraIcon />} Autofill Bill
          </button>
          <input type="file" ref={imageInputRef} className="hidden" onChange={handleAutofill} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-bold mb-1">Supplier</label>
          <select value={supplierId} onChange={e => setSupplierId(e.target.value)} className="w-full p-2 border rounded-lg bg-white">
            <option value="">Select Supplier</option>
            {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-bold mb-1">Invoice No</label>
          <input type="text" value={invoiceNo} onChange={e => setInvoiceNo(e.target.value)} className="w-full p-2 border rounded-lg bg-white" />
        </div>
        <div>
          <label className="block text-sm font-bold mb-1">Date</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full p-2 border rounded-lg bg-white" />
        </div>
      </div>

      <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 flex items-center justify-between">
          <div className="flex flex-col">
              <span className="text-sm font-bold text-blue-800 uppercase tracking-wide">Payment Timing</span>
              <p className="text-xs text-blue-600">Select whether to pay immediately or record as credit.</p>
          </div>
          <div className="flex bg-white p-1 rounded-lg shadow-sm border">
              <button type="button" onClick={() => setPaymentChoice('Now')} className={`px-6 py-2 rounded-md text-sm font-bold transition-all ${paymentChoice === 'Now' ? 'bg-blue-600 text-white' : 'text-gray-500'}`}>Pay Now</button>
              <button type="button" onClick={() => setPaymentChoice('Later')} className={`px-6 py-2 rounded-md text-sm font-bold transition-all ${paymentChoice === 'Later' ? 'bg-orange-500 text-white' : 'text-gray-500'}`}>Pay Later</button>
          </div>
      </div>

      {paymentChoice === 'Now' && (
          <div className="grid grid-cols-2 gap-4 animate-fade-in">
              <div>
                  <label className="block text-sm font-bold mb-1">Payment Method</label>
                  <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as any)} className="w-full p-2 border rounded-lg bg-white">
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="Cash">Cash (Stock)</option>
                  </select>
              </div>
          </div>
      )}

      <div className="border-t pt-4">
        <label className="block text-sm font-bold mb-1">Add Product</label>
        <div className="flex gap-2">
            <select value={selectedProductIdToAdd} onChange={e => setSelectedProductIdToAdd(e.target.value)} className="flex-1 p-2 border rounded-lg bg-white">
                <option value="">Choose product...</option>
                {availableProducts.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <button type="button" onClick={handleAddProductClick} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold">Add</button>
        </div>
      </div>

      <div className="overflow-x-auto border rounded-xl">
          <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-500 uppercase text-[10px] font-black">
                  <tr>
                      <th className="px-4 py-3">Product</th>
                      <th className="px-4 py-3">Qty</th>
                      <th className="px-4 py-3">Rate</th>
                      <th className="px-4 py-3">Batch</th>
                      <th className="px-4 py-3">Expiry</th>
                      <th className="px-4 py-3 text-right">Total</th>
                      <th className="px-4 py-3 text-center">X</th>
                  </tr>
              </thead>
              <tbody className="divide-y">
                  {items.map(item => (
                      <tr key={item.productId}>
                          <td className="px-4 py-3 font-bold">{products.find(p => p.id === item.productId)?.name}</td>
                          <td className="px-4 py-3"><input type="number" value={item.quantity} onChange={e => updateItem(item.productId, 'quantity', e.target.value)} className="w-16 p-1 border rounded bg-white" /></td>
                          <td className="px-4 py-3"><input type="number" value={item.rate} onChange={e => updateItem(item.productId, 'rate', e.target.value)} className="w-20 p-1 border rounded bg-white" /></td>
                          <td className="px-4 py-3"><input type="text" value={item.batchNo} onChange={e => updateItem(item.productId, 'batchNo', e.target.value)} className="w-20 p-1 border rounded bg-white" /></td>
                          <td className="px-4 py-3"><input type="text" placeholder="MM/YYYY" value={item.expiryDate} onChange={e => updateItem(item.productId, 'expiryDate', e.target.value)} className="w-20 p-1 border rounded bg-white" /></td>
                          <td className="px-4 py-3 text-right font-bold">₹{(item.quantity * item.rate).toFixed(2)}</td>
                          <td className="px-4 py-3 text-center"><button type="button" onClick={() => setItems(items.filter(i => i.productId !== item.productId))} className="text-red-500"><TrashIcon /></button></td>
                      </tr>
                  ))}
              </tbody>
          </table>
      </div>

      <div className="flex flex-col items-end space-y-2 border-t pt-4">
          <div className="flex justify-between w-full max-w-xs"><span className="text-gray-500">Subtotal:</span> <span className="font-bold">₹{totals.subTotal.toFixed(2)}</span></div>
          <div className="flex justify-between w-full max-w-xs"><span className="text-gray-500">GST:</span> <span className="font-bold">₹{totals.totalGst.toFixed(2)}</span></div>
          <div className="flex justify-between w-full max-w-xs items-center">
              <span className="text-gray-500">Round Off:</span> 
              <input type="number" step="0.01" value={roundOff} onChange={e => setRoundOff(e.target.value)} className="w-20 p-1 border rounded text-right bg-white" />
          </div>
          <div className="flex justify-between w-full max-w-xs border-t pt-2 text-xl"><span className="font-black">NET TOTAL:</span> <span className="font-black text-blue-700">₹{totals.net.toFixed(2)}</span></div>
      </div>

      <div className="flex justify-end gap-3 pt-6">
        <button type="button" onClick={onCancel} className="px-8 py-3 bg-gray-100 rounded-xl font-bold">Cancel</button>
        <button type="submit" className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg hover:bg-blue-700">Submit Purchase</button>
      </div>
    </form>
  );
};

const DailyPurchases = ({ purchases, onAddPurchase, products, suppliers, onAddSupplier, onDeletePurchase, onAddProduct }: any) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [showLaterOnly, setShowLaterOnly] = useState(false);

    const todayStr = new Date().toISOString().split('T')[0];
    const dailyItems = useMemo(() => {
        let items = purchases.filter((p: any) => p.date === todayStr);
        if (showLaterOnly) items = items.filter((p: any) => p.paymentMethod === 'Credit');
        return items;
    }, [purchases, showLaterOnly, todayStr]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-black text-black">Daily Purchases</h2>
                    <p className="text-sm text-gray-500">Track and manage inventory additions for {new Date().toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                     <button 
                        onClick={() => setShowLaterOnly(!showLaterOnly)} 
                        className={`flex-1 md:flex-none px-4 py-2 rounded-xl text-xs font-bold transition-all border ${showLaterOnly ? 'bg-orange-100 border-orange-200 text-orange-700' : 'bg-white text-gray-600'}`}
                    >
                        {showLaterOnly ? 'Showing Credit Only' : 'Show Credit (Later) Only'}
                    </button>
                    <button onClick={() => setIsModalOpen(true)} className="flex-1 md:flex-none bg-blue-600 text-white px-6 py-2 rounded-xl shadow-lg font-bold flex items-center justify-center gap-2">
                        <PlusIcon /> New Entry
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 border-b text-xs font-black uppercase text-gray-500 tracking-wider">
                        <tr>
                            <th className="px-6 py-4">ID</th>
                            <th className="px-6 py-4">Supplier</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Method</th>
                            <th className="px-6 py-4 text-right">Amount</th>
                            <th className="px-6 py-4 text-center">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {dailyItems.map((p: any) => (
                            <tr key={p.id} className="hover:bg-gray-50 transition-all">
                                <td className="px-6 py-4 font-medium">{p.id}</td>
                                <td className="px-6 py-4">{p.supplierName}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase ${p.paymentStatus === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                        {p.paymentStatus}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase ${p.paymentMethod === 'Credit' ? 'bg-gray-100 text-gray-700' : 'bg-blue-100 text-blue-700'}`}>
                                        {p.paymentMethod === 'Credit' ? 'Pay Later' : 'Pay Now'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right font-black">₹{p.total.toFixed(2)}</td>
                                <td className="px-6 py-4 text-center">
                                    <button onClick={() => onDeletePurchase(p.id)} className="text-gray-400 hover:text-red-600 transition-colors"><TrashIcon /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {dailyItems.length === 0 && (
                    <div className="p-20 text-center flex flex-col items-center gap-3">
                        <div className="p-4 bg-gray-50 rounded-full text-gray-300"><BoxIcon /></div>
                        <p className="text-gray-500 font-bold">No purchase records found for today.</p>
                        <button onClick={() => setIsModalOpen(true)} className="text-blue-600 hover:underline text-sm font-bold">Add your first entry &rarr;</button>
                    </div>
                )}
            </div>

            {isModalOpen && (
                <Modal title="Add Purchase (Now or Later)" onClose={() => setIsModalOpen(false)} size="xl">
                    <PurchaseForm 
                        products={products} 
                        suppliers={suppliers} 
                        onSave={(p: any) => { onAddPurchase(p); setIsModalOpen(false); }} 
                        onCancel={() => setIsModalOpen(false)}
                        onAddProduct={onAddProduct}
                    />
                </Modal>
            )}
        </div>
    );
};

export default DailyPurchases;
