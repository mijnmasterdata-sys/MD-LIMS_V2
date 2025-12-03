import React from 'react';
import Button from './Button';
import { ParsingTemplate } from '../types';

interface TemplateListViewProps {
  templates: ParsingTemplate[];
  onCreate: () => void;
  onEdit: (template: ParsingTemplate) => void;
  onDelete: (id: string) => void;
}

const TemplateListView: React.FC<TemplateListViewProps> = ({ templates, onCreate, onEdit, onDelete }) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Parsing Templates</h2>
          <p className="text-gray-400 text-sm">Define structural rules to improve document import accuracy.</p>
        </div>
        <Button onClick={onCreate} variant="primary">+ New Template</Button>
      </div>

      <div className="overflow-hidden border border-gray-700 rounded-lg shadow-lg bg-gray-800">
        <table className="min-w-full divide-y divide-gray-700">
          <thead className="bg-gray-900/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Template Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Description</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Instructions Preview</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700 bg-gray-800">
            {templates.map((template) => (
              <tr key={template.id} className="hover:bg-gray-750 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-400">{template.name}</td>
                <td className="px-6 py-4 text-sm text-gray-300">{template.description}</td>
                <td className="px-6 py-4 text-sm text-gray-400 max-w-md truncate font-mono text-xs">{template.customInstruction}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                  <button onClick={() => onEdit(template)} className="text-blue-400 hover:text-blue-300">Edit</button>
                  <button onClick={() => onDelete(template.id)} className="text-red-400 hover:text-red-300">Delete</button>
                </td>
              </tr>
            ))}
            {templates.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                  No templates defined. Create one to customize file parsing.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TemplateListView;