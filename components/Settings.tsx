import React, { useEffect, useState } from 'react';
import { electron, AppData } from '../lib/storage';

interface Props {
  data: AppData;
  onStoragePathChanged: (newPath: string) => void;
}

const Settings: React.FC<Props> = ({ data, onStoragePathChanged }) => {
  const [storagePath, setStoragePath] = useState<string | null>(null);
  const [appVersion, setAppVersion] = useState<string>('');
  const [updateInfo, setUpdateInfo] = useState<string>('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    electron().getStoragePath().then(setStoragePath);
    electron().getAppVersion().then(setAppVersion).catch(() => {});
  }, []);

  const handleCheckUpdate = async () => {
    setUpdateInfo('Checking…');
    try {
      const r = await electron().checkForUpdates();
      if (r.state === 'dev') setUpdateInfo('Dev mode — updates disabled.');
      else if (r.state === 'error') setUpdateInfo(`Error: ${r.message}`);
      else if (r.state === 'checked') setUpdateInfo(r.version ? `Latest version: ${r.version}` : 'You are up to date.');
      else setUpdateInfo('');
    } catch (err) {
      setUpdateInfo(`Error: ${String(err)}`);
    }
  };

  const flash = (kind: 'ok' | 'err', text: string) => {
    setMessage({ kind, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const handleChangeFolder = async () => {
    setBusy(true);
    try {
      const chosen = await electron().pickStoragePath();
      if (chosen) {
        setStoragePath(chosen);
        onStoragePathChanged(chosen);
        flash('ok', `Storage location changed to: ${chosen}`);
      }
    } catch (err) {
      flash('err', String(err));
    } finally {
      setBusy(false);
    }
  };

  const handleExport = async () => {
    setBusy(true);
    try {
      const sheets = {
        Customers: data.customers.map(c => ({
          ID: c.id,
          Name: c.name,
          Phone: c.phone,
          Address: c.address,
          MedicineCount: c.medicines?.length ?? 0,
        })),
        Products: data.products,
        Sales: data.sales,
        Bills: data.bills.map(b => ({
          ID: b.id,
          Date: b.date,
          BillNumber: b.billNumber,
          Patient: b.patientName,
          Doctor: b.doctorName,
          SubTotal: b.subTotal,
          OverallDiscount: b.overallDiscount,
          RoundOff: b.roundOff,
          GrandTotal: b.grandTotal,
          Items: b.items.length,
        })),
        BillItems: data.bills.flatMap(b =>
          b.items.map(it => ({
            BillID: b.id,
            BillNumber: b.billNumber,
            BillDate: b.date,
            Patient: b.patientName,
            Sl: it.serialNumber,
            Product: it.productName,
            BatchNo: it.batchNo,
            Expiry: it.expiryDate,
            Quantity: it.quantity,
            Packaging: it.packaging,
            MRP: it.mrp,
            Discount: it.discount,
            Total: it.total,
          })),
        ),
        Purchases: data.purchases.map(p => ({
          ID: p.id,
          Date: p.date,
          InvoiceNo: p.invoiceNo ?? '',
          Supplier: p.supplierName,
          PaymentMethod: p.paymentMethod,
          Total: p.total,
          PaidAmount: p.paidAmount,
          Status: p.paymentStatus,
          Items: p.items.length,
        })),
        PurchaseItems: data.purchases.flatMap(p =>
          p.items.map(it => ({
            PurchaseID: p.id,
            PurchaseDate: p.date,
            Supplier: p.supplierName,
            Product: it.productName,
            Quantity: it.quantity,
            Packaging: it.packaging,
            Rate: it.rate,
            MRP: it.mrp,
            Discount: it.discount,
            Amount: it.amount,
            HSN: it.hsnCode,
            CGST: it.cgst,
            SGST: it.sgst,
            IGST: it.igst,
            BatchNo: it.batchNo,
            Expiry: it.expiryDate,
          })),
        ),
        Suppliers: data.suppliers,
        Users: data.users.map(u => ({ id: u.id, name: u.name })),
        MoneyTransactions: data.moneyTransactions,
        HistoryLog: data.historyLog,
      };
      const path = await electron().exportExcel(sheets);
      if (path) flash('ok', `Exported to: ${path}`);
    } catch (err) {
      flash('err', String(err));
    } finally {
      setBusy(false);
    }
  };

  const handleOpenFolder = async () => {
    try {
      await electron().openStorageFolder();
    } catch (err) {
      flash('err', String(err));
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
        <h3 className="text-lg font-semibold mb-3">Data Storage Location</h3>
        <p className="text-sm text-gray-600 mb-3">
          All your data (customers, sales, purchases, bills, etc.) is saved to a single file in this folder.
          You can change the folder at any time — your existing data will be copied to the new location.
        </p>
        <div className="bg-slate-50 border border-gray-200 rounded p-3 mb-4 font-mono text-sm break-all">
          {storagePath || '(not set)'}
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleChangeFolder}
            disabled={busy}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg disabled:opacity-50"
          >
            Change Folder
          </button>
          <button
            onClick={handleOpenFolder}
            disabled={busy || !storagePath}
            className="bg-slate-100 hover:bg-slate-200 text-gray-800 font-medium py-2 px-4 rounded-lg border border-gray-300 disabled:opacity-50"
          >
            Open in File Explorer
          </button>
        </div>
      </section>

      <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h3 className="text-lg font-semibold mb-3">Export Data to Excel</h3>
        <p className="text-sm text-gray-600 mb-4">
          Save all your records to an Excel workbook (.xlsx). Each entity gets its own sheet so
          you can review everything in one file.
        </p>
        <button
          onClick={handleExport}
          disabled={busy}
          className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg disabled:opacity-50"
        >
          {busy ? 'Working…' : 'Export All Data to Excel'}
        </button>
      </section>

      <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h3 className="text-lg font-semibold mb-3">App Version &amp; Updates</h3>
        <p className="text-sm text-gray-600 mb-3">
          Current version: <strong>{appVersion || '…'}</strong>. Updates are checked automatically when
          the app starts (an internet connection is required). When a new version is downloaded, you'll
          see a "Restart to update" prompt.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleCheckUpdate}
            disabled={busy}
            className="bg-slate-100 hover:bg-slate-200 text-gray-800 font-medium py-2 px-4 rounded-lg border border-gray-300 disabled:opacity-50"
          >
            Check for Updates
          </button>
          {updateInfo && <span className="text-sm text-gray-700">{updateInfo}</span>}
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
