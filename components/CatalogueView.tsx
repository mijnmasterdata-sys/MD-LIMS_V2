import React, { useRef } from 'react';
import Button from './Button';
import { CatalogueEntry } from '../types';

interface CatalogueViewProps {
  entries: CatalogueEntry[];
  onUpdateEntries: (entries: CatalogueEntry[]) => void;
  onEdit: (entry: CatalogueEntry) => void;
  onCreate: () => void;
  onDelete: (id: string) => void;
}

const CatalogueView: React.FC<CatalogueViewProps> = ({ entries, onUpdateEntries, onEdit, onCreate, onDelete }) => {
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
      
      // Helper to safely get value by header name
      const getValue = (rowColumns: string[], headerName: string): string => {
        const index = headers.findIndex(h => h.toLowerCase() === headerName.toLowerCase());
        return index !== -1 && rowColumns[index] ? rowColumns[index].trim() : '';
      };

      const newEntries: CatalogueEntry[] = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Simple CSV split (note: doesn't handle quoted commas, but sufficient for this req)
        const columns = line.split(',');

        const testCode = getValue(columns, 'Test Code');
        if (!testCode) continue; // Skip empty rows

        const newEntry: CatalogueEntry = {
          id: `imported-${Date.now()}-${i}`,
          testCode: testCode,
          analysis: getValue(columns, 'Analysis') || 'Unknown Analysis',
          component: getValue(columns, 'Component') || 'Unknown Component',
          category: getValue(columns, 'Category') || 'General',
          synonyms: getValue(columns, 'Synonyms') || '',
          priority: (getValue(columns, 'Priority') as 'High' | 'Medium' | 'Low') || 'Medium',
          
          // Defaults for fields not in this specific CSV view
          units: '-',
          type: 'General',
          defaultGrade: 'Pharma',
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
          <h2 className="text-2xl font-bold text-white">Master Catalogue</h2>
          <p className="text-gray-400 text-sm">Centralized definitions for analysis and components.</p>
        </div>
        <div className="flex gap-3">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            className="hidden" 
            accept=".csv,.txt" 
          />
          <Button onClick={handleImportClick} variant="secondary">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
            Import CSV
          </Button>
          <Button onClick={onCreate} variant="primary">+ New Entry</Button>
        </div>
      </div>

      <div className="overflow-hidden border border-gray-700 rounded-lg shadow-lg bg-gray-800">
        <table className="min-w-full divide-y divide-gray-700">
          <thead className="bg-gray-900/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Test Code</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Analysis</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Component</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Synonyms</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Priority</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700 bg-gray-800">
            {entries.map((entry) => (
              <tr key={entry.id} className="hover:bg-gray-750 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-blue-300">{entry.testCode}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">{entry.analysis}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{entry.component}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{entry.category}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400 max-w-[200px] truncate" title={entry.synonyms}>{entry.synonyms || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                   <span className={`px-2 py-0.5 rounded text-xs font-medium 
                     ${entry.priority === 'High' ? 'bg-red-900/50 text-red-300' : 
                       entry.priority === 'Medium' ? 'bg-yellow-900/50 text-yellow-300' : 'bg-gray-700 text-gray-300'}`}>
                     {entry.priority}
                   </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                  <button onClick={() => onEdit(entry)} className="text-blue-400 hover:text-blue-300">Edit</button>
                  <button onClick={() => onDelete(entry.id)} className="text-red-400 hover:text-red-300">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CatalogueView;