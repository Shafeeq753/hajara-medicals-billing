import React from 'react';
import { LogEntry } from '../types';

interface HistoryLogProps {
  logs: LogEntry[];
}

const HistoryLog: React.FC<HistoryLogProps> = ({ logs }) => {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-900">History Log</h2>
      <div className="bg-white p-2 md:p-6 rounded-xl shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left responsive-table">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="p-3 font-medium text-gray-800">Timestamp</th>
                <th className="p-3 font-medium text-gray-800">User</th>
                <th className="p-3 font-medium text-gray-800">Action</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id}>
                  <td data-label="Timestamp" className="text-gray-700">{new Date(log.timestamp).toLocaleString()}</td>
                  <td data-label="User" className="font-semibold text-gray-900">{log.userName}</td>
                  <td data-label="Action" className="text-gray-900">{log.action}</td>
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