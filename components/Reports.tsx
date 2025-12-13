
import React, { useState, useMemo } from 'react';
import { Sale, Purchase, Bill, LogEntry, Product } from '../types';
import { PrintIcon, CalendarIcon, CurrencyIcon, UsersIcon, BoxIcon, SupplierIcon } from './icons/Icons';

interface ReportsProps {
  sales: Sale[];
  purchases: Purchase[];
  bills: Bill[];
  logs: LogEntry[];
  products: Product[];
}

type RangeType = 'today' | 'week' | 'month' | 'year' | 'all' | 'custom';

const Reports = ({ sales, purchases, bills, logs, products }: ReportsProps) => {
  const [rangeType, setRangeType] = useState<RangeType>('week');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Initial setup of dates based on rangeType
  useMemo(() => {
    const today = new Date();
    let start = new Date();
    let end = new Date();

    switch (rangeType) {
      case 'today':
        break;
      case 'week':
        start.setDate(today.getDate() - 7);
        break;
      case 'month':
        start.setMonth(today.getMonth() - 1);
        break;
      case 'year':
        start.setFullYear(today.getFullYear() - 1);
        break;
      case 'all':
        start = new Date('2020-01-01'); // Arbitrary far past
        break;
      case 'custom':
        return; // Don't change dates if custom
    }

    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  }, [rangeType]);

  const filterByDate = (itemDate: string) => {
    if (!startDate || !endDate) return true;
    const d = new Date(itemDate).toISOString().split('T')[0];
    return d >= startDate && d <= endDate;
  };

  const filteredSales = useMemo(() => sales.filter(s => filterByDate(s.date)), [sales, startDate, endDate]);
  const filteredPurchases = useMemo(() => purchases.filter(p => filterByDate(p.date)), [purchases, startDate, endDate]);
  const filteredBills = useMemo(() => bills.filter(b => filterByDate(b.date)), [bills, startDate, endDate]);
  
  // Using logs to find "New" additions
  const newCustomersCount = useMemo(() => logs.filter(l => l.action.includes('Added customer') && filterByDate(l.timestamp)).length, [logs, startDate, endDate]);
  const newSuppliersCount = useMemo(() => logs.filter(l => l.action.includes('Added supplier') && filterByDate(l.timestamp)).length, [logs, startDate, endDate]);
  const newProductsCount = useMemo(() => logs.filter(l => l.action.includes('Added product') && filterByDate(l.timestamp)).length, [logs, startDate, endDate]);

  const stats = useMemo(() => {
    const salesTotal = filteredSales.reduce((sum, s) => sum + s.amount, 0);
    const billsTotal = filteredBills.reduce((sum, b) => sum + b.grandTotal, 0);
    const totalRevenue = salesTotal + billsTotal;
    
    const purchasesTotal = filteredPurchases.reduce((sum, p) => sum + p.total, 0);
    const paidPurchases = filteredPurchases.reduce((sum, p) => sum + p.paidAmount, 0);
    const pendingPurchases = purchasesTotal - paidPurchases;
    
    const totalSavings = filteredSales.reduce((sum, s) => sum + s.savings, 0);
    
    return {
      totalRevenue,
      salesTotal,
      billsTotal,
      purchasesTotal,
      paidPurchases,
      pendingPurchases,
      totalSavings,
      totalOrders: filteredPurchases.length,
      totalSalesCount: filteredSales.length,
      totalBillsCount: filteredBills.length,
    };
  }, [filteredSales, filteredPurchases, filteredBills]);

  const handleExportPDF = () => {
    const { jsPDF } = (window as any).jspdf;
    const doc = new jsPDF();

    doc.setFontSize(22);
    doc.text('Hajara Medicals - Business Report', 14, 20);
    
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 28);
    doc.text(`Period: ${startDate} to ${endDate}`, 14, 33);

    let yPos = 45;

    // Summary Section
    doc.setFontSize(14);
    doc.text('Financial Summary', 14, yPos);
    yPos += 10;

    const summaryData = [
      ['Total Revenue', `Rs. ${stats.totalRevenue.toFixed(2)}`],
      ['Total Purchases', `Rs. ${stats.purchasesTotal.toFixed(2)}`],
      ['Net Profit (Est)', `Rs. ${(stats.totalRevenue - stats.purchasesTotal).toFixed(2)}`],
      ['Savings Recorded', `Rs. ${stats.totalSavings.toFixed(2)}`],
    ];

    (doc as any).autoTable({
      startY: yPos,
      head: [['Metric', 'Value']],
      body: summaryData,
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185] },
    });
    
    yPos = (doc as any).lastAutoTable.finalY + 15;

    // Operational Section
    doc.text('Operational Summary', 14, yPos);
    yPos += 10;

    const opsData = [
      ['New Customers', newCustomersCount],
      ['New Suppliers', newSuppliersCount],
      ['New Products Added', newProductsCount],
      ['Sales Transactions', stats.totalSalesCount],
      ['Billing Transactions', stats.totalBillsCount],
      ['Purchase Orders', stats.totalOrders],
    ];

    (doc as any).autoTable({
      startY: yPos,
      head: [['Metric', 'Count']],
      body: opsData,
      theme: 'striped',
    });

    yPos = (doc as any).lastAutoTable.finalY + 15;

    // Detailed Breakdowns if space permits or new page
     if (yPos > 250) {
        doc.addPage();
        yPos = 20;
    }

    doc.text('Breakdown Details', 14, yPos);
    yPos += 10;
    
     const breakdownData = [
        ['Sales (Direct)', `Rs. ${stats.salesTotal.toFixed(2)}`],
        ['Billing (Invoices)', `Rs. ${stats.billsTotal.toFixed(2)}`],
        ['Purchases (Paid)', `Rs. ${stats.paidPurchases.toFixed(2)}`],
        ['Purchases (Pending)', `Rs. ${stats.pendingPurchases.toFixed(2)}`],
    ];

    (doc as any).autoTable({
        startY: yPos,
        head: [['Category', 'Amount']],
        body: breakdownData,
        theme: 'grid',
    });

    doc.save(`report_${startDate}_${endDate}.pdf`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-3xl font-bold text-black">Reports & Analytics</h2>
        <div className="flex flex-wrap items-center gap-2">
           <select 
             value={rangeType} 
             onChange={(e) => setRangeType(e.target.value as RangeType)}
             className="p-2 border rounded-md bg-white shadow-sm"
           >
             <option value="today">Today</option>
             <option value="week">Last 7 Days</option>
             <option value="month">Last 30 Days</option>
             <option value="year">Last Year</option>
             <option value="all">All Time</option>
             <option value="custom">Custom Range</option>
           </select>
           {rangeType === 'custom' && (
             <div className="flex gap-2">
               <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="p-2 border rounded-md bg-gray-50" />
               <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="p-2 border rounded-md bg-gray-50" />
             </div>
           )}
           <button onClick={handleExportPDF} className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 flex items-center gap-2">
             <PrintIcon /> Export PDF
           </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-md border-l-4 border-green-500">
           <div className="flex justify-between items-center">
              <div>
                 <p className="text-sm text-gray-500">Total Revenue</p>
                 <p className="text-2xl font-bold text-black">₹{stats.totalRevenue.toFixed(2)}</p>
              </div>
              <div className="bg-green-100 p-2 rounded-full text-green-600"><CurrencyIcon /></div>
           </div>
           <p className="text-xs text-gray-500 mt-2">{stats.totalSalesCount + stats.totalBillsCount} transactions</p>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-md border-l-4 border-red-500">
           <div className="flex justify-between items-center">
              <div>
                 <p className="text-sm text-gray-500">Total Expenses</p>
                 <p className="text-2xl font-bold text-black">₹{stats.purchasesTotal.toFixed(2)}</p>
              </div>
              <div className="bg-red-100 p-2 rounded-full text-red-600"><BoxIcon /></div>
           </div>
           <p className="text-xs text-gray-500 mt-2">{stats.totalOrders} orders placed</p>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-md border-l-4 border-blue-500">
           <div className="flex justify-between items-center">
              <div>
                 <p className="text-sm text-gray-500">New Customers</p>
                 <p className="text-2xl font-bold text-black">{newCustomersCount}</p>
              </div>
              <div className="bg-blue-100 p-2 rounded-full text-blue-600"><UsersIcon /></div>
           </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-md border-l-4 border-purple-500">
           <div className="flex justify-between items-center">
              <div>
                 <p className="text-sm text-gray-500">New Suppliers</p>
                 <p className="text-2xl font-bold text-black">{newSuppliersCount}</p>
              </div>
              <div className="bg-purple-100 p-2 rounded-full text-purple-600"><SupplierIcon /></div>
           </div>
        </div>
      </div>

      {/* Detailed Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         {/* Financial Breakdown */}
         <div className="bg-white p-6 rounded-xl shadow-lg">
            <h3 className="text-lg font-bold text-black mb-4">Financial Breakdown</h3>
            <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span>Direct Sales</span>
                    <span className="font-semibold">₹{stats.salesTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span>Billing Invoices</span>
                    <span className="font-semibold">₹{stats.billsTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                    <span>Purchases (Total)</span>
                    <span className="font-semibold text-red-600">- ₹{stats.purchasesTotal.toFixed(2)}</span>
                </div>
                 <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border-t border-blue-200">
                    <span className="font-bold">Net Estimate</span>
                    <span className="font-bold text-blue-700">₹{(stats.totalRevenue - stats.purchasesTotal).toFixed(2)}</span>
                </div>
            </div>
         </div>

         {/* Purchase Stats */}
         <div className="bg-white p-6 rounded-xl shadow-lg">
            <h3 className="text-lg font-bold text-black mb-4">Purchase Stats</h3>
            <div className="space-y-4">
               <div className="flex justify-between items-center">
                  <span>Total Orders</span>
                  <span className="font-bold">{stats.totalOrders}</span>
               </div>
               <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div className="bg-green-600 h-2.5 rounded-full" style={{ width: `${stats.purchasesTotal > 0 ? (stats.paidPurchases / stats.purchasesTotal) * 100 : 0}%` }}></div>
               </div>
               <div className="flex justify-between text-sm">
                  <span className="text-green-600 font-semibold">Paid: ₹{stats.paidPurchases.toFixed(2)}</span>
                  <span className="text-red-500 font-semibold">Pending: ₹{stats.pendingPurchases.toFixed(2)}</span>
               </div>
               <div className="pt-4 border-t">
                  <p className="text-sm text-gray-600 mb-1">Stock Value Added (Estimate)</p>
                  <p className="text-xl font-bold">₹{stats.purchasesTotal.toFixed(2)}</p>
               </div>
            </div>
         </div>
      </div>
      
       <div className="bg-white p-6 rounded-xl shadow-lg">
            <h3 className="text-lg font-bold text-black mb-2">Pattern Analysis</h3>
            <p className="text-gray-600 text-sm mb-4">Based on the data from {startDate} to {endDate}</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div className="p-4 border rounded-lg">
                    <p className="text-sm font-semibold text-gray-500">Avg. Sale Value</p>
                    <p className="text-xl font-bold text-blue-600">
                        ₹{stats.totalSalesCount + stats.totalBillsCount > 0 ? (stats.totalRevenue / (stats.totalSalesCount + stats.totalBillsCount)).toFixed(2) : '0.00'}
                    </p>
                </div>
                 <div className="p-4 border rounded-lg">
                    <p className="text-sm font-semibold text-gray-500">Avg. Purchase Order</p>
                    <p className="text-xl font-bold text-purple-600">
                        ₹{stats.totalOrders > 0 ? (stats.purchasesTotal / stats.totalOrders).toFixed(2) : '0.00'}
                    </p>
                </div>
                 <div className="p-4 border rounded-lg">
                    <p className="text-sm font-semibold text-gray-500">Savings Value</p>
                    <p className="text-xl font-bold text-green-600">
                         ₹{stats.totalSavings.toFixed(2)}
                    </p>
                </div>
            </div>
       </div>

    </div>
  );
};

export default Reports;
