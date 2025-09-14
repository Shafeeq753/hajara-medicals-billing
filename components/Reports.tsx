import React, { useMemo } from 'react';
import { Sale } from '../types';

interface ReportsProps {
  sales: Sale[];
}

interface BalanceReport {
  customerId: string;
  customerName: string;
  totalBalance: number;
}

const Reports: React.FC<ReportsProps> = ({ sales }) => {
  const balanceReports = useMemo<BalanceReport[]>(() => {
    const customerBalances: { [key: string]: BalanceReport } = {};

    sales.forEach(sale => {
      if (sale.balance > 0) {
        if (!customerBalances[sale.customerId]) {
          customerBalances[sale.customerId] = {
            customerId: sale.customerId,
            customerName: sale.customerName,
            totalBalance: 0,
          };
        }
        customerBalances[sale.customerId].totalBalance += sale.balance;
      }
    });

    return Object.values(customerBalances).sort((a,b) => b.totalBalance - a.totalBalance);
  }, [sales]);

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-900">Reports</h2>
      
      <div className="bg-white p-2 md:p-6 rounded-xl shadow-lg">
        <h3 className="text-xl font-semibold text-gray-900 mb-4 p-2 md:p-0">Customer Outstanding Balances</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left responsive-table">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="p-3 font-medium text-gray-800">Customer Name</th>
                <th className="p-3 font-medium text-gray-800 text-right">Total Balance</th>
              </tr>
            </thead>
            <tbody>
              {balanceReports.length > 0 ? (
                balanceReports.map(report => (
                  <tr key={report.customerId}>
                    <td data-label="Customer" className="font-semibold text-gray-900">{report.customerName}</td>
                    <td data-label="Balance" className="text-red-600 font-bold text-right">₹{report.totalBalance.toFixed(2)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={2} className="p-4 text-center text-gray-700">No outstanding balances found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports;