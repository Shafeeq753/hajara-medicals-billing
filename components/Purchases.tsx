import React, { useState, useMemo, useEffect } from 'react';
import { Purchase, Product, PurchaseItem, Supplier } from '../types';
import { TrashIcon, PlusIcon } from './icons/Icons';
import Modal from './Modal';

// Purchase Form Component (for modal)
const PurchaseForm = ({
  products,
  suppliers,
  onSave,
  onCancel,
}: {
  products: Product[];
  suppliers: Supplier[];
  onSave: (purchase: Omit<Purchase, 'id' | 'paymentStatus' | 'paidAmount' | 'paymentHistory'>) => void;
  onCancel: () => void;
}) => {
  const [supplierId, setSupplierId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<'Credit' | 'Cash' | 'Bank Transfer'>('Credit');
  const [items, setItems] = useState<Omit<PurchaseItem, 'amount' | 'productName'>[]>([]);
  const [selectedProductIdToAdd, setSelectedProductIdToAdd] = useState('');
  const [roundOff, setRoundOff] = useState('0');

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

    const grandTotal = subTotal + totalGst;
    const roundOffValue = parseFloat(roundOff) || 0;
    const netAmount = grandTotal + roundOffValue;
    
    return {
        subTotal,
        totalGst,
        grandTotal,
        netAmount,
    };
}, [items, roundOff]);

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
    }
  };

  const updateItem = (productId: string, field: keyof Omit<PurchaseItem, 'productId' | 'amount' | 'productName'>, value: string | number) => {
    setItems(prev => prev.map(item => {
        if (item.productId === productId) {
            return { ...item, [field]: value };
        }
        return item;
    }));
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
  };

  const removeItem = (productId: string) => {
    setItems(prev => prev.filter(item => item.productId !== productId));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierId || items.length === 0) {
      alert('Please select a supplier and add at least one product.');
      return;
    }

    const isValidExpiry = (dateStr: string) => /^\d{2}\/\d{4}$/.test(dateStr.trim());
    if (items.some(i => !i.batchNo || !isValidExpiry(i.expiryDate) || i.quantity <= 0 || i.rate <= 0)) {
        alert('Please fill all required details (quantity, rate, batch no, and expiry date in MM/YYYY format) for each product.');
        return;
    }

    const supplier = suppliers.find(s => s.id === supplierId);
    if (!supplier) return;

    const fromMMYYYYtoYYYYMMDD = (mmYYYY: string) => {
        const [month, year] = mmYYYY.split('/');
        const lastDay = new Date(parseInt(year), parseInt(month, 10), 0).getDate();
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
      paymentMethod,
      items: finalItems,
      roundOff: finalRoundOff,
      total: netAmount,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium">Supplier</label>
          <select value={supplierId} onChange={e => setSupplierId(e.target.value)} className="mt-1 w-full p-2 bg-white border rounded-md" required>
            <option value="" disabled>Select a supplier</option>
            {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">Order Date</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className="mt-1 w-full p-2 bg-white border rounded-md" required />
        </div>
        <div>
            <label className="block text-sm font-medium">Payment Method</label>
            <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as any)} className="mt-1 w-full p-2 bg-white border rounded-md" required>
                <option value="Credit">Credit</option>
                <option value="Cash">Cash</option>
                <option value="Bank Transfer">Bank Transfer</option>
            </select>
        </div>
      </div>

      <div className="border-t pt-4">
        <label className="block text-sm font-medium">Add Product</label>
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
                  <td className="p-1 font-medium whitespace-nowrap">{product?.name}</td>
                  <td className="p-1"><input type="text" value={item.packaging} onChange={e => updateItem(item.productId, 'packaging', e.target.value)} className="w-20 p-1 border bg-white rounded-md" /></td>
                  <td className="p-1"><input type="number" min="1" value={item.quantity} onChange={e => updateItem(item.productId, 'quantity', e.target.value)} className="w-16 p-1 border bg-white rounded-md" /></td>
                  <td className="p-1"><input type="number" min="0.01" step="0.01" value={item.rate} onChange={e => updateItem(item.productId, 'rate', e.target.value)} className="w-20 p-1 border bg-white rounded-md" /></td>
                  <td className="p-1 font-semibold">{((Number(item.quantity) || 0) * (Number(item.rate) || 0)).toFixed(2)}</td>
                  <td className="p-1"><input type="number" min="0" step="0.01" value={item.mrp} onChange={e => updateItem(item.productId, 'mrp', e.target.value)} className="w-20 p-1 border bg-white rounded-md" /></td>
                  <td className="p-1"><input type="number" min="0" step="0.01" value={item.discount} onChange={e => updateItem(item.productId, 'discount', e.target.value)} className="w-16 p-1 border bg-white rounded-md" /></td>
                  <td className="p-1"><input type="text" value={item.hsnCode} onChange={e => updateItem(item.productId, 'hsnCode', e.target.value)} className="w-20 p-1 border bg-white rounded-md" /></td>
                  <td className="p-1"><input type="text" value={item.batchNo} onChange={e => updateItem(item.productId, 'batchNo', e.target.value)} className="w-24 p-1 border bg-white rounded-md" /></td>
                  <td className="p-1"><input type="text" placeholder="MM/YYYY" value={item.expiryDate} onChange={e => updateItem(item.productId, 'expiryDate', e.target.value)} className="w-24 p-1 border bg-white rounded-md" /></td>
                  <td className="p-1"><input type="number" min="0" step="0.01" placeholder="e.g. 12" onChange={e => handleGstChange(item.productId, e.target.value)} className="w-16 p-1 border bg-white rounded-md" /></td>
                  <td className="p-1"><input type="number" min="0" step="0.01" value={item.cgst} onChange={e => updateItem(item.productId, 'cgst', e.target.value)} className="w-16 p-1 border bg-white rounded-md" /></td>
                  <td className="p-1"><input type="number" min="0" step="0.01" value={item.sgst} onChange={e => updateItem(item.productId, 'sgst', e.target.value)} className="w-16 p-1 border bg-white rounded-md" /></td>
                  <td className="p-1"><input type="number" min="0" step="0.01" value={item.igst} onChange={e => updateItem(item.productId, 'igst', e.target.value)} className="w-16 p-1 border bg-white rounded-md" /></td>
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
            <p>Sub-Total:</p>
            <p>GST:</p>
            <p className="font-bold">Grand Total:</p>
            <p>Round Off:</p>
            <p className="font-bold text-lg">Total Orders:</p>
        </div>
        <div className="text-right space-y-2">
            <p>₹{subTotal.toFixed(2)}</p>
            <p>₹{totalGst.toFixed(2)}</p>
            <p className="font-bold">₹{grandTotal.toFixed(2)}</p>
            <div className="flex justify-end items-center h-6">
                 <input 
                    type="number" 
                    step="0.01"
                    value={roundOff}
                    onChange={e => setRoundOff(e.target.value)}
                    className="w-24 p-1 border bg-white rounded-md text-right h-full"
                />
            </div>
            <p className="font-bold text-lg">₹{netAmount.toFixed(2)}</p>
        </div>
      </div>
      
      <div className="flex justify-end gap-2 pt-4 border-t mt-4">
        <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-200 rounded-md">Cancel</button>
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md">Save Purchase</button>
      </div>
    </form>
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
}

