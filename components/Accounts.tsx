
import React from 'react';
import { View } from '../types';
import { PurchasesIcon, SalesIcon, PendingPaymentsIcon, BillingIcon, BoxIcon } from './icons/Icons';

interface AccountsProps {
  setActiveView: (view: View) => void;
}

const ActionCard = ({ title, icon, onClick }: { title: string; icon: React.ReactElement; onClick: () => void; }) => (
    <button
        onClick={onClick}
        className="bg-white p-8 rounded-xl shadow-lg flex flex-col items-center justify-center space-y-4 transition-all duration-300 transform hover:-translate-y-2 hover:shadow-2xl w-full"
    >
        <div className="p-4 bg-blue-100 rounded-full text-blue-600">
            {React.cloneElement(icon, { className: "w-10 h-10" })}
        </div>
        <p className="text-xl font-bold text-black text-center">{title}</p>
    </button>
);


const Accounts = ({ setActiveView }: AccountsProps) => {
  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold text-black">Accounts Management</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 pt-4">
        <ActionCard
          title="Manage Sales"
          icon={<SalesIcon />}
          onClick={() => setActiveView('sales')}
        />
        <ActionCard
          title="Daily Purchases"
          icon={<BoxIcon />}
          onClick={() => setActiveView('dailyPurchases')}
        />
        <ActionCard
          title="Manage Purchases"
          icon={<PurchasesIcon />}
          onClick={() => setActiveView('purchases')}
        />
         <ActionCard
          title="Pending Payments"
          icon={<PendingPaymentsIcon />}
          onClick={() => setActiveView('pendingPayments')}
        />
        <ActionCard
          title="Billing"
          icon={<BillingIcon />}
          onClick={() => setActiveView('billing')}
        />
      </div>
    </div>
  );
};

export default Accounts;
