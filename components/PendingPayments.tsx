import React, { useState, useMemo } from 'react';
import { Purchase, PaymentRecord } from '../types';
import Modal from './Modal';
import PaymentForm from './PaymentForm';
import { CurrencyIcon, EditIcon } from './icons/Icons';

interface PendingPaymentsProps {
  purchases: Purchase[];
  onUpdatePayment: (purchaseId: string, paymentRecord: Omit<PaymentRecord, 'id'>) => void;
  stockAmount: number;
}

const StatusBadge = ({ status }: { status: 'Unpaid' | 'Partially Paid' | 'Paid' }) => {
    const baseClasses = "px-2.5 py-1 text-xs font-medium rounded-full";
    const statusClasses = {
        'Unpaid': "bg-red-100 text-black",
        'Partially Paid': "bg-yellow-100 text-black",
        'Paid': "bg-green-100 text-black",
    };
    return <span className={`${baseClasses} ${statusClasses[status]}`}>{status}</span>;
}


const PendingPayments = ({ purchases, onUpdatePayment, stockAmount }: PendingPaymentsProps) => {
    const [paymentModalPurchase, setPaymentModalPurchase] = useState<Purchase | null>(null);
    const [historyModalPurchase, setHistoryModalPurchase] = useState<Purchase | null>(null);


    const pendingPurchases = useMemo(() => {
        return purchases
            .filter(p => p.paymentStatus !== 'Paid')
            .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [purchases]);

    const handleSavePayment = (purchaseId: string, paymentRecord: Omit<PaymentRecord, 'id'>) => {
        onUpdatePayment(purchaseId, paymentRecord);
        setPaymentModalPurchase(null);
    }

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-black">Pending Purchase Payments</h2>

            <div className={`p-6 rounded-xl shadow-lg flex items-center space-x-4 ${stockAmount >= 0 ? 'bg-white' : 'bg-red-50'}`}>
                <div className={`p-3 rounded-full ${stockAmount >= 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                    <CurrencyIcon />
                </div>
                <div>
                    <p className="text-sm font-medium text-black">Current Stock Amount (Cash on Hand)</p>
                    <p className={`text-2xl font-bold ${stockAmount >= 0 ? 'text-black' : 'text-red-600'}`}>₹{stockAmount.toFixed(2)}</p>
                </div>
            </div>

            <div className="bg-white p-2 md:p-6 rounded-xl shadow-lg">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left responsive-table">
                        <thead className="text-xs text-black uppercase bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3">Purchase ID</th>
                                <th scope="col" className="px-6 py-3">Supplier</th>
                                <th scope="col" className="px-6 py-3">Date</th>
                                <th scope="col" className="px-6 py-3 text-right">Total Amount</th>
                                <th scope="col" className="px-6 py-3 text-right">Amount Paid</th>
                                <th scope="col" className="px-6 py-3 text-right">Balance Due</th>
                                <th scope="col" className="px-6 py-3 text-center">Status</th>
                                <th scope="col" className="px-6 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pendingPurchases.map(purchase => {
                                const balance = purchase.total - purchase.paidAmount;
                                return (
                                <tr key={purchase.id} className="bg-white border-b hover:bg-gray-50">
                                    <td data-label="Purchase ID" className="px-6 py-4 font-medium text-black whitespace-nowrap">
                                        <button onClick={() => setHistoryModalPurchase(purchase)} className="font-medium text-black hover:underline text-left">
                                            {purchase.id}
                                        </button>
                                    </td>
                                    <td data-label="Supplier" className="px-6 py-4">{purchase.supplierName}</td>
                                    <td data-label="Date" className="px-6 py-4">{new Date(purchase.date).toLocaleDateString()}</td>
                                    <td data-label="Total Amount" className="px-6 py-4 text-right">₹{purchase.total.toFixed(2)}</td>
                                    <td data-label="Amount Paid" className="px-6 py-4 text-right text-green-600">₹{purchase.paidAmount.toFixed(2)}</td>
                                    <td data-label="Balance Due" className="px-6 py-4 font-semibold text-black text-right">₹{balance.toFixed(2)}</td>
                                    <td data-label="Status" className="px-6 py-4 text-center"><StatusBadge status={purchase.paymentStatus} /></td>
                                    <td data-label="Actions" className="px-6 py-4 text-right">
                                        <button onClick={() => setPaymentModalPurchase(purchase)} className="text-black hover:text-black">
                                            <EditIcon />
                                        </button>
                                    </td>
                                </tr>
                            )})}
                        </tbody>
                    </table>
                     {pendingPurchases.length === 0 && <p className="text-center text-black py-8">No pending payments found.</p>}
                </div>
            </div>

            {paymentModalPurchase && (
                <Modal title={`Update Payment for ${paymentModalPurchase.id}`} onClose={() => setPaymentModalPurchase(null)}>
                    <PaymentForm
                        purchase={paymentModalPurchase}
                        onSave={handleSavePayment}
                        onCancel={() => setPaymentModalPurchase(null)}
                    />
                </Modal>
            )}

            {historyModalPurchase && (
                 <Modal title={`Payment History for ${historyModalPurchase.id}`} onClose={() => setHistoryModalPurchase(null)} size="lg">
                    <div className="space-y-4">
                       <div className="p-4 bg-gray-50 rounded-lg border text-sm">
                           <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                               <p><span className="font-semibold">Supplier:</span> {historyModalPurchase.supplierName}</p>
                               <p><span className="font-semibold">Date:</span> {new Date(historyModalPurchase.date).toLocaleDateString()}</p>
                           </div>
                       </div>
                        {historyModalPurchase.paymentHistory.length > 0 ? (
                             <div className="overflow-y-auto max-h-[40vh]">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-black uppercase bg-gray-100 sticky top-0">
                                        <tr>
                                            <th scope="col" className="px-4 py-2">Date Paid</th>
                                            <th scope="col" className="px-4 py-2 text-right">Amount</th>
                                            <th scope="col" className="px-4 py-2 text-center">Screenshot</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                    {historyModalPurchase.paymentHistory.map(record => (
                                        <tr key={record.id} className="bg-white border-b">
                                            <td className="px-4 py-2">{new Date(record.date).toLocaleDateString()}</td>
                                            <td className="px-4 py-2 text-right">₹{record.amount.toFixed(2)}</td>
                                            <td className="px-4 py-2 text-center">
                                                {record.screenshotUrl ? 
                                                    <a href={record.screenshotUrl} target="_blank" rel="noopener noreferrer" className="text-black font-medium hover:underline">View</a>
                                                    : 'N/A'
                                                }
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p className="text-center text-black py-4">No payment history for this purchase yet.</p>
                        )}
                         <div className="flex justify-end pt-4 border-t">
                            <button onClick={() => setHistoryModalPurchase(null)} className="px-4 py-2 bg-gray-200 text-black rounded-md hover:bg-gray-300">
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