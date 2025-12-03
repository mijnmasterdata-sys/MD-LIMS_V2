import React from 'react';
import Button from './Button';
import { CatalogueEntry } from '../types';
import { CATEGORIES } from '../constants';

interface CatalogueEntryFormProps {
  entry?: CatalogueEntry;
  onSave: () => void;
  onCancel: () => void;
}

const CatalogueEntryForm: React.FC<CatalogueEntryFormProps> = ({ entry, onSave, onCancel }) => {
  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in slide-in-from-bottom-4 duration-300 bg-gray-800 p-8 rounded-lg border border-gray-700 shadow-xl mt-10">
      <h2 className="text-2xl font-bold text-white mb-6">
        {entry ? `Edit Catalogue Entry: ${entry.testCode}` : 'New Catalogue Entry'}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Info */}
        <div className="col-span-1">
          <label className="block text-sm font-medium text-gray-400 mb-1">Test Code</label>
          <input type="text" defaultValue={entry?.testCode} className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white focus:border-blue-500 focus:outline-none font-mono" />
        </div>
        
        <div className="col-span-1">
          <label className="block text-sm font-medium text-gray-400 mb-1">Category</label>
           <select defaultValue={entry?.category} className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white focus:border-blue-500 focus:outline-none">
             {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
           </select>
        </div>

        <div className="col-span-1">
          <label className="block text-sm font-medium text-gray-400 mb-1">Analysis Name</label>
          <input type="text" defaultValue={entry?.analysis} className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white focus:border-blue-500 focus:outline-none" />
        </div>

        <div className="col-span-1">
          <label className="block text-sm font-medium text-gray-400 mb-1">Component Name</label>
          <input type="text" defaultValue={entry?.component} className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white focus:border-blue-500 focus:outline-none" />
        </div>

        <div className="col-span-1">
          <label className="block text-sm font-medium text-gray-400 mb-1">Units</label>
          <input type="text" defaultValue={entry?.units} className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white focus:border-blue-500 focus:outline-none" />
        </div>

        <div className="col-span-1">
          <label className="block text-sm font-medium text-gray-400 mb-1">Method Type</label>
          <input type="text" defaultValue={entry?.type} className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white focus:border-blue-500 focus:outline-none" />
        </div>
        
         <div className="col-span-1">
          <label className="block text-sm font-medium text-gray-400 mb-1">Default Grade</label>
          <input type="text" defaultValue={entry?.defaultGrade} className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white focus:border-blue-500 focus:outline-none" />
        </div>

        <div className="col-span-1">
          <label className="block text-sm font-medium text-gray-400 mb-1">Priority</label>
          <select defaultValue={entry?.priority || 'Medium'} className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white focus:border-blue-500 focus:outline-none">
             <option value="High">High</option>
             <option value="Medium">Medium</option>
             <option value="Low">Low</option>
           </select>
        </div>

        {/* Advanced Matching Fields */}
        <div className="col-span-2 pt-4 border-t border-gray-700">
           <h3 className="text-sm font-semibold text-blue-400 mb-4">Matching Intelligence</h3>
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-400 mb-1">Synonyms (Comma separated)</label>
          <textarea defaultValue={entry?.synonyms} rows={2} className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white focus:border-blue-500 focus:outline-none" placeholder="e.g. Appearance, Visual, Clarity..." />
          <p className="text-xs text-gray-500 mt-1">Used by the matching engine to identify this test in documents.</p>
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-400 mb-1">Tags</label>
          <input type="text" defaultValue={entry?.tags} className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white focus:border-blue-500 focus:outline-none" placeholder="e.g. Core, USP, Slow Method" />
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-6 border-t border-gray-700">
        <Button variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button variant="primary" onClick={onSave}>Save Entry</Button>
      </div>
    </div>
  );
};

export default CatalogueEntryForm;