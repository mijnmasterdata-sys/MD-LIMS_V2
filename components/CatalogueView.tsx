import React from 'react';
import Button from './Button';
import { CatalogueEntry } from '../types';
import { DUMMY_CATALOGUE } from '../constants';

interface CatalogueViewProps {
  onEdit: (entry: CatalogueEntry) => void;
  onCreate: () => void;
}

const CatalogueView: React.FC<CatalogueViewProps> = ({ onEdit, onCreate }) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
       <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Master Catalogue</h2>
          <p className="text-gray-400 text-sm">Centralized definitions for analysis and components.</p>
        </div>
        <Button onClick={onCreate} variant="primary">+ New Entry</Button>
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
            {DUMMY_CATALOGUE.map((entry) => (
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
                  <button className="text-red-400 hover:text-red-300">Delete</button>
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