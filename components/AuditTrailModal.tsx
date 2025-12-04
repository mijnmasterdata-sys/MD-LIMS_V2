import React from 'react';
import Button from './Button';
import { AuditLog } from '../types';
import { DUMMY_AUDIT_LOGS } from '../constants';

interface AuditTrailModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AuditTrailModal: React.FC<AuditTrailModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl w-full max-w-4xl p-6 h-[80vh] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">System Audit Trail</h2>
          <Button variant="secondary" size="sm" onClick={onClose}>Close</Button>
        </div>
        
        <div className="flex-1 overflow-auto border border-gray-200 dark:border-gray-700 rounded bg-gray-50 dark:bg-gray-900">
          <table className="w-full text-left text-sm text-gray-700 dark:text-gray-300">
            <thead className="bg-gray-100 dark:bg-gray-800 text-xs uppercase font-medium text-gray-500 dark:text-gray-400 sticky top-0">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {DUMMY_AUDIT_LOGS.map((log) => (
                <tr key={log.id} className="hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-4 py-2 font-mono text-xs">{log.timestamp}</td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                      log.action === 'CREATE' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' :
                      log.action === 'UPDATE' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300' :
                      log.action === 'DELETE' ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300' :
                      'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                    }`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-2">{log.user}</td>
                  <td className="px-4 py-2">{log.details}</td>
                </tr>
              ))}
              {/* Dummy filler rows to show scroll */}
              {Array.from({ length: 5 }).map((_, i) => (
                <tr key={`filler-${i}`} className="hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors opacity-50">
                  <td className="px-4 py-2 font-mono text-xs">2023-10-24 08:00:0{i}</td>
                  <td className="px-4 py-2"><span className="px-2 py-0.5 rounded text-xs font-semibold bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-300">LOGIN</span></td>
                  <td className="px-4 py-2">system</td>
                  <td className="px-4 py-2">System health check passed</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="mt-4 flex justify-end">
             <Button variant="secondary" onClick={onClose}>Done</Button>
        </div>
      </div>
    </div>
  );
};

export default AuditTrailModal;