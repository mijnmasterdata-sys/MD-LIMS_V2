import React from 'react';
import Button from './Button';

interface ImportDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: () => void;
}

const ImportDocumentModal: React.FC<ImportDocumentModalProps> = ({ isOpen, onClose, onImport }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-xl w-full max-w-md p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Import From Document</h2>
        
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Upload PDF Specification
          </label>
          <div className="flex items-center justify-center w-full">
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-600 border-dashed rounded-lg cursor-pointer bg-gray-700/50 hover:bg-gray-700 hover:border-gray-500 transition-colors">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <svg className="w-8 h-8 mb-4 text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                  <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                </svg>
                <p className="mb-2 text-sm text-gray-400"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                <p className="text-xs text-gray-500">PDF (MAX. 10MB)</p>
              </div>
              <input type="file" className="hidden" accept=".pdf" />
            </label>
          </div>
        </div>

        <div className="bg-blue-900/30 border border-blue-800 rounded p-3 mb-6">
          <p className="text-xs text-blue-200">
            <strong>Note:</strong> This is a dummy UI. No actual parsing logic will occur.
          </p>
        </div>

        <div className="flex justify-end space-x-3">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={onImport}>Import Document</Button>
        </div>
      </div>
    </div>
  );
};

export default ImportDocumentModal;