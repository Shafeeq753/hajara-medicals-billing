import React from 'react';
import { LogEntry } from '../types';

interface HistoryLogProps {
  logs: LogEntry[];
}

const HistoryLog = ({ logs }: HistoryLogProps) => {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-black">History Log</h2>
      <div className="bg-white p-2 md:p-6 rounded-xl shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left responsive-table">
            <thead className="text-xs text-black uppercase bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3">Timestamp</th>
                <th scope="col" className="px-6 py-3">User</th>
                <th scope="col" className="px-6 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id} className="bg-white border-b hover:bg-gray-50">
                  <td data-label="Timestamp" className="px-6 py-4">{new Date(log.timestamp).toLocaleString()}</td>
                  <td data-label="User" className="px-6 py-4 font-medium text-black whitespace-nowrap">{log.userName}</td>
                  <td data-label="Action" className="px-6 py-4">{log.action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default HistoryLog;