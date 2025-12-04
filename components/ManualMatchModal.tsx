import React from 'react';
import Button from './Button';

interface ManualMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const ManualMatchModal: React.FC<ManualMatchModalProps> = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl w-full max-w-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Manual Match Required</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
          Could not automatically match test <span className="text-yellow-600 dark:text-yellow-400 font-mono">"Unknown - Test 123"</span> from the document.
        </p>

        <div className="space-y-4 mb-8">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Select Analysis</label>
            <select className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none">
              <option value="">-- Select Analysis --</option>
              <option value="Appearance">Appearance</option>
              <option value="pH">pH</option>
              <option value="Assay">Assay</option>
              <option value="Density">Density</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Select Component</label>
            <select className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none">
              <option value="">-- Select Component --</option>
              <option value="Appearance">Appearance</option>
              <option value="pH Value">pH Value</option>
              <option value="Concentration">Concentration</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={onConfirm}>Confirm Match</Button>
        </div>
      </div>
    </div>
  );
};

export default ManualMatchModal;