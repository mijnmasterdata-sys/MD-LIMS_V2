import React from 'react';
import Button from './Button';

interface ExportToolModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ExportToolModal: React.FC<ExportToolModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const handleExport = () => {
    // Dummy export
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-xl w-full max-w-sm p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Export to Excel</h2>
        
        <p className="text-sm text-gray-400 mb-4">Select tables to include in the XLSX export:</p>
        
        <div className="space-y-3 mb-6 bg-gray-900/50 p-4 rounded border border-gray-700">
          <label className="flex items-center space-x-3 cursor-pointer">
            <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-600 rounded focus:ring-blue-500 focus:ring-2" />
            <span className="text-gray-200 text-sm">PRODUCT</span>
          </label>
          <label className="flex items-center space-x-3 cursor-pointer">
            <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-600 rounded focus:ring-blue-500 focus:ring-2" />
            <span className="text-gray-200 text-sm">PRODUCT_GRADE</span>
          </label>
          <label className="flex items-center space-x-3 cursor-pointer">
            <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-600 rounded focus:ring-blue-500 focus:ring-2" />
            <span className="text-gray-200 text-sm">PRODUCT_GRADE_STAGE</span>
          </label>
          <label className="flex items-center space-x-3 cursor-pointer">
            <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-600 rounded focus:ring-blue-500 focus:ring-2" />
            <span className="text-gray-200 text-sm">PRODUCT_SPEC</span>
          </label>
        </div>

        <div className="flex justify-end space-x-3">
          <Button variant="secondary" onClick={onClose}>Close</Button>
          <Button variant="primary" onClick={handleExport}>Export XLSX</Button>
        </div>
      </div>
    </div>
  );
};

export default ExportToolModal;