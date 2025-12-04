import React, { useRef } from 'react';
import Button from './Button';
import { CatalogueEntry } from '../types';

interface CatalogueViewProps {
  entries: CatalogueEntry[];
  onUpdateEntries: (entries: CatalogueEntry[]) => void;
  onEdit: (entry: CatalogueEntry) => void;
  onCreate: () => void;
  onDelete: (id: string) => void;
  onDeleteAll: () => void;
}

const CatalogueView: React.FC<CatalogueViewProps> = ({ entries, onUpdateEntries, onEdit, onCreate, onDelete, onDeleteAll }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text) return;

      const lines = text.split(/\r?\n/);
      // Assume first row is header
      if (lines.length < 2) return;

      const headers = lines[0].split(',').map(h => h.trim());
      
      // Helper to safely get value by header name (case-insensitive)
      const getValue = (rowColumns: string[], headerName: string): string => {
        const index = headers.findIndex(h => h.toLowerCase() === headerName.toLowerCase());
        return index !== -1 && rowColumns[index] ? rowColumns[index].trim() : '';
      };

      const newEntries: CatalogueEntry[] = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Simple CSV split (Note: quoted commas not handled here, keeps it simple for now)
        const columns = line.split(',');

        // Mandatory check: Test Code must exist
        const testCode = getValue(columns, 'TEST CODE');
        if (!testCode) continue;

        const newEntry: CatalogueEntry = {
          id: `imported-${Date.now()}-${i}`,
          testCode: testCode,
          analysis: getValue(columns, 'ANALYSIS') || 'Unknown Analysis',
          component: getValue(columns, 'COMPONENT') || 'Unknown Component',
          units: getValue(columns, 'Unit') || '-',
          category: getValue(columns, 'CATEGORY') || 'General',
          type: getValue(columns, 'TYPE') || 'General',
          defaultGrade: getValue(columns, 'DEFAULT GRADE') || 'Pharma',
          rounding: getValue(columns, 'ROUNDING') || '',
          
          // Fields not in CSV import mapping, set defaults
          synonyms: '',
          priority: 'Medium',
          tags: ''
        };

        newEntries.push(newEntry);
      }

      onUpdateEntries([...entries, ...newEntries]);
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
      alert(`Successfully imported ${newEntries.length} entries.`);
    };

    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
       <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Master Catalogue</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Centralized definitions for analysis and components.</p>
        </div>
        <div className="flex gap-3">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            className="hidden" 
            accept=".csv,.txt" 
          />
          <Button onClick={onDeleteAll} variant="danger">
             Delete All
          </Button>
          <Button onClick={handleImportClick} variant="secondary">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
            Import CSV
          </Button>
          <Button onClick={onCreate} variant="primary">+ New Entry</Button>
        </div>
      </div>

      <div className="overflow-hidden border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg bg-white dark:bg-gray-800">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">Test Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">Analysis</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">Component</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">Unit</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">Default Grade</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">Rounding</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
              {entries.map((entry) => (
                <tr key={entry.id} className="hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-blue-700 dark:text-blue-300">{entry.testCode}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 dark:text-gray-200">{entry.analysis}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{entry.component}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{entry.units}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{entry.category}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{entry.type}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{entry.defaultGrade}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{entry.rounding}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <button onClick={() => onEdit(entry)} className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300">Edit</button>
                    <button onClick={() => onDelete(entry.id)} className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300">Delete</button>
                  </td>
                </tr>
              ))}
              {entries.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-gray-400 dark:text-gray-500">
                    Catalogue is empty. Import a CSV or add entries manually.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CatalogueView;