
import React, { useState, useMemo } from 'react';
import { Purchase, PaymentRecord } from '../types';
import Modal from './Modal';
import PaymentForm from './PaymentForm';
import { CurrencyIcon, EditIcon, BoxIcon, AccountsIcon } from './icons/Icons';

interface PendingPaymentsProps {
  purchases: Purchase[];
  onUpdatePayment: (purchaseId: string, paymentRecord: Omit<PaymentRecord, 'id'>) => void;
  stockAmount: number;
  savingsBalance: number;
  bankBalance: number;
}

const StatusBadge = ({ status }: { status: 'Unpaid' | 'Partially Paid' | 'Paid' }) => {
    const baseClasses = "px-2.5 py-1 text-xs font-medium rounded-full";
    const statusClasses = {
        'Unpaid': "bg-red-100 text-red-700",
        'Partially Paid': "bg-yellow-100 text-yellow-700",
        'Paid': "bg-green-100 text-green-700",
    };
    return <span className={`${baseClasses} ${statusClasses[status]}`}>{status}</span>;
}


const PendingPayments = ({ purchases, onUpdatePayment, stockAmount, savingsBalance, bankBalance }: PendingPaymentsProps) => {
    const [paymentModalPurchase, setPaymentModalPurchase] = useState<Purchase | null>(null);
    const [historyModalPurchase, setHistoryModalPurchase] = useState<Purchase | null>(null);
    const [searchTerm, setSearchTerm] = useState('');


    const pendingPurchases = useMemo(() => {
        return purchases
            .filter(p => p.paymentStatus !== 'Paid')
            .filter(p => 
                p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.supplierName.toLowerCase().includes(searchTerm.toLowerCase())
            )
            .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [purchases, searchTerm]);

    const handleSavePayment = (purchaseId: string, paymentRecord: Omit<PaymentRecord, 'id'>) => {
        onUpdatePayment(purchaseId, paymentRecord);
        setPaymentModalPurchase(null);
    }

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-black">Supplier Dues</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className={`p-4 rounded-xl shadow flex items-center space-x-3 bg-white`}>
                    <div className={`p-2 rounded-full bg-blue-50 text-blue-600`}>
                        <CurrencyIcon />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-gray-500 uppercase">Stock (Counter)</p>
                        <p className={`text-lg font-bold text-black`}>₹{stockAmount.toFixed(2)}</p>
                    </div>
                </div>
                <div className={`p-4 rounded-xl shadow flex items-center space-x-3 bg-white`}>
                    <div className={`p-2 rounded-full bg-green-50 text-green-600`}>
                        <BoxIcon />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-gray-500 uppercase">Savings</p>
                        <p className={`text-lg font-bold text-black`}>₹{savingsBalance.toFixed(2)}</p>
                    </div>
                </div>
                <div className={`p-4 rounded-xl shadow flex items-center space-x-3 bg-white`}>
                    <div className={`p-2 rounded-full bg-purple-50 text-purple-600`}>
                        <AccountsIcon />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-gray-500 uppercase">Bank Assets</p>
                        <p className={`text-lg font-bold text-black`}>₹{bankBalance.toFixed(2)}</p>
                    </div>
                </div>
            </div>

            <div className="bg-white p-2 md:p-6 rounded-xl shadow-lg border border-gray-100">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                    <input
                        type="text"
                        placeholder="Filter by Supplier or ID..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full max-w-sm p-2 bg-white border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-black"
                    />
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{pendingPurchases.length} Pending Bills</p>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left responsive-table">
                        <thead className="text-[10px] text-gray-400 uppercase bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3">Bill ID</th>
                                <th scope="col" className="px-6 py-3">Supplier</th>
                                <th scope="col" className="px-6 py-3">Date</th>
                                <th scope="col" className="px-6 py-3 text-right">Total</th>
                                <th scope="col" className="px-6 py-3 text-right">Paid</th>
                                <th scope="col" className="px-6 py-3 text-right font-black">Balance Due</th>
                                <th scope="col" className="px-6 py-3 text-center">Status</th>
                                <th scope="col" className="px-6 py-3 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pendingPurchases.map(purchase => {
                                const balance = purchase.total - purchase.paidAmount;
                                return (
                                <tr key={purchase.id} className="bg-white border-b hover:bg-gray-50 transition-colors">
                                    <td data-label="Purchase ID" className="px-6 py-4 font-medium text-black whitespace-nowrap">
                                        <button onClick={() => setHistoryModalPurchase(purchase)} className="font-medium text-black hover:underline text-left">
                                            {purchase.id.slice(-8)}
                                        </button>
                                    </td>
                                    <td data-label="Supplier" className="px-6 py-4 text-black">{purchase.supplierName}</td>
                                    <td data-label="Date" className="px-6 py-4 text-gray-500">{new Date(purchase.date).toLocaleDateString()}</td>
                                    <td data-label="Total Amount" className="px-6 py-4 text-right text-black">₹{purchase.total.toFixed(2)}</td>
                                    <td data-label="Amount Paid" className="px-6 py-4 text-right text-green-600">₹{purchase.paidAmount.toFixed(2)}</td>
                                    <td data-label="Balance Due" className="px-6 py-4 font-black text-red-600 text-right">₹{balance.toFixed(2)}</td>
                                    <td data-label="Status" className="px-6 py-4 text-center"><StatusBadge status={purchase.paymentStatus} /></td>
                                    <td data-label="Actions" className="px-6 py-4 text-right">
                                        <button onClick={() => setPaymentModalPurchase(purchase)} className="text-blue-600 hover:text-blue-800 transition-colors p-2 rounded-full hover:bg-blue-50">
                                            <EditIcon />
                                        </button>
                                    </td>
                                </tr>
                            )})}
                        </tbody>
                    </table>
                     {pendingPurchases.length === 0 && <div className="text-center text-gray-500 py-16">All supplier bills are cleared. Well done!</div>}
                </div>
            </div>

            {paymentModalPurchase && (
                <Modal title={`Pay Balance: ${paymentModalPurchase.id.slice(-8)}`} onClose={() => setPaymentModalPurchase(null)}>
                    <PaymentForm
                        purchase={paymentModalPurchase}
                        onSave={handleSavePayment}
                        onCancel={() => setPaymentModalPurchase(null)}
                    />
                </Modal>
            )}

            {historyModalPurchase && (
                 <Modal title={`Ledger: ${historyModalPurchase.id.slice(-8)}`} onClose={() => setHistoryModalPurchase(null)} size="lg">
                    <div className="space-y-4">
                       <div className="p-4 bg-gray-50 rounded-lg border text-sm">
                           <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                               <p><span className="font-semibold text-gray-500">Supplier:</span> {historyModalPurchase.supplierName}</p>
                               <p><span className="font-semibold text-gray-500">Bill Date:</span> {new Date(historyModalPurchase.date).toLocaleDateString()}</p>
                           </div>
                       </div>
                        {historyModalPurchase.paymentHistory.length > 0 ? (
                             <div className="overflow-y-auto max-h-[40vh]">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-[10px] text-gray-400 uppercase bg-gray-100 sticky top-0">
                                        <tr>
                                            <th scope="col" className="px-4 py-2">Paid On</th>
                                            <th scope="col" className="px-4 py-2">Through</th>
                                            <th scope="col" className="px-4 py-2 text-right">Amount</th>
                                            <th scope="col" className="px-4 py-2 text-center">Proof</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                    {historyModalPurchase.paymentHistory.map(record => (
                                        <tr key={record.id} className="bg-white border-b">
                                            <td className="px-4 py-2 text-gray-600">{new Date(record.date).toLocaleDateString()}</td>
                                            <td className="px-4 py-2">
                                                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-gray-100 text-gray-600">{record.source}</span>
                                            </td>
                                            <td className="px-4 py-2 text-right font-black text-blue-700">₹{record.amount.toFixed(2)}</td>
                                            <td className="px-4 py-2 text-center">
                                                {record.screenshotUrl ? 
                                                    <a href={record.screenshotUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 font-bold hover:underline">View</a>
                                                    : <span className="text-gray-300">-</span>
                                                }
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p className="text-center text-gray-400 py-8 italic">No payments recorded for this bill yet.</p>
                        )}
                         <div className="flex justify-end pt-4 border-t">
                            <button onClick={() => setHistoryModalPurchase(null)} className="px-6 py-2 bg-gray-100 text-black rounded-xl font-bold hover:bg-gray-200">
                                Close
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default PendingPayments;
