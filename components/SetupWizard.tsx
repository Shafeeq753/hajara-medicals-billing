import React, { useState } from 'react';
import { electron } from '../lib/storage';

interface Props {
  onComplete: (chosenPath: string) => void;
}

const SetupWizard: React.FC<Props> = ({ onComplete }) => {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const pickFolder = async () => {
    setError(null);
    setBusy(true);
    try {
      const chosen = await electron().pickStoragePath();
      if (chosen) {
        onComplete(chosen);
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-blue-100 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-xl max-w-xl w-full p-8 md:p-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-7l-2-2H5a2 2 0 00-2 2z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to Hajara Medicals</h1>
          <p className="text-gray-600">Billing &amp; Inventory Manager</p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-5 mb-6">
          <h2 className="font-semibold text-gray-900 mb-2">First-time setup</h2>
          <p className="text-sm text-gray-700 leading-relaxed">
            Choose a folder on your computer where the app will save all your data
            (customers, sales, purchases, bills, etc.).
          </p>
          <ul className="text-sm text-gray-700 mt-3 space-y-1 list-disc list-inside">
            <li>The app stores everything in a single file: <code className="bg-white px-1 rounded">hajara-data.json</code></li>
            <li>You can change this folder later from the app's Settings.</li>
            <li>Tip: pick a folder you back up regularly (e.g. <em>Documents</em> or a synced cloud folder).</li>
          </ul>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-4 text-sm">
            {error}
          </div>
        )}

        <button
          onClick={pickFolder}
          disabled={busy}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {busy ? 'Opening folder picker…' : 'Choose Storage Folder'}
        </button>

        <p className="text-xs text-gray-500 text-center mt-6">
          Default login after setup: <strong>thalif</strong> / <strong>thalif</strong> &nbsp;·&nbsp;
          you can add more users from the Users page.
        </p>
      </div>
    </div>
  );
};

export default SetupWizard;
