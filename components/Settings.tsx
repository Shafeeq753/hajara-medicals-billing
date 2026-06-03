import React, { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
import { AppData } from '../lib/storage';
import {
  isFsAccessSupported, pickMirrorFolder, reconnectMirrorFolder,
  forgetMirrorFolder, hasMirrorFolder, writeMirror, downloadJsonBackup,
} from '../lib/localMirror';

interface Props {
  data: AppData;
}

const Settings: React.FC<Props> = ({ data }) => {
  const supported = isFsAccessSupported();
  const [folderName, setFolderName] = useState<string | null>(null);
  const [hasFolder, setHasFolder] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    (async () => {
      setHasFolder(await hasMirrorFolder());
      const name = await reconnectMirrorFolder(false);
      if (name) setFolderName(name);
    })();
  }, []);

  const flash = (kind: 'ok' | 'err', text: string) => {
    setMessage({ kind, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const handleChangeFolder = async () => {
    setBusy(true);
    try {
      const chosen = await pickMirrorFolder();
      if (chosen) {
        setFolderName(chosen);
        setHasFolder(true);
        await writeMirror(data);
        flash('ok', `Local backup folder set to "${chosen}". A backup file was written.`);
      }
    } catch (err) {
      flash('err', String(err instanceof Error ? err.message : err));
    } finally {
      setBusy(false);
    }
  };

  const handleBackupNow = async () => {
    setBusy(true);
    try {
      const ok = await writeMirror(data);
      flash(ok ? 'ok' : 'err', ok ? 'Backup written to your folder.' : 'Could not write — re-select the folder to grant permission.');
    } finally {
      setBusy(false);
    }
  };

  const handleForgetFolder = async () => {
    await forgetMirrorFolder();
    setFolderName(null);
    setHasFolder(false);
    flash('ok', 'Local backup folder removed. Your data is still saved in the cloud.');
  };

  const handleDownloadJson = () => {
    downloadJsonBackup(data, `hajara-data-${new Date().toISOString().slice(0, 10)}.json`);
  };

  const handleExportExcel = () => {
    setBusy(true);
    try {
      const sheets: Record<string, unknown[]> = {
        Customers: data.customers.map(c => ({
          ID: c.id, Name: c.name, Phone: c.phone, Address: c.address,
          MedicineCount: c.medicines?.length ?? 0,
        })),
        Products: data.products,
        Sales: data.sales,
        Bills: data.bills.map(b => ({
          ID: b.id, Date: b.date, BillNumber: b.billNumber, Patient: b.patientName,
          Doctor: b.doctorName, SubTotal: b.subTotal, OverallDiscount: b.overallDiscount,
          RoundOff: b.roundOff, GrandTotal: b.grandTotal, Items: b.items.length,
        })),
        BillItems: data.bills.flatMap(b =>
          b.items.map(it => ({
            BillID: b.id, BillNumber: b.billNumber, BillDate: b.date, Patient: b.patientName,
            Sl: it.serialNumber, Product: it.productName, BatchNo: it.batchNo, Expiry: it.expiryDate,
            Quantity: it.quantity, Packaging: it.packaging, MRP: it.mrp, Discount: it.discount, Total: it.total,
          })),
        ),
        Purchases: data.purchases.map(p => ({
          ID: p.id, Date: p.date, InvoiceNo: p.invoiceNo ?? '', Supplier: p.supplierName,
          PaymentMethod: p.paymentMethod, Total: p.total, PaidAmount: p.paidAmount,
          Status: p.paymentStatus, Items: p.items.length,
        })),
        PurchaseItems: data.purchases.flatMap(p =>
          p.items.map(it => ({
            PurchaseID: p.id, PurchaseDate: p.date, Supplier: p.supplierName, Product: it.productName,
            Quantity: it.quantity, Packaging: it.packaging, Rate: it.rate, MRP: it.mrp, Discount: it.discount,
            Amount: it.amount, HSN: it.hsnCode, CGST: it.cgst, SGST: it.sgst, IGST: it.igst,
            BatchNo: it.batchNo, Expiry: it.expiryDate,
          })),
        ),
        Suppliers: data.suppliers,
        Users: data.users.map(u => ({ id: u.id, name: u.name })),
        MoneyTransactions: data.moneyTransactions,
        HistoryLog: data.historyLog,
      };
      const wb = XLSX.utils.book_new();
      for (const [name, rows] of Object.entries(sheets)) {
        const ws = XLSX.utils.json_to_sheet(Array.isArray(rows) ? rows : []);
        XLSX.utils.book_append_sheet(wb, ws, name.slice(0, 31));
      }
      XLSX.writeFile(wb, `hajara-export-${new Date().toISOString().slice(0, 10)}.xlsx`);
      flash('ok', 'Excel workbook downloaded.');
    } catch (err) {
      flash('err', String(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Settings</h2>

      {message && (
        <div className={`mb-4 p-3 rounded-lg text-sm ${
          message.kind === 'ok' ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h3 className="text-lg font-semibold mb-1">Cloud Storage</h3>
        <p className="text-sm text-gray-600">
          Your data is saved to the cloud (Firebase) and syncs to every device in real time.
          This is always on — no setup needed.
        </p>
      </section>

      <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h3 className="text-lg font-semibold mb-3">Local Backup Folder</h3>
        {!supported ? (
          <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded p-3">
            This browser can't write to a local folder. Open the app in <strong>Chrome</strong> or
            <strong> Edge</strong> to enable an automatic local backup file. (Your data is still safe in the cloud.)
          </p>
        ) : (
          <>
            <p className="text-sm text-gray-600 mb-3">
              Keep a live copy of all data in a <code className="bg-slate-100 px-1 rounded">hajara-data.json</code> file
              inside a folder on this computer. It updates automatically whenever data changes.
            </p>
            <div className="bg-slate-50 border border-gray-200 rounded p-3 mb-4 font-mono text-sm break-all">
              {folderName ? `📁 ${folderName}` : hasFolder ? '(folder chosen — permission needs re-granting)' : '(no local backup folder)'}
            </div>
            <div className="flex flex-wrap gap-3">
              <button onClick={handleChangeFolder} disabled={busy}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg disabled:opacity-50">
                {folderName ? 'Change Folder' : 'Choose Folder'}
              </button>
              <button onClick={handleBackupNow} disabled={busy || !hasFolder}
                className="bg-slate-100 hover:bg-slate-200 text-gray-800 font-medium py-2 px-4 rounded-lg border border-gray-300 disabled:opacity-50">
                Back Up Now
              </button>
              {hasFolder && (
                <button onClick={handleForgetFolder} disabled={busy}
                  className="bg-red-50 hover:bg-red-100 text-red-700 font-medium py-2 px-4 rounded-lg border border-red-200 disabled:opacity-50">
                  Remove Folder
                </button>
              )}
            </div>
          </>
        )}
      </section>

      <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h3 className="text-lg font-semibold mb-3">Export &amp; Download</h3>
        <p className="text-sm text-gray-600 mb-4">
          Download a one-time snapshot of all your records. Works in any browser.
        </p>
        <div className="flex flex-wrap gap-3">
          <button onClick={handleExportExcel} disabled={busy}
            className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg disabled:opacity-50">
            {busy ? 'Working…' : 'Export to Excel (.xlsx)'}
          </button>
          <button onClick={handleDownloadJson} disabled={busy}
            className="bg-slate-100 hover:bg-slate-200 text-gray-800 font-medium py-2 px-4 rounded-lg border border-gray-300 disabled:opacity-50">
            Download Backup (.json)
          </button>
        </div>
      </section>

      <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-3">Data Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
          <div><span className="text-gray-500">Customers:</span> <strong>{data.customers.length}</strong></div>
          <div><span className="text-gray-500">Products:</span> <strong>{data.products.length}</strong></div>
          <div><span className="text-gray-500">Suppliers:</span> <strong>{data.suppliers.length}</strong></div>
          <div><span className="text-gray-500">Sales:</span> <strong>{data.sales.length}</strong></div>
          <div><span className="text-gray-500">Bills:</span> <strong>{data.bills.length}</strong></div>
          <div><span className="text-gray-500">Purchases:</span> <strong>{data.purchases.length}</strong></div>
          <div><span className="text-gray-500">Users:</span> <strong>{data.users.length}</strong></div>
          <div><span className="text-gray-500">Money Tx:</span> <strong>{data.moneyTransactions.length}</strong></div>
          <div><span className="text-gray-500">Log Entries:</span> <strong>{data.historyLog.length}</strong></div>
        </div>
      </section>
    </div>
  );
};

export default Settings;
