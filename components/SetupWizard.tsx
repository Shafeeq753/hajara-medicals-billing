import React, { useState } from 'react';
import { pickMirrorFolder, isFsAccessSupported } from '../lib/localMirror';

interface Props {
  onComplete: () => void;
}

const SetupWizard: React.FC<Props> = ({ onComplete }) => {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const supported = isFsAccessSupported();

  const pickFolder = async () => {
    setError(null);
    setBusy(true);
    try {
      const chosen = await pickMirrorFolder();
      if (chosen) onComplete();
    } catch (err) {
      setError(String(err instanceof Error ? err.message : err));
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
          <h2 className="font-semibold text-gray-900 mb-2">How your data is saved</h2>
          <ul className="text-sm text-gray-700 mt-1 space-y-1 list-disc list-inside">
            <li>Everything is stored securely in the <strong>cloud (Firebase)</strong> and syncs to every device automatically.</li>
            <li>Optionally, keep a <strong>local backup file</strong> (<code className="bg-white px-1 rounded">hajara-data.json</code>) in a folder on this computer.</li>
            <li>You can set or change the backup folder anytime from <strong>Settings</strong>.</li>
          </ul>
        </div>

        {!supported && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-lg p-3 mb-4 text-sm">
            This browser can't write to a local folder. Your data is still safely saved to the cloud.
            For a local backup folder, open this app in <strong>Google Chrome</strong> or <strong>Microsoft Edge</strong>.
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-4 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-3">
          {supported && (
            <button
              onClick={pickFolder}
              disabled={busy}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {busy ? 'Opening folder picker…' : 'Choose Local Backup Folder'}
            </button>
          )}
          <button
            onClick={onComplete}
            disabled={busy}
            className="w-full bg-slate-100 hover:bg-slate-200 text-gray-800 font-semibold py-3 px-6 rounded-lg border border-gray-300 transition disabled:opacity-50"
          >
            {supported ? 'Skip for now (cloud only)' : 'Continue'}
          </button>
        </div>

        <p className="text-xs text-gray-500 text-center mt-6">
          Default login: <strong>thalif</strong> / <strong>thalif</strong> &nbsp;·&nbsp;
          you can add more users from the Users page.
        </p>
      </div>
    </div>
  );
};

export default SetupWizard;
