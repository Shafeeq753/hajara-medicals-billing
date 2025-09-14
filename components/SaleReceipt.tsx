import React from 'react';
import { Sale } from '../types';
import { PrintIcon } from './icons/Icons';

declare var jspdf: any;

interface SaleReceiptProps {
  sale: Sale;
}

const SaleReceipt: React.FC<SaleReceiptProps> = ({ sale }) => {

  const handleExportPdf = () => {
    const { jsPDF } = jspdf;
    const doc = new jsPDF();

    // Title
    doc.setFontSize(22);
    doc.text("Hajara Medicals Invoice", 105, 20, { align: 'center' });

    // Customer Info
    doc.setFontSize(12);
    doc.text(`Bill To: ${sale.customerName}`, 20, 40);
    doc.text(`Sale ID: ${sale.id}`, 20, 47);
    doc.text(`Date: ${new Date(sale.date).toLocaleDateString()}`, 20, 54);

    // Items Table
    const tableColumn = ["Product Name", "Batch No", "Qty", "MRP", "Total"];
    const tableRows: any[] = [];
    sale.items.forEach(item => {
      const itemData = [
        item.productName,
        item.batchNo,
        item.quantity,
        `Rs. ${item.mrp.toFixed(2)}`,
        `Rs. ${item.total.toFixed(2)}`
      ];
      tableRows.push(itemData);
    });

    doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 65,
        theme: 'grid'
    });
    
    // Summary
    let finalY = (doc as any).lastAutoTable.finalY;
    doc.setFontSize(12);
    doc.text(`Subtotal: Rs. ${sale.subtotal.toFixed(2)}`, 180, finalY + 10, { align: 'right' });
    doc.text(`Discount: Rs. ${sale.discount.toFixed(2)}`, 180, finalY + 17, { align: 'right' });
    doc.setFont("helvetica", "bold");
    doc.text(`Total: Rs. ${sale.total.toFixed(2)}`, 180, finalY + 24, { align: 'right' });
    doc.setFont("helvetica", "normal");
    doc.text(`Paid: Rs. ${sale.amountPaid.toFixed(2)}`, 180, finalY + 31, { align: 'right' });
    doc.setFont("helvetica", "bold");
    doc.text(`Balance: Rs. ${sale.balance.toFixed(2)}`, 180, finalY + 38, { align: 'right' });

    doc.save(`invoice-${sale.id}.pdf`);
  };

  return (
    <div className="space-y-4">
      <div id="receipt-content" className="p-4 border rounded-lg bg-gray-50 max-h-[60vh] overflow-y-auto">
        <h3 className="text-xl font-bold text-center mb-4">Hajara Medicals</h3>
        <div className="text-sm space-y-1 mb-4 border-b pb-2">
            <p><span className="font-semibold">Sale ID:</span> {sale.id}</p>
            <p><span className="font-semibold">Customer:</span> {sale.customerName}</p>
            <p><span className="font-semibold">Date:</span> {new Date(sale.date).toLocaleString()}</p>
        </div>
        <table className="w-full text-sm">
            <thead>
                <tr className="border-b">
                    <th className="text-left py-1">Item</th>
                    <th className="text-center py-1">Qty</th>
                    <th className="text-right py-1">Price</th>
                    <th className="text-right py-1">Total</th>
                </tr>
            </thead>
            <tbody>
                {sale.items.map(item => (
                    <tr key={item.productId}>
                        <td className="py-1">{item.productName}</td>
                        <td className="text-center py-1">{item.quantity}</td>
                        <td className="text-right py-1">₹{item.mrp.toFixed(2)}</td>
                        <td className="text-right py-1">₹{item.total.toFixed(2)}</td>
                    </tr>
                ))}
            </tbody>
        </table>
        <div className="mt-4 pt-4 border-t text-right space-y-1 text-sm">
            <p><span className="font-semibold">Subtotal:</span> ₹{sale.subtotal.toFixed(2)}</p>
            <p><span className="font-semibold">Discount:</span> ₹{sale.discount.toFixed(2)}</p>
            <p className="font-bold text-base"><span className="font-bold">Total:</span> ₹{sale.total.toFixed(2)}</p>
            <p><span className="font-semibold">Amount Paid:</span> ₹{sale.amountPaid.toFixed(2)}</p>
            <p className="font-bold"><span className="font-semibold">Balance:</span> ₹{sale.balance.toFixed(2)}</p>
        </div>
      </div>
       <button 
        onClick={handleExportPdf}
        className="w-full bg-green-500 text-white py-2 rounded-lg text-md font-bold hover:bg-green-600 flex items-center justify-center gap-2"
      >
        <PrintIcon /> Export to PDF
      </button>
    </div>
  );
};

export default SaleReceipt;