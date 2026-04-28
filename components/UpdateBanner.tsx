import React, { useEffect, useState } from 'react';
import { electron, isElectron, UpdaterStatus } from '../lib/storage';

const UpdateBanner: React.FC = () => {
  const [status, setStatus] = useState<UpdaterStatus | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!isElectron()) return;
    return electron().onUpdaterStatus(s => setStatus(s));
  }, []);

  if (!status) return null;
  if (dismissed && status.state !== 'ready') return null;

  if (status.state === 'available') {
    return (
      <Pill color="blue">
        <span>Update available{status.version ? ` (v${status.version})` : ''} — downloading…</span>
      </Pill>
    );
  }

  if (status.state === 'downloading') {
    const pct = Math.round(status.percent ?? 0);
    return (
      <Pill color="blue">
        <span>Downloading update… {pct}%</span>
      </Pill>
    );
  }

  if (status.state === 'ready') {
    return (
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-white border border-blue-300 shadow-2xl rounded-xl p-4 flex items-center gap-4 max-w-md">
        <div className="flex-1">
          <p className="font-semibold text-gray-900">Update ready</p>
          <p className="text-sm text-gray-600">
            Version {status.version ?? 'newer'} is downloaded. Restart now to apply it.
          </p>
        </div>
        <button
          onClick={() => electron().installUpdateNow()}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg shrink-0"
        >
          Restart
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="text-gray-500 hover:text-gray-700 text-sm"
          title="Later"
        >
          Later
        </button>
      </div>
    );
  }

  return null;
};

const Pill: React.FC<{ color: 'blue' | 'red'; children: React.ReactNode }> = ({ color, children }) => {
  const cls = color === 'blue'
    ? 'bg-blue-50 border-blue-200 text-blue-800'
    : 'bg-red-50 border-red-200 text-red-800';
  return (
    <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 ${cls} border rounded-full shadow-lg px-4 py-2 text-sm font-medium`}>
      {children}
    </div>
  );
};

export default UpdateBanner;
