
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Purchase, Product, PurchaseItem, Supplier } from '../types';
import { TrashIcon, PlusIcon, SpinnerIcon, CameraIcon } from './icons/Icons';
import Modal from './Modal';
import { GoogleGenAI, Type } from "@google/genai";


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
                    <p className="font-semibold text-black">{unmatchedItems.length} new product(s) will be automatically created and added to this purchase.</p>
                    <ul className="list-disc list-inside text-black text-xs mt-1">
                        {unmatchedItems.map((p: any, index: number) => <li key={index}>{p.productName}</li>)}
                    </ul>
                </div>
            )}
            
            <h4 className="text-md font-semibold text-black pt-2 border-t">Items to be Added ({data.items.length})</h4>
            <div className="overflow-y-auto max-h-[30vh]">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b">
                    <th className="p-1 text-left">Product</th>
                    <th className="p-1 text-right">Qty</th>
                    <th className="p-1 text-right">Rate</th>
                    <th className="p-1 text-left">Batch</th>
                    <th className="p-1 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((item: any, index: number) => (
                    <tr key={index} className="border-b">
                      <td className="p-1">{item.productName}</td>
                      <td className="p-1 text-right">{item.quantity}</td>
                      <td className="p-1 text-right">{item.rate?.toFixed(2)}</td>
                      <td className="p-1">{item.batchNo}</td>
                      <td className="p-1">
                        {item.matchedProduct 
                          ? <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-800">Matched</span> 
                          : <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-800">New</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t mt-4">
                <button type="button" onClick={onReject} className="px-4 py-2 bg-gray-200 rounded-md">Reject</button>
                <button type="button" onClick={onConfirm} className="px-4 py-2 bg-blue-600 text-white rounded-md">Confirm & Autofill</button>
            </div>
        </div>
    );
};


// Purchase Form Component (for modal)
const PurchaseForm = ({
  products,
  suppliers,
  stockBalance,
  savingsBalance,
  bankBalance,
  onSave,
  onCancel,
  onAddProduct,
}: {
  products: Product[];
  suppliers: Supplier[];
  stockBalance: number;
  savingsBalance: number;
  bankBalance: number;
  onSave: (purchase: Omit<Purchase, 'id' | 'paymentStatus' | 'paidAmount' | 'paymentHistory'>) => void;
  onCancel: () => void;
  onAddProduct: (product: Omit<Product, 'id'>) => Product | Promise<Product>;
}) => {
  const [supplierId, setSupplierId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [invoiceNo, setInvoiceNo] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'Credit' | 'Cash' | 'Bank Transfer' | 'Savings'>('Credit');
  const [items, setItems] = useState<Omit<PurchaseItem, 'amount' | 'productName'>[]>([]);
  const [selectedProductIdToAdd, setSelectedProductIdToAdd] = useState('');
  const [roundOff, setRoundOff] = useState('0');
  const [formError, setFormError] = useState('');
  
  // State for Autofill feature
  const [isProcessing, setIsProcessing] = useState(false);
  const [autofillError, setAutofillError] = useState('');
  const [autofilledData, setAutofilledData] = useState<any | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);


  const availableProducts = useMemo(() => {
    const addedProductIds = items.map(item => item.productId);
    return products.filter(p => !addedProductIds.includes(p.id));
  }, [products, items]);

  const { subTotal, totalGst, grandTotal, netAmount } = useMemo(() => {
    let subTotal = 0;
    let totalGst = 0;

    items.forEach(item => {
        const quantity = Number(item.quantity) || 0;
        const rate = Number(item.rate) || 0;
        const discount = Number(item.discount) || 0;
        const cgst = Number(item.cgst) || 0;
        const sgst = Number(item.sgst) || 0;
        const igst = Number(item.igst) || 0;

        const itemAmount = quantity * rate;
        const discountedAmount = itemAmount * (1 - discount / 100);
        subTotal += discountedAmount;
        
        const gstPercentage = cgst + sgst + igst;
        totalGst += discountedAmount * (gstPercentage / 100);
    });

    const grandTotalValue = subTotal + totalGst;
    const roundOffValue = parseFloat(roundOff) || 0;
    const netAmountValue = grandTotalValue + roundOffValue;
    
    return {
        subTotal,
        totalGst,
        grandTotal: grandTotalValue,
        netAmount: netAmountValue,
    };
}, [items, roundOff]);

  const currentAvailable = useMemo(() => {
    return paymentMethod === 'Cash' ? stockBalance : paymentMethod === 'Savings' ? savingsBalance : bankBalance;
  }, [paymentMethod, stockBalance, savingsBalance, bankBalance]);

  const isInsufficient = useMemo(() => {
    return (paymentMethod !== 'Credit' && netAmount > currentAvailable);
  }, [paymentMethod, netAmount, currentAvailable]);

  const addProductToPurchase = (product: Product) => {
    setItems(prev => [...prev, {
      productId: product.id,
      quantity: 1,
      packaging: '',
      rate: 0,
      mrp: product.mrp || 0,
      discount: 0,
      hsnCode: '',
      cgst: 0,
      sgst: 0,
      igst: 0,
      batchNo: '',
      expiryDate: '',
    }]);
  };

  const handleAddProductClick = () => {
    const productToAdd = products.find(p => p.id === selectedProductIdToAdd);
    if (productToAdd) {
        addProductToPurchase(productToAdd);
        setSelectedProductIdToAdd(''); // Reset dropdown
        setFormError('');
    }
  };

  const updateItem = (productId: string, field: keyof Omit<PurchaseItem, 'productId' | 'amount' | 'productName'>, value: string | number) => {
    setItems(prev => prev.map(item => {
        if (item.productId === productId) {
            return { ...item, [field]: value };
        }
        return item;
    }));
    setFormError('');
  };
  
  const handleGstChange = (productId: string, gstValue: string) => {
    const gst = parseFloat(gstValue) || 0;
    const halfGst = gst / 2;
    setItems(prev => prev.map(item => {
        if (item.productId === productId) {
            return {
                ...item,
                cgst: halfGst,
                sgst: halfGst,
                igst: 0,
            };
        }
        return item;
    }));
    setFormError('');
  };

  const removeItem = (productId: string) => {
    setItems(prev => prev.filter(item => item.productId !== productId));
    setFormError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!supplierId) {
        setFormError('Please select a supplier.');
        return;
    }
    if (items.length === 0) {
        setFormError('Please add at least one product.');
        return;
    }

    // Balance check for upfront payments
    if (isInsufficient) {
        setFormError(`⚠️ Insufficient Funds in ${paymentMethod}! Total is ₹${netAmount.toFixed(2)}, but you only have ₹${currentAvailable.toFixed(2)}.`);
        return;
    }

    const isValidExpiry = (dateStr: string) => /^\d{2}\/(\d{2}|\d{4})$/.test(dateStr.trim());
    
    for (const item of items) {
        if (!item.batchNo) {
            setFormError(`Please enter a Batch Number for all products.`);
            return;
        }
        if (!isValidExpiry(item.expiryDate)) {
            setFormError(`Please enter a valid Expiry Date (MM/YYYY) for all products.`);
            return;
        }
        if (Number(item.quantity) <= 0) {
            setFormError(`Quantity must be greater than zero.`);
            return;
        }
        if (Number(item.rate) < 0) {
            setFormError(`Rate cannot be negative.`);
            return;
        }
    }

    const supplier = suppliers.find(s => s.id === supplierId);
    if (!supplier) {
        setFormError('Selected supplier not found.');
        return;
    }

    const fromMMYYYYtoYYYYMMDD = (dateStr: string) => {
        const parts = dateStr.split('/');
        const month = parseInt(parts[0], 10);
        let year = parseInt(parts[1], 10);
        
        // Handle 2-digit years
        if (year < 100) {
            year += 2000;
        }
        
        const lastDay = new Date(year, month, 0).getDate();
        return `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    };

    const finalItems: PurchaseItem[] = items.map(item => {
      const product = products.find(p => p.id === item.productId);
      const quantity = Number(item.quantity) || 0;
      const rate = Number(item.rate) || 0;
      return {
        productId: item.productId,
        productName: product?.name || 'Unknown',
        packaging: item.packaging,
        hsnCode: item.hsnCode,
        batchNo: item.batchNo,
        expiryDate: fromMMYYYYtoYYYYMMDD(item.expiryDate),
        quantity: quantity,
        rate: rate,
        mrp: Number(item.mrp) || 0,
        discount: Number(item.discount) || 0,
        cgst: Number(item.cgst) || 0,
        sgst: Number(item.sgst) || 0,
        igst: Number(item.igst) || 0,
        amount: quantity * rate,
      };
    });
    
    const finalRoundOff = parseFloat(roundOff) || 0;

    onSave({
      supplierId,
      supplierName: supplier.name,
      date,
      invoiceNo,
      paymentMethod,
      items: finalItems,
      roundOff: finalRoundOff,
      total: netAmount,
    });
  };
  
    const fileToGenerativePart = async (file: File) => {
        const base64EncodedDataPromise = new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
            reader.readAsDataURL(file);
        });
        return {
            inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
        };
    };

    const handleAutofill = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsProcessing(true);
        setAutofillError('');
        setAutofilledData(null);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const imagePart = await fileToGenerativePart(file);

            const schema = {
                type: Type.OBJECT,
                properties: {
                    supplierName: { type: Type.STRING },
                    invoiceNo: { type: Type.STRING, description: 'The invoice or bill number found on the receipt.' },
                    date: { type: Type.STRING, description: 'Invoice date in YYYY-MM-DD format.' },
                    items: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                productName: { type: Type.STRING },
                                packaging: { type: Type.STRING },
                                quantity: { type: Type.NUMBER },
                                rate: { type: Type.NUMBER },
                                mrp: { type: Type.NUMBER },
                                discount: { type: Type.NUMBER, description: 'Discount percentage. Default to 0 if not found.' },
                                hsnCode: { type: Type.STRING },
                                batchNo: { type: Type.STRING },
                                expiryDate: { type: Type.STRING, description: 'Expiry date in MM/YYYY format. Convert from MM-YY if necessary.' },
                                cgst: { type: Type.NUMBER },
                                sgst: { type: Type.NUMBER },
                            }
                        }
                    }
                }
            };
            
            const prompt = `You are an intelligent document parser for a pharmacy. Analyze the provided image of a purchase bill and extract the data into a structured JSON format according to the provided schema. 
            The supplier name is usually at the top. 
            Extract the Invoice Number into the 'invoiceNo' field.
            The date should be in YYYY-MM-DD format. 
            For the items list:
            1. Scrutinize the table in the image carefully.
            2. Extract EVERY single row in the table as a separate item.
            3. Do NOT repeat the first item's details for subsequent rows.
            4. Ensure that the quantity, rate, and product name match each specific row in the image.
            5. For each item, extract description, packaging, quantity, rate, MRP, discount percentage (default to 0 if not present), HSN code, batch number, expiry date (convert MM-YY or any other format to MM/YYYY), CGST percentage, and SGST percentage.`;

            const response = await ai.models.generateContent({
                model: 'gemini-2.0-flash',
                contents: { parts: [imagePart, { text: prompt }] },
                config: {
                    responseMimeType: 'application/json',
                    responseSchema: schema
                }
            });

            const parsedData = JSON.parse(response.text);

            const matchedSupplier = suppliers.find(s => s.name.toLowerCase().includes(parsedData.supplierName?.toLowerCase()));
            const matchedItems = parsedData.items.map((item: any) => {
                const matchedProduct = products.find(p => p.name.toLowerCase() === item.productName.toLowerCase());
                return { ...item, matchedProduct };
            });

            setAutofilledData({ ...parsedData, matchedSupplier, items: matchedItems });

        } catch (e) {
            console.error(e);
            setAutofillError('Failed to process the bill. Please check the image or enter details manually.');
        } finally {
            setIsProcessing(false);
            if(imageInputRef.current) imageInputRef.current.value = "";
        }
    };
    
    const handleConfirmAutofill = async () => {
        if (!autofilledData) return;
    
        if (autofilledData.matchedSupplier) {
            setSupplierId(autofilledData.matchedSupplier.id);
        }
        if (autofilledData.date) {
            setDate(autofilledData.date);
        }
        if (autofilledData.invoiceNo) {
            setInvoiceNo(autofilledData.invoiceNo);
        }
        
        const newItemsFromAutofill = await Promise.all(autofilledData.items
            .map(async (item: any) => {
                let productInfo;
                if (item.matchedProduct) {
                  productInfo = item.matchedProduct;
                } else {
                  // This is a new product, add it first.
                  const newProductData: Omit<Product, 'id'> = {
                    name: item.productName,
                    manufacturer: 'Unknown', // We can't know this from the bill
                    shelfLocation: 'N/A', // User can update later
                    stock: 0, // Stock will be added by the purchase logic
                    mrp: item.mrp || 0,
                  };
                  productInfo = await onAddProduct(newProductData);
                }

                return {
                    productId: productInfo.id,
                    quantity: item.quantity || 1,
                    packaging: item.packaging || '',
                    rate: item.rate || 0,
                    mrp: item.mrp || productInfo.mrp || 0,
                    discount: item.discount || 0,
                    hsnCode: item.hsnCode || '',
                    cgst: item.cgst || 0,
                    sgst: item.sgst || 0,
                    igst: 0,
                    batchNo: item.batchNo || '',
                    expiryDate: item.expiryDate || '',
                };
            }));

        setItems(prev => [...prev, ...newItemsFromAutofill]);
        setAutofilledData(null);
        setFormError('');
      };

    const handleRejectAutofill = () => {
        setAutofilledData(null);
    };


  return (
    <>
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-semibold text-black">Purchase Details</h3>
        </div>
        <div className="flex-shrink-0">
          <input type="file" accept="image/*" onChange={handleAutofill} ref={imageInputRef} className="hidden" />
          <button
            type="button"
            onClick={() => imageInputRef.current?.click()}
            className="bg-green-600 text-white px-3 py-2 rounded-lg shadow-md hover:bg-green-700 flex items-center gap-2 disabled:bg-gray-400"
            disabled={isProcessing}
          >
            {isProcessing ? <SpinnerIcon /> : <CameraIcon />}
            <span>Upload & Autofill Bill</span>
          </button>
        </div>
      </div>
      {autofillError && <p className="text-sm text-red-500 text-center -mt-2">{autofillError}</p>}


      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-1">
          <label className="block text-sm font-medium text-black">Supplier</label>
          <select value={supplierId} onChange={e => { setSupplierId(e.target.value); setFormError(''); }} className="mt-1 w-full p-2 bg-white border rounded-md" required>
            <option value="" disabled>Select a supplier</option>
            {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-black">Order Date</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className="mt-1 w-full p-2 bg-white border rounded-md" required />
        </div>
        <div>
            <label className="block text-sm font-medium text-black">Invoice No</label>
            <input type="text" value={invoiceNo} onChange={e => setInvoiceNo(e.target.value)} className="mt-1 w-full p-2 bg-white border rounded-md" />
        </div>
        <div>
            <label className="block text-sm font-medium text-black">Payment Method</label>
            <select value={paymentMethod} onChange={e => { setPaymentMethod(e.target.value as any); setFormError(''); }} className="mt-1 w-full p-2 bg-white border rounded-md" required>
                <option value="Credit">Credit (Pay Later)</option>
                <option value="Cash">Cash (Stock: ₹{stockBalance.toFixed(2)})</option>
                <option value="Bank Transfer">Bank (₹{bankBalance.toFixed(2)})</option>
                <option value="Savings">Savings (₹{savingsBalance.toFixed(2)})</option>
            </select>
        </div>
      </div>

      <div className="border-t pt-4">
        <label className="block text-sm font-medium text-black">Add Product</label>
        <div className="flex items-center gap-2">
            <select
                value={selectedProductIdToAdd}
                onChange={e => setSelectedProductIdToAdd(e.target.value)}
                className="mt-1 w-full p-2 bg-white border rounded-md"
            >
                <option value="" disabled>Select a product to add</option>
                {availableProducts.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                ))}
            </select>
            <button
                type="button"
                onClick={handleAddProductClick}
                disabled={!selectedProductIdToAdd}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400 mt-1 flex-shrink-0"
            >
                Add
            </button>
        </div>
      </div>

      <div className="overflow-x-auto max-h-[40vh] border-t border-b py-2">
        <table className="w-full text-xs min-w-[1300px]">
          <thead>
            <tr className="border-b">
              <th className="p-2 text-left">Product</th>
              <th className="p-2 text-left">Pkg</th>
              <th className="p-2 text-left">Qty</th>
              <th className="p-2 text-left">Rate</th>
              <th className="p-2 text-left">Amount</th>
              <th className="p-2 text-left">MRP</th>
              <th className="p-2 text-left">Disc%</th>
              <th className="p-2 text-left">HSN</th>
              <th className="p-2 text-left">Batch</th>
              <th className="p-2 text-left">Expiry</th>
              <th className="p-2 text-left">GST%</th>
              <th className="p-2 text-left">CGST%</th>
              <th className="p-2 text-left">SGST%</th>
              <th className="p-2 text-left">IGST%</th>
              <th className="p-2"></th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => {
              const product = products.find(p => p.id === item.productId);
              return (
                <tr key={item.productId} className="border-b">
                  <td className="p-1 font-medium whitespace-nowrap text-black">{product?.name}</td>
                  <td className="p-1"><input type="text" value={item.packaging} onChange={e => updateItem(item.productId, 'packaging', e.target.value)} className="w-20 p-1 border bg-white rounded-md text-black" /></td>
                  <td className="p-1"><input type="number" min="1" value={item.quantity} onChange={e => updateItem(item.productId, 'quantity', e.target.value)} className="w-16 p-1 border bg-white rounded-md text-black" /></td>
                  <td className="p-1"><input type="number" min="0" step="0.01" value={item.rate} onChange={e => updateItem(item.productId, 'rate', e.target.value)} className="w-20 p-1 border bg-white rounded-md text-black" /></td>
                  <td className="p-1 font-semibold text-black">{((Number(item.quantity) || 0) * (Number(item.rate) || 0)).toFixed(2)}</td>
                  <td className="p-1"><input type="number" min="0" step="0.01" value={item.mrp} onChange={e => updateItem(item.productId, 'mrp', e.target.value)} className="w-20 p-1 border bg-white rounded-md text-black" /></td>
                  <td className="p-1"><input type="number" min="0" step="0.01" value={item.discount} onChange={e => updateItem(item.productId, 'discount', e.target.value)} className="w-16 p-1 border bg-white rounded-md text-black" /></td>
                  <td className="p-1"><input type="text" value={item.hsnCode} onChange={e => updateItem(item.productId, 'hsnCode', e.target.value)} className="w-20 p-1 border bg-white rounded-md text-black" /></td>
                  <td className="p-1"><input type="text" value={item.batchNo} onChange={e => updateItem(item.productId, 'batchNo', e.target.value)} className="w-24 p-1 border bg-white rounded-md text-black" required /></td>
                  <td className="p-1"><input type="text" placeholder="MM/YYYY" value={item.expiryDate} onChange={e => updateItem(item.productId, 'expiryDate', e.target.value)} className="w-24 p-1 border bg-white rounded-md text-black" required /></td>
                  <td className="p-1"><input type="number" min="0" step="0.01" placeholder="e.g. 12" onChange={e => handleGstChange(item.productId, e.target.value)} className="w-16 p-1 border bg-white rounded-md text-black" /></td>
                  <td className="p-1"><input type="number" min="0" step="0.01" value={item.cgst} onChange={e => updateItem(item.productId, 'cgst', e.target.value)} className="w-16 p-1 border bg-white rounded-md text-black" /></td>
                  <td className="p-1"><input type="number" min="0" step="0.01" value={item.sgst} onChange={e => updateItem(item.productId, 'sgst', e.target.value)} className="w-16 p-1 border bg-white rounded-md text-black" /></td>
                  <td className="p-1"><input type="number" min="0" step="0.01" value={item.igst} onChange={e => updateItem(item.productId, 'igst', e.target.value)} className="w-16 p-1 border bg-white rounded-md text-black" /></td>
                  <td className="p-1 text-right"><button type="button" onClick={() => removeItem(item.productId)}><TrashIcon /></button></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
        <div className="md:col-span-2"></div>
        <div className="text-right space-y-2 font-medium">
            <p className="text-black">Sub-Total:</p>
            <p className="text-black">GST:</p>
            <p className="font-bold text-black">Grand Total:</p>
            <p className="text-black">Round Off:</p>
            <p className="font-bold text-lg text-black">Total Orders:</p>
        </div>
        <div className="text-right space-y-2">
            <p className="text-black">₹{subTotal.toFixed(2)}</p>
            <p className="text-black">₹{totalGst.toFixed(2)}</p>
            <p className="font-bold text-black">₹{grandTotal.toFixed(2)}</p>
            <div className="flex justify-end items-center h-6">
                 <input 
                    type="number" 
                    step="0.01"
                    value={roundOff}
                    onChange={e => { setRoundOff(e.target.value); setFormError(''); }}
                    className="w-24 p-1 border bg-white rounded-md text-right h-full text-black"
                />
            </div>
            <p className="font-bold text-lg text-black">₹{netAmount.toFixed(2)}</p>
        </div>
      </div>

      {formError && (
        <div className="p-4 bg-red-100 border border-red-200 text-red-700 rounded-xl font-bold text-sm animate-pulse text-center">
            {formError}
        </div>
      )}
      
      <div className="flex justify-end gap-2 pt-4 border-t mt-4">
        <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-200 rounded-md text-black font-medium">Cancel</button>
        <button 
            type="submit" 
            disabled={isInsufficient && paymentMethod !== 'Credit'}
            className={`px-6 py-2 rounded-md font-bold shadow-lg transition-all active:scale-95 ${isInsufficient && paymentMethod !== 'Credit' ? 'bg-gray-400 cursor-not-allowed text-white' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
        >
            Save Purchase
        </button>
      </div>
    </form>
    
    {autofilledData && (
        <Modal title="Review Autofilled Data" onClose={handleRejectAutofill} size="lg">
            <ApprovalModalContent 
                data={autofilledData} 
                onConfirm={handleConfirmAutofill} 
                onReject={handleRejectAutofill} 
            />
        </Modal>
    )}
    </>
  );
};


// Main Component
interface PurchasesProps {
  purchases: Purchase[];
  onAddPurchase: (purchase: Omit<Purchase, 'id' | 'paymentStatus' | 'paidAmount' | 'paymentHistory'>) => void;
  products: Product[];
  suppliers: Supplier[];
  onAddSupplier: (supplier: Omit<Supplier, 'id'>) => void;
  onDeletePurchase: (purchaseId: string) => void;
  onAddProduct: (product: Omit<Product, 'id'>) => Product | Promise<Product>;
  stockBalance: number;
  savingsBalance: number;
  bankBalance: number;
}

const Purchases = ({ purchases, onAddPurchase, products, suppliers, onAddSupplier, onDeletePurchase, onAddProduct, stockBalance, savingsBalance, bankBalance }: PurchasesProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewingPurchase, setViewingPurchase] = useState<Purchase | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredPurchases = useMemo(() => {
    return purchases.filter(p => 
        p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.invoiceNo && p.invoiceNo.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [purchases, searchTerm]);

  const handleSavePurchase = (purchase: Omit<Purchase, 'id' | 'paymentStatus' | 'paidAmount' | 'paymentHistory'>) => {
    onAddPurchase(purchase);
    setIsModalOpen(false);
  };
  
  const handleDeleteClick = (purchaseId: string) => {
    if (window.confirm(`Are you sure you want to delete purchase ${purchaseId}? This will deduct the items from stock.`)) {
      onDeletePurchase(purchaseId);
    }
  };

  const purchaseTotals = useMemo(() => {
    if (!viewingPurchase) return { subTotal: 0, totalGst: 0, grandTotal: 0, netAmount: 0 };
    
    let subTotalValue = 0;
    let totalGstValue = 0;

    viewingPurchase.items.forEach(item => {
        const itemAmount = item.quantity * item.rate;
        const discountedAmount = itemAmount * (1 - (item.discount || 0) / 100);
        subTotalValue += discountedAmount;
        
        const gstPercentage = (item.cgst || 0) + (item.sgst || 0) + (item.igst || 0);
        totalGstValue += discountedAmount * (gstPercentage / 100);
    });

    const grandTotalValue = subTotalValue + totalGstValue;
    
    return {
        subTotal: subTotalValue,
        totalGst: totalGstValue,
        grandTotal: grandTotalValue,
        netAmount: viewingPurchase.total, // This is the final amount from data
    };
  }, [viewingPurchase]);


  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-black">Recent Purchases</h2>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-blue-700 flex items-center gap-2"
        >
          <PlusIcon /> Add Purchase
        </button>
      </div>
      
      <div className="bg-white p-2 md:p-6 rounded-xl shadow-lg">
        <div>
          <input
            type="text"
            placeholder="Search by ID, Supplier or Invoice..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full max-w-sm p-2 bg-white border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 mb-4 text-black font-medium"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left responsive-table">
            <thead className="text-xs uppercase bg-gray-50 text-black">
              <tr>
                <th scope="col" className="px-6 py-3">Purchase ID</th>
                <th scope="col" className="px-6 py-3">Supplier</th>
                <th scope="col" className="px-6 py-3">Invoice No</th>
                <th scope="col" className="px-6 py-3">Date</th>
                <th scope="col" className="px-6 py-3">Payment</th>
                <th scope="col" className="px-6 py-3 text-right">Total</th>
                <th scope="col" className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPurchases.map(purchase => (
                <tr key={purchase.id} className="bg-white border-b hover:bg-gray-50 text-black">
                  <td data-label="Purchase ID" className="px-6 py-4 font-medium whitespace-nowrap">
                    <button onClick={() => setViewingPurchase(purchase)} className="text-black font-medium hover:underline">
                      {purchase.id}
                    </button>
                  </td>
                  <td data-label="Supplier" className="px-6 py-4">{purchase.supplierName}</td>
                   <td data-label="Invoice No" className="px-6 py-4">{purchase.invoiceNo || '-'}</td>
                  <td data-label="Date" className="px-6 py-4">{new Date(purchase.date).toLocaleDateString()}</td>
                  <td data-label="Payment" className="px-6 py-4">{purchase.paymentMethod}</td>
                  <td data-label="Total" className="px-6 py-4 font-semibold text-right">₹{purchase.total.toFixed(2)}</td>
                  <td data-label="Actions" className="px-6 py-4 text-right text-black">
                    <button onClick={() => handleDeleteClick(purchase.id)} className="hover:text-red-600 transition-colors">
                      <TrashIcon />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredPurchases.length === 0 && <p className="text-center text-black py-4">No purchases found.</p>}
        </div>
      </div>

      {isModalOpen && (
        <Modal title="Add New Purchase" onClose={() => setIsModalOpen(false)} size="6xl">
          <PurchaseForm 
            products={products}
            suppliers={suppliers}
            stockBalance={stockBalance}
            savingsBalance={savingsBalance}
            bankBalance={bankBalance}
            onSave={handleSavePurchase}
            onCancel={() => setIsModalOpen(false)}
            onAddProduct={onAddProduct}
          />
        </Modal>
      )}

      {viewingPurchase && (
        <Modal title={`Purchase Details (${viewingPurchase.id})`} onClose={() => setViewingPurchase(null)} size="6xl">
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
                <div>
                    <p className="text-sm font-medium text-gray-500 uppercase tracking-widest text-[10px]">Supplier</p>
                    <p className="font-semibold text-black">{viewingPurchase.supplierName}</p>
                </div>
                <div>
                    <p className="text-sm font-medium text-gray-500 uppercase tracking-widest text-[10px]">Invoice No</p>
                    <p className="font-semibold text-black">{viewingPurchase.invoiceNo || 'N/A'}</p>
                </div>
                <div>
                    <p className="text-sm font-medium text-gray-500 uppercase tracking-widest text-[10px]">Date</p>
                    <p className="font-semibold text-black">{new Date(viewingPurchase.date).toLocaleDateString()}</p>
                </div>
                <div>
                    <p className="text-sm font-medium text-gray-500 uppercase tracking-widest text-[10px]">Payment Method</p>
                    <p className="font-semibold text-black">{viewingPurchase.paymentMethod}</p>
                </div>
            </div>

            <h4 className="text-md font-semibold text-black pt-2 border-b pb-2 uppercase tracking-widest text-[11px]">Items in Order</h4>
            <div className="overflow-x-auto max-h-[40vh] py-2">
                <table className="w-full text-xs min-w-[1200px]">
                    <thead>
                        <tr className="border-b text-gray-400 font-black uppercase text-[9px]">
                          <th className="p-2 text-left">Product</th>
                          <th className="p-2 text-left">Pkg</th>
                          <th className="p-2 text-left">Qty</th>
                          <th className="p-2 text-left">Rate</th>
                          <th className="p-2 text-left">Amount</th>
                          <th className="p-2 text-left">MRP</th>
                          <th className="p-2 text-left">Disc%</th>
                          <th className="p-2 text-left">HSN</th>
                          <th className="p-2 text-left">Batch</th>
                          <th className="p-2 text-left">Expiry</th>
                          <th className="p-2 text-left">CGST%</th>
                          <th className="p-2 text-left">SGST%</th>
                          <th className="p-2 text-left">IGST%</th>
                        </tr>
                    </thead>
                    <tbody>
                        {viewingPurchase.items.map(item => (
                            <tr key={item.productId} className="border-b text-black">
                                <td className="p-2 font-bold whitespace-nowrap">{item.productName}</td>
                                <td className="p-2">{item.packaging}</td>
                                <td className="p-2">{item.quantity}</td>
                                <td className="p-2">₹{item.rate.toFixed(2)}</td>
                                <td className="p-2 font-bold">₹{(item.quantity * item.rate).toFixed(2)}</td>
                                <td className="p-2">₹{item.mrp.toFixed(2)}</td>
                                <td className="p-2">{item.discount}%</td>
                                <td className="p-2">{item.hsnCode}</td>
                                <td className="p-2 font-mono">{item.batchNo}</td>
                                <td className="p-2">{item.expiryDate}</td>
                                <td className="p-2">{item.cgst}%</td>
                                <td className="p-2">{item.sgst}%</td>
                                <td className="p-2">{item.igst}%</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
                <div className="md:col-span-2"></div>
                <div className="text-right space-y-2 font-medium">
                    <p className="text-gray-500 uppercase text-[10px] font-black">Sub-Total:</p>
                    <p className="text-gray-500 uppercase text-[10px] font-black">GST:</p>
                    <p className="font-black text-black">Grand Total:</p>
                    <p className="text-gray-500 uppercase text-[10px] font-black">Round Off:</p>
                    <p className="font-black text-xl text-blue-600">Total Orders:</p>
                </div>
                <div className="text-right space-y-2 text-black">
                    <p>₹{purchaseTotals.subTotal.toFixed(2)}</p>
                    <p>₹{purchaseTotals.totalGst.toFixed(2)}</p>
                    <p className="font-bold">₹{purchaseTotals.grandTotal.toFixed(2)}</p>
                    <p>₹{(viewingPurchase.roundOff || 0).toFixed(2)}</p>
                    <p className="font-black text-xl text-blue-600">₹{purchaseTotals.netAmount.toFixed(2)}</p>
                </div>
            </div>

            <div className="flex justify-end pt-4 border-t mt-4">
              <button type="button" onClick={() => setViewingPurchase(null)} className="px-6 py-2 bg-gray-100 rounded-xl text-black font-bold hover:bg-gray-200 shadow-sm">Close Details</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Purchases;
