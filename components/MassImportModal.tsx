import React, { useState } from 'react';
import Button from './Button';
import { CatalogueEntry, Product, ProductSpec, ParsingTemplate } from '../types';
import { parseSpecDocument } from '../services/geminiService';

interface MassImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (products: Product[]) => void;
  catalogue: CatalogueEntry[];
  templates: ParsingTemplate[];
}

interface LogEntry {
  file: string;
  status: 'success' | 'error' | 'processing';
  message: string;
}

const MassImportModal: React.FC<MassImportModalProps> = ({ isOpen, onClose, onSave, catalogue, templates }) => {
  const [files, setFiles] = useState<File[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [isParsing, setIsParsing] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [progress, setProgress] = useState({ total: 0, current: 0 });

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = error => reject(error);
      reader.readAsDataURL(file);
    });
  };

  const handleParse = async () => {
    if (files.length === 0) {
      alert("Please select at least one PDF file.");
      return;
    }

    setIsParsing(true);
    setLogs([]);
    setProgress({ total: files.length, current: 0 });

    const template = templates.find(t => t.id === selectedTemplateId);
    const customInstruction = template ? template.customInstruction : undefined;
    
    const successfulProducts: Product[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setProgress({ total: files.length, current: i + 1 });
      setLogs(prev => [...prev, { file: file.name, status: 'processing', message: 'Starting...' }]);
      
      // Allow UI to update
      await new Promise(res => setTimeout(res, 50)); 

      try {
        const base64String = await fileToBase64(file);
        const result = await parseSpecDocument({ 
          type: 'file', 
          data: base64String, 
          mimeType: 'application/pdf' 
        }, catalogue, customInstruction);
        
        if (result) {
          const newProduct: Product = {
            id: `prod-${Date.now()}-${i}`,
            productCode: result.productCode,
            productName: result.productName,
            version: result.version,
            materialType: result.materialType,
            effectiveDate: result.effectiveDate,
            packDescription: result.packDescription,
            tests: result.tests
          };
          successfulProducts.push(newProduct);
          setLogs(prev => prev.map(l => l.file === file.name ? { ...l, status: 'success', message: `Success - Product Code: ${result.productCode}` } : l));
        } else {
          throw new Error("Could not extract a valid specification structure.");
        }

      } catch (err: any) {
        setLogs(prev => prev.map(l => l.file === file.name ? { ...l, status: 'error', message: err.message || 'Unknown parsing error' } : l));
      }
    }
    
    if (successfulProducts.length > 0) {
      onSave(successfulProducts);
    }

    setIsParsing(false);
  };

  const handleClose = () => {
    // Reset state on close
    setFiles([]);
    setSelectedTemplateId("");
    setIsParsing(false);
    setLogs([]);
    setProgress({ total: 0, current: 0 });
    onClose();
  };
  
  const getLogIcon = (status: LogEntry['status']) => {
    switch(status) {
      case 'success': return <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>;
      case 'error': return <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>;
      case 'processing': return <svg className="animate-spin h-4 w-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>;
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl w-full max-w-2xl p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Mass Import Products</h2>
        
        {!isParsing && logs.length === 0 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Parsing Template (Optional)</label>
              <select 
                className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-gray-900 dark:text-white text-sm focus:border-blue-500 focus:outline-none"
                value={selectedTemplateId}
                onChange={(e) => setSelectedTemplateId(e.target.value)}
              >
                <option value="">-- Auto-Detect (Generic) --</option>
                {templates.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Upload Documents (PDF)</label>
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-lg cursor-pointer bg-gray-100 dark:bg-gray-700/50 hover:bg-gray-200 dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    {files.length > 0 ? (
                       <div className="text-center">
                          <svg className="w-8 h-8 mb-2 mx-auto text-blue-500 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                          <p className="text-sm text-gray-600 dark:text-gray-200">{files.length} file(s) selected</p>
                       </div>
                    ) : (
                      <>
                        <svg className="w-8 h-8 mb-4 text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                           <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                        </svg>
                        <p className="mb-2 text-sm text-gray-500 dark:text-gray-400"><span className="font-semibold">Click to upload or drag & drop</span></p>
                      </>
                    )}
                  </div>
                  <input type="file" className="hidden" accept=".pdf" multiple onChange={handleFileChange} />
                </label>
              </div>
            </div>
          </div>
        )}

        {(isParsing || logs.length > 0) && (
          <div>
            <div className="mb-2">
              <div className="flex justify-between mb-1">
                <span className="text-base font-medium text-blue-700 dark:text-blue-300">
                  {isParsing ? `Processing ${progress.current} of ${progress.total}...` : 'Import Complete'}
                </span>
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                   {Math.round((progress.current / progress.total) * 100) || 0}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                <div className="bg-blue-600 h-2.5 rounded-full" style={{width: `${(progress.current / progress.total) * 100}%`}}></div>
              </div>
            </div>
            <div className="mt-4 h-64 overflow-y-auto bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded p-2 text-xs font-mono">
               {logs.map((log, index) => (
                 <div key={index} className="flex items-start gap-2 p-1 border-b border-gray-200/50 dark:border-gray-700/50">
                   <div className="mt-0.5">{getLogIcon(log.status)}</div>
                   <div>
                     <span className="font-bold text-gray-800 dark:text-gray-200">{log.file}: </span>
                     <span className={`${log.status === 'error' ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'}`}>{log.message}</span>
                   </div>
                 </div>
               ))}
               {!isParsing && logs.length > 0 && (
                  <div className="p-2 text-center text-sm font-sans mt-2">
                     <p className="font-bold text-green-600 dark:text-green-400">
                       Finished: {logs.filter(l => l.status === 'success').length} successful, {logs.filter(l => l.status === 'error').length} failed.
                     </p>
                  </div>
               )}
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-end space-x-3">
          <Button variant="secondary" onClick={handleClose} disabled={isParsing}>
             {isParsing ? 'Cancel' : (logs.length > 0 ? 'Done' : 'Cancel')}
          </Button>
          <Button variant="primary" onClick={handleParse} disabled={isParsing || files.length === 0 || logs.length > 0}>
            {isParsing ? "Importing..." : "Start Import"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MassImportModal;
