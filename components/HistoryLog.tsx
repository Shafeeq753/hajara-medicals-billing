
import React, { useState, useMemo } from 'react';
import { LogEntry } from '../types';

interface HistoryLogProps {
  logs: LogEntry[];
}

const HistoryLog = ({ logs }: HistoryLogProps) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredLogs = useMemo(() => {
        return logs.filter(l => 
            l.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            l.action.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [logs, searchTerm]);

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-black">History Log</h2>
      <div className="bg-white p-2 md:p-6 rounded-xl shadow-lg">
        <div>
          <input
            type="text"
            placeholder="Search logs..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full max-w-sm p-2 bg-white border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 mb-4"
          />
        </div>
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
              {filteredLogs.map(log => (
                <tr key={log.id} className="bg-white border-b hover:bg-gray-50">
                  <td data-label="Timestamp" className="px-6 py-4">{new Date(log.timestamp).toLocaleString()}</td>
                  <td data-label="User" className="px-6 py-4 font-medium text-black whitespace-nowrap">{log.userName}</td>
                  <td data-label="Action" className="px-6 py-4">{log.action}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredLogs.length === 0 && <p className="text-center text-black py-4">No logs found.</p>}
        </div>
      </div>
    </div>
  );
};

export default HistoryLog;
