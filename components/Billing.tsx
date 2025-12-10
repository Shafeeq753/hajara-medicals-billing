
import React, { useState, useMemo } from 'react';
import { Bill, BillItem, Product } from '../types';
import { PlusIcon, TrashIcon, PrintIcon } from './icons/Icons';
import Modal from './Modal';

interface NewBillFormProps {
    handleSubmit: (e: React.FormEvent) => void;
    patientName: string;
    setPatientName: (name: string) => void;
    doctorName: string;
    setDoctorName: (name: string) => void;
    date: string;
    setDate: (date: string) => void;
    items: Omit<BillItem, 'serialNumber' | 'total'>[];
    updateItem: (productId: string, field: keyof Omit<BillItem, 'productId' | 'serialNumber' | 'productName' | 'total'>, value: string | number) => void;
    removeItem: (productId: string) => void;
    selectedProductIdToAdd: string;
    setSelectedProductIdToAdd: (id: string) => void;
    availableProducts: Product[];
    handleAddProductClick: () => void;
    subTotal: number;
    overallDiscount: string;
    setOverallDiscount: (value: string) => void;
    roundOff: string;
    setRoundOff: (value: string) => void;
    grandTotal: number;
    resetForm: () => void;
}

const NewBillForm = ({
    handleSubmit,
    patientName, setPatientName,
    doctorName, setDoctorName,
    date, setDate,
    items, updateItem, removeItem,
    selectedProductIdToAdd, setSelectedProductIdToAdd,
    availableProducts, handleAddProductClick,
    subTotal, overallDiscount, setOverallDiscount,
    roundOff, setRoundOff, grandTotal, resetForm
}: NewBillFormProps) => (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-xl shadow-lg">
        {/* Header Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 border-b pb-4">
            <div>
                <label className="block text-sm font-medium">Patient Name</label>
                <input type="text" value={patientName} onChange={e => setPatientName(e.target.value)} className="mt-1 w-full p-2 bg-white border rounded-md" required />
            </div>
            <div>
                <label className="block text-sm font-medium">Doctor Name</label>
                <input type="text" value={doctorName} onChange={e => setDoctorName(e.target.value)} className="mt-1 w-full p-2 bg-white border rounded-md" />
            </div>
            <div>
                <label className="block text-sm font-medium">Bill Number</label>
                <input type="text" value="Auto-generated" className="mt-1 w-full p-2 bg-gray-100 border rounded-md" readOnly />
            </div>
            <div>
                <label className="block text-sm font-medium">Date</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} className="mt-1 w-full p-2 bg-white border rounded-md" required />
            </div>
        </div>

        {/* Add Product Section */}
        <div>
            <label className="block text-sm font-medium">Add Product</label>
            <div className="flex items-center gap-2">
                <select value={selectedProductIdToAdd} onChange={e => setSelectedProductIdToAdd(e.target.value)} className="mt-1 w-full p-2 bg-white border rounded-md">
                    <option value="" disabled>Select a product to add (Stock > 0)</option>
                    {availableProducts.map(p => <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock})</option>)}
                </select>
                <button type="button" onClick={handleAddProductClick} disabled={!selectedProductIdToAdd} className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400 mt-1 flex-shrink-0">
                    Add
                </button>
            </div>
        </div>

        {/* Items Table */}
        <div className="overflow-x-auto max-h-[40vh] border-t border-b py-2">
            <table className="w-full text-xs min-w-[1000px]">
                <thead>
                    <tr className="border-b">
                        <th className="p-2 text-left">S.No</th>
                        <th className="p-2 text-left">Product</th>
                        <th className="p-2 text-left">Expiry</th>
                        <th className="p-2 text-left">Qty</th>
                        <th className="p-2 text-left">Pkg</th>
                        <th className="p-2 text-left">MRP</th>
                        <th className="p-2 text-left">Disc%</th>
                        <th className="p-2 text-left">Total</th>
                        <th className="p-2"></th>
                    </tr>
                </thead>
                <tbody>
                    {items.map((item, index) => {
                        const quantity = Number(item.quantity) || 0;
                        const mrp = Number(item.mrp) || 0;
                        const discount = Number(item.discount) || 0;
                        const itemTotal = quantity * mrp;
                        const total = itemTotal * (1 - discount / 100);
                        return (
                            <tr key={item.productId} className="border-b">
                                <td className="p-1">{index + 1}</td>
                                <td className="p-1 font-medium whitespace-nowrap">{item.productName}</td>
                                <td className="p-1"><input type="text" placeholder="MM/YYYY" value={item.expiryDate} onChange={e => updateItem(item.productId, 'expiryDate', e.target.value)} className="w-24 p-1 border bg-white rounded-md" /></td>
                                <td className="p-1"><input type="number" min="1" value={item.quantity} onChange={e => updateItem(item.productId, 'quantity', e.target.value)} className="w-16 p-1 border bg-white rounded-md" /></td>
                                <td className="p-1"><input type="text" value={item.packaging} onChange={e => updateItem(item.productId, 'packaging', e.target.value)} className="w-20 p-1 border bg-white rounded-md" /></td>
                                <td className="p-1"><input type="number" min="0" step="0.01" value={item.mrp} onChange={e => updateItem(item.productId, 'mrp', e.target.value)} className="w-20 p-1 border bg-white rounded-md" /></td>
                                <td className="p-1"><input type="number" min="0" step="0.01" value={item.discount} onChange={e => updateItem(item.productId, 'discount', e.target.value)} className="w-16 p-1 border bg-white rounded-md" /></td>
                                <td className="p-1 font-semibold">{total.toFixed(2)}</td>
                                <td className="p-1 text-right"><button type="button" onClick={() => removeItem(item.productId)}><TrashIcon /></button></td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>

            {/* Footer Calculations */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
            <div className="md:col-span-2"></div>
            <div className="text-right space-y-2 font-medium">
                <p>Total:</p>
                <p>Discount:</p>
                <p>Round Off:</p>
                <p className="font-bold text-lg">Grand Total:</p>
            </div>
            <div className="text-right space-y-2">
                <p>₹{subTotal.toFixed(2)}</p>
                <input type="number" step="0.01" value={overallDiscount} onChange={e => setOverallDiscount(e.target.value)} className="w-24 p-1 border bg-white rounded-md text-right h-6"/>
                <input type="number" step="0.01" value={roundOff} onChange={e => setRoundOff(e.target.value)} className="w-24 p-1 border bg-white rounded-md text-right h-6"/>
                <p className="font-bold text-lg">₹{grandTotal.toFixed(2)}</p>
            </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t mt-4">
            <button type="button" onClick={resetForm} className="px-4 py-2 bg-gray-200 rounded-md">Clear</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md">Save Bill</button>
        </div>
    </form>
);

interface BillHistoryProps {
    bills: Bill[];
    setViewingBill: (bill: Bill | null) => void;
}

const BillHistory = ({ bills, setViewingBill }: BillHistoryProps) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredBills = useMemo(() => {
        return bills.filter(b => 
            b.billNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            b.patientName.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [bills, searchTerm]);

    return (
    <div className="bg-white p-2 md:p-6 rounded-xl shadow-lg">
        <div>
          <input
            type="text"
            placeholder="Search by Bill No or Patient..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full max-w-sm p-2 bg-white border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 mb-4"
          />
        </div>
        <div className="overflow-x-auto">
        <table className="w-full text-sm text-left responsive-table">
            <thead className="text-xs text-black uppercase bg-gray-50">
            <tr>
                <th scope="col" className="px-6 py-3">Bill Number</th>
                <th scope="col" className="px-6 py-3">Date</th>
                <th scope="col" className="px-6 py-3">Patient Name</th>
                <th scope="col" className="px-6 py-3 text-right">Amount</th>
                <th scope="col" className="px-6 py-3 text-center">Actions</th>
            </tr>
            </thead>
            <tbody>
            {filteredBills.map(bill => (
                <tr key={bill.id} className="bg-white border-b hover:bg-gray-50">
                    <td data-label="Bill Number" className="px-6 py-4 font-medium">{bill.billNumber}</td>
                    <td data-label="Date" className="px-6 py-4">{new Date(bill.date).toLocaleDateString()}</td>
                    <td data-label="Patient Name" className="px-6 py-4">{bill.patientName}</td>
                    <td data-label="Amount" className="px-6 py-4 text-right font-semibold">₹{bill.grandTotal.toFixed(2)}</td>
                    <td data-label="Actions" className="px-6 py-4 text-center">
                        <button onClick={() => setViewingBill(bill)} className="text-black hover:text-black">
                            <PrintIcon />
                        </button>
                    </td>
                </tr>
            ))}
            </tbody>
        </table>
        {filteredBills.length === 0 && <p className="text-center text-black py-8">No bills found.</p>}
        </div>
    </div>
    );
};


interface BillingProps {
    bills: Bill[];
    products: Product[];
    onAddBill: (bill: Omit<Bill, 'id'>) => void;
}

const Billing = ({ bills, products, onAddBill }: BillingProps) => {
    const [activeTab, setActiveTab] = useState<'new' | 'history'>('new');

    // State for new bill form
    const [patientName, setPatientName] = useState('');
    const [doctorName, setDoctorName] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    // FIX: Simplified the complex type for the items state to prevent parsing errors.
    const [items, setItems] = useState<Omit<BillItem, 'serialNumber' | 'total'>[]>([]);
    const [selectedProductIdToAdd, setSelectedProductIdToAdd] = useState('');
    const [overallDiscount, setOverallDiscount] = useState('0');
    const [roundOff, setRoundOff] = useState('0');
    const [viewingBill, setViewingBill] = useState<Bill | null>(null);

    const availableProducts = useMemo(() => {
        const addedProductIds = items.map(item => item.productId);
        return products.filter(p => !addedProductIds.includes(p.id) && p.stock > 0);
    }, [products, items]);

    const { subTotal, grandTotal } = useMemo(() => {
        const subTotal = items.reduce((sum, item) => {
            const quantity = Number(item.quantity) || 0;
            const mrp = Number(item.mrp) || 0;
            const discount = Number(item.discount) || 0;
            const itemTotal = quantity * mrp;
            const discountedAmount = itemTotal * (1 - discount / 100);
            return sum + discountedAmount;
        }, 0);
        
        const discountValue = parseFloat(overallDiscount) || 0;
        const roundOffValue = parseFloat(roundOff) || 0;
        const grandTotal = subTotal - discountValue + roundOffValue;
        
        return { subTotal, grandTotal };
    }, [items, overallDiscount, roundOff]);

    const resetForm = () => {
        setPatientName('');
        setDoctorName('');
        setDate(new Date().toISOString().split('T')[0]);
        setItems([]);
        setOverallDiscount('0');
        setRoundOff('0');
    };

    const handleAddProductClick = () => {
        const productToAdd = products.find(p => p.id === selectedProductIdToAdd);
        if (productToAdd) {
            setItems(prev => [...prev, {
                productId: productToAdd.id,
                productName: productToAdd.name,
                expiryDate: '',
                quantity: 1,
                packaging: '',
                mrp: productToAdd.mrp,
                discount: 0,
            }]);
            setSelectedProductIdToAdd(''); // Reset dropdown
        }
    };

    const updateItem = (productId: string, field: keyof Omit<BillItem, 'productId' | 'serialNumber' | 'productName' | 'total'>, value: string | number) => {
        setItems(prev => prev.map(item => {
            if (item.productId === productId) {
                return { ...item, [field]: value };
            }
            return item;
        }));
    };

    const removeItem = (productId: string) => {
        setItems(prev => prev.filter(item => item.productId !== productId));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!patientName || !date || items.length === 0) {
            alert('Patient Name, Date, and at least one item are required.');
            return;
        }

        const finalItems: BillItem[] = items.map((item, index) => {
            const quantity = Number(item.quantity) || 0;
            const mrp = Number(item.mrp) || 0;
            const discount = Number(item.discount) || 0;
            const itemTotal = quantity * mrp;
            const discountedAmount = itemTotal * (1 - discount / 100);
            return {
                productId: item.productId,
                productName: item.productName,
                expiryDate: item.expiryDate,
                packaging: item.packaging,
                quantity: quantity,
                mrp: mrp,
                discount: discount,
                serialNumber: index + 1,
                total: discountedAmount,
            };
        });
        
        const billData: Omit<Bill, 'id'> = {
            patientName,
            doctorName,
            billNumber: `BILL-${Date.now()}`,
            date,
            items: finalItems,
            subTotal: subTotal,
            overallDiscount: parseFloat(overallDiscount) || 0,
            roundOff: parseFloat(roundOff) || 0,
            grandTotal: grandTotal,
        };

        onAddBill(billData);
        alert(`Bill ${billData.billNumber} created successfully!`);
        resetForm();
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold text-black">Billing</h2>
                 <div className="flex items-center bg-gray-200 rounded-lg p-1">
                    <button onClick={() => setActiveTab('new')} className={`px-4 py-2 text-sm font-medium rounded-md ${activeTab === 'new' ? 'bg-white shadow' : ''}`}>
                        New Bill
                    </button>
                    <button onClick={() => setActiveTab('history')} className={`px-4 py-2 text-sm font-medium rounded-md ${activeTab === 'history' ? 'bg-white shadow' : ''}`}>
                        Bill History
                    </button>
                </div>
            </div>

            {activeTab === 'new' ? (
                 <NewBillForm
                    handleSubmit={handleSubmit}
                    patientName={patientName}
                    setPatientName={setPatientName}
                    doctorName={doctorName}
                    setDoctorName={setDoctorName}
                    date={date}
                    setDate={setDate}
                    items={items}
                    updateItem={updateItem}
                    removeItem={removeItem}
                    selectedProductIdToAdd={selectedProductIdToAdd}
                    setSelectedProductIdToAdd={setSelectedProductIdToAdd}
                    availableProducts={availableProducts}
                    handleAddProductClick={handleAddProductClick}
                    subTotal={subTotal}
                    overallDiscount={overallDiscount}
                    setOverallDiscount={setOverallDiscount}
                    roundOff={roundOff}
                    setRoundOff={setRoundOff}
                    grandTotal={grandTotal}
                    resetForm={resetForm}
                />
            ) : (
                <BillHistory bills={bills} setViewingBill={setViewingBill} />
            )}

            {viewingBill && (
                 <Modal title={`Bill Details (${viewingBill.billNumber})`} onClose={() => setViewingBill(null)} size="lg">
                    <div className="space-y-4" id="bill-to-print">
                         <div className="text-center mb-4">
                            <h3 className="text-2xl font-bold text-black">Hajara Medicals</h3>
                            <p className="text-sm">123 Main Street, Anytown</p>
                            <p className="text-sm">Phone: 555-1234</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm border-y py-2">
                            <p><span className="font-semibold">Patient:</span> {viewingBill.patientName}</p>
                            <p><span className="font-semibold">Doctor:</span> {viewingBill.doctorName}</p>
                            <p><span className="font-semibold">Bill No:</span> {viewingBill.billNumber}</p>
                            <p><span className="font-semibold">Date:</span> {new Date(viewingBill.date).toLocaleDateString()}</p>
                        </div>

                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b">
                                    <th className="p-1 text-left">S.No</th>
                                    <th className="p-1 text-left">Product</th>
                                    <th className="p-1 text-right">Qty</th>
                                    <th className="p-1 text-right">MRP</th>
                                    <th className="p-1 text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {viewingBill.items.map(item => (
                                    <tr key={item.serialNumber}>
                                        <td className="p-1">{item.serialNumber}</td>
                                        <td className="p-1">{item.productName}</td>
                                        <td className="p-1 text-right">{item.quantity}</td>
                                        <td className="p-1 text-right">₹{item.mrp.toFixed(2)}</td>
                                        <td className="p-1 text-right">₹{item.total.toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div className="flex justify-end pt-2 border-t">
                            <div className="w-1/2 text-sm space-y-1">
                                <div className="flex justify-between"><span className="font-semibold">Sub Total:</span> <span>₹{viewingBill.subTotal.toFixed(2)}</span></div>
                                <div className="flex justify-between"><span className="font-semibold">Discount:</span> <span>- ₹{viewingBill.overallDiscount.toFixed(2)}</span></div>
                                <div className="flex justify-between"><span className="font-semibold">Round Off:</span> <span>₹{viewingBill.roundOff.toFixed(2)}</span></div>
                                <div className="flex justify-between font-bold text-base border-t mt-1 pt-1"><span >Grand Total:</span> <span>₹{viewingBill.grandTotal.toFixed(2)}</span></div>
                            </div>
                        </div>
                    </div>
                     <div className="flex justify-end pt-4 border-t mt-4">
                        <button type="button" onClick={() => setViewingBill(null)} className="px-4 py-2 bg-gray-200 rounded-md">Close</button>
                    </div>
                </Modal>
            )}

        </div>
    );
};

export default Billing;