const Purchases = ({ purchases, onAddPurchase, products, suppliers, onAddSupplier, onDeletePurchase }: PurchasesProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewingPurchase, setViewingPurchase] = useState<Purchase | null>(null);

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
    
    let subTotal = 0;
    let totalGst = 0;

    viewingPurchase.items.forEach(item => {
        const itemAmount = item.quantity * item.rate;
        const discountedAmount = itemAmount * (1 - (item.discount || 0) / 100);
        subTotal += discountedAmount;
        
        const gstPercentage = (item.cgst || 0) + (item.sgst || 0) + (item.igst || 0);
        totalGst += discountedAmount * (gstPercentage / 100);
    });

    const grandTotal = subTotal + totalGst;
    
    return {
        subTotal,
        totalGst,
        grandTotal,
        netAmount: viewingPurchase.total, // This is the final amount from data
    };
  }, [viewingPurchase]);


  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Recent Purchases</h2>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-blue-700 flex items-center gap-2"
        >
          <PlusIcon /> Add Purchase
        </button>
      </div>
      
      <div className="bg-white p-2 md:p-6 rounded-xl shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left responsive-table">
            <thead className="text-xs uppercase bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3">Purchase ID</th>
                <th scope="col" className="px-6 py-3">Supplier</th>
                <th scope="col" className="px-6 py-3">Date</th>
                <th scope="col" className="px-6 py-3">Payment</th>
                <th scope="col" className="px-6 py-3 text-right">Total</th>
                <th scope="col" className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {purchases.map(purchase => (
                <tr key={purchase.id} className="bg-white border-b hover:bg-gray-50">
                  <td data-label="Purchase ID" className="px-6 py-4 font-medium whitespace-nowrap">
                    <button onClick={() => setViewingPurchase(purchase)} className="text-black font-medium hover:underline">
                      {purchase.id}
                    </button>
                  </td>
                  <td data-label="Supplier" className="px-6 py-4">{purchase.supplierName}</td>
                  <td data-label="Date" className="px-6 py-4">{new Date(purchase.date).toLocaleDateString()}</td>
                  <td data-label="Payment" className="px-6 py-4">{purchase.paymentMethod}</td>
                  <td data-label="Total" className="px-6 py-4 font-semibold text-right">₹{purchase.total.toFixed(2)}</td>
                  <td data-label="Actions" className="px-6 py-4 text-right">
                    <button onClick={() => handleDeleteClick(purchase.id)} className="hover:text-black">
                      <TrashIcon />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <Modal title="Add New Purchase" onClose={() => setIsModalOpen(false)} size="6xl">
          <PurchaseForm 
            products={products}
            suppliers={suppliers}
            onSave={handleSavePurchase}
            onCancel={() => setIsModalOpen(false)}
          />
        </Modal>
      )}

      {viewingPurchase && (
        <Modal title={`Purchase Details (${viewingPurchase.id})`} onClose={() => setViewingPurchase(null)} size="6xl">
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-2 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
                <div>
                    <p className="text-sm font-medium text-gray-500">Supplier</p>
                    <p className="font-semibold text-black">{viewingPurchase.supplierName}</p>
                </div>
                <div>
                    <p className="text-sm font-medium text-gray-500">Date</p>
                    <p className="font-semibold text-black">{new Date(viewingPurchase.date).toLocaleDateString()}</p>
                </div>
                <div>
                    <p className="text-sm font-medium text-gray-500">Payment Method</p>
                    <p className="font-semibold text-black">{viewingPurchase.paymentMethod}</p>
                </div>
                <div>
                    <p className="text-sm font-medium text-gray-500">Total Orders</p>
                    <p className="font-semibold text-black">₹{viewingPurchase.total.toFixed(2)}</p>
                </div>
            </div>

            <h4 className="text-md font-semibold text-black pt-2">Items</h4>
            <div className="overflow-x-auto max-h-[40vh] border-t border-b py-2">
                <table className="w-full text-xs min-w-[1200px]">
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
                          <th className="p-2 text-left">CGST%</th>
                          <th className="p-2 text-left">SGST%</th>
                          <th className="p-2 text-left">IGST%</th>
                        </tr>
                    </thead>
                    <tbody>
                        {viewingPurchase.items.map(item => (
                            <tr key={item.productId} className="border-b">
                                <td className="p-2 font-medium whitespace-nowrap">{item.productName}</td>
                                <td className="p-2">{item.packaging}</td>
                                <td className="p-2">{item.quantity}</td>
                                <td className="p-2">₹{item.rate.toFixed(2)}</td>
                                <td className="p-2">₹{(item.quantity * item.rate).toFixed(2)}</td>
                                <td className="p-2">₹{item.mrp.toFixed(2)}</td>
                                <td className="p-2">{item.discount}%</td>
                                <td className="p-2">{item.hsnCode}</td>
                                <td className="p-2">{item.batchNo}</td>
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
                    <p>Sub-Total:</p>
                    <p>GST:</p>
                    <p className="font-bold">Grand Total:</p>
                    <p>Round Off:</p>
                    <p className="font-bold text-lg">Total Orders:</p>
                </div>
                <div className="text-right space-y-2">
                    <p>₹{purchaseTotals.subTotal.toFixed(2)}</p>
                    <p>₹{purchaseTotals.totalGst.toFixed(2)}</p>
                    <p className="font-bold">₹{purchaseTotals.grandTotal.toFixed(2)}</p>
                    <p>₹{(viewingPurchase.roundOff || 0).toFixed(2)}</p>
                    <p className="font-bold text-lg">₹{purchaseTotals.netAmount.toFixed(2)}</p>
                </div>
            </div>

            <div className="flex justify-end pt-4 border-t mt-4">
              <button type="button" onClick={() => setViewingPurchase(null)} className="px-4 py-2 bg-gray-200 rounded-md">Close</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Purchases;