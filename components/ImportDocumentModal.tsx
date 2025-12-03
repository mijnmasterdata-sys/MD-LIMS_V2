import React, { useState } from 'react';
import Button from './Button';
import { CatalogueEntry, ProductSpec, ParsingTemplate } from '../types';
import { parseSpecDocument } from '../services/geminiService';

interface ImportDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (spec: ProductSpec) => void;
  catalogue: CatalogueEntry[];
  templates: ParsingTemplate[];
}

const ImportDocumentModal: React.FC<ImportDocumentModalProps> = ({ isOpen, onClose, onImport, catalogue, templates }) => {
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState<string>("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setText(""); // Clear text if file selected
    }
  };

  const handleParse = async () => {
    if (!file && !text) {
      setError("Please provide a file or paste text content.");
      return;
    }

    setIsParsing(true);
    setError(null);

    // Find selected template instruction
    const template = templates.find(t => t.id === selectedTemplateId);
    const customInstruction = template ? template.customInstruction : undefined;

    try {
      let result: ProductSpec | null = null;

      if (file) {
        // Convert to Base64
        const reader = new FileReader();
        reader.onload = async () => {
          const base64String = (reader.result as string).split(',')[1]; // Strip data url prefix
          result = await parseSpecDocument({ 
            type: 'file', 
            data: base64String, 
            mimeType: 'application/pdf' 
          }, catalogue, customInstruction);
          finalize(result);
        };
        reader.readAsDataURL(file);
      } else {
        result = await parseSpecDocument({ type: 'text', data: text }, catalogue, customInstruction);
        finalize(result);
      }
    } catch (err) {
      console.error(err);
      setError("An error occurred during parsing.");
      setIsParsing(false);
    }
  };

  const finalize = (result: ProductSpec | null) => {
    setIsParsing(false);
    if (result) {
      onImport(result);
      onClose();
      // Reset
      setFile(null);
      setText("");
      setSelectedTemplateId("");
    } else {
      setError("Could not extract specification structure from the input.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-xl w-full max-w-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Import Specification</h2>
        
        {error && (
          <div className="mb-4 p-3 bg-red-900/30 border border-red-800 rounded text-red-200 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-6">
          
          {/* Template Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Parsing Template (Optional)</label>
            <select 
              className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white text-sm focus:border-blue-500 focus:outline-none"
              value={selectedTemplateId}
              onChange={(e) => setSelectedTemplateId(e.target.value)}
            >
              <option value="">-- Auto-Detect (Generic) --</option>
              {templates.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">Select a pre-defined layout to improve extraction accuracy.</p>
          </div>

          <div className="h-px bg-gray-700 w-full"></div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Upload Document (PDF)
            </label>
            <div className={`flex items-center justify-center w-full ${text ? 'opacity-50 pointer-events-none' : ''}`}>
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-600 border-dashed rounded-lg cursor-pointer bg-gray-700/50 hover:bg-gray-700 hover:border-gray-500 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  {file ? (
                     <div className="text-center">
                        <svg className="w-8 h-8 mb-2 mx-auto text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        <p className="text-sm text-gray-200">{file.name}</p>
                     </div>
                  ) : (
                    <>
                      <svg className="w-8 h-8 mb-4 text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                      </svg>
                      <p className="mb-2 text-sm text-gray-400"><span className="font-semibold">Click to upload</span></p>
                    </>
                  )}
                </div>
                <input type="file" className="hidden" accept=".pdf" onChange={handleFileChange} />
              </label>
            </div>
          </div>

          <div className="flex items-center text-gray-500 text-xs uppercase font-bold tracking-wider">
             <span className="flex-1 border-t border-gray-700"></span>
             <span className="mx-3">OR</span>
             <span className="flex-1 border-t border-gray-700"></span>
          </div>

          {/* Text Area */}
          <div>
             <label className="block text-sm font-medium text-gray-400 mb-2">
               Paste Text / CSV
             </label>
             <textarea 
               rows={4} 
               className={`w-full bg-gray-900 border border-gray-600 rounded p-3 text-white text-sm focus:border-blue-500 focus:outline-none ${file ? 'opacity-50 pointer-events-none' : ''}`}
               placeholder="Paste content here..."
               value={text}
               onChange={(e) => setText(e.target.value)}
             />
          </div>
        </div>

        <div className="mt-6 flex justify-end space-x-3">
          <Button variant="secondary" onClick={onClose} disabled={isParsing}>Cancel</Button>
          <Button variant="primary" onClick={handleParse} disabled={isParsing}>
            {isParsing ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </span>
            ) : "Analyze & Import"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ImportDocumentModal;