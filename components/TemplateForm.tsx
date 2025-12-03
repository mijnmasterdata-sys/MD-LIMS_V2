import React, { useState, useEffect } from 'react';
import Button from './Button';
import { ParsingTemplate } from '../types';

interface TemplateFormProps {
  template?: ParsingTemplate;
  onSave: (template: ParsingTemplate) => void;
  onCancel: () => void;
}

const TemplateForm: React.FC<TemplateFormProps> = ({ template, onSave, onCancel }) => {
  const [formData, setFormData] = useState<ParsingTemplate>({
    id: template?.id || '',
    name: template?.name || '',
    description: template?.description || '',
    customInstruction: template?.customInstruction || '',
  });

  useEffect(() => {
    if (template) setFormData(template);
  }, [template]);

  const handleChange = (field: keyof ParsingTemplate, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in slide-in-from-bottom-4 duration-300 bg-gray-800 p-8 rounded-lg border border-gray-700 shadow-xl mt-10">
      <h2 className="text-2xl font-bold text-white mb-6">
        {template ? 'Edit Parsing Template' : 'New Parsing Template'}
      </h2>

      <div className="grid grid-cols-1 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Template Name</label>
          <input 
            type="text" 
            value={formData.name} 
            onChange={(e) => handleChange('name', e.target.value)}
            className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white focus:border-blue-500 focus:outline-none" 
            placeholder="e.g. Supplier A - COA Layout" 
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Description</label>
          <input 
            type="text" 
            value={formData.description} 
            onChange={(e) => handleChange('description', e.target.value)}
            className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white focus:border-blue-500 focus:outline-none" 
            placeholder="Briefly describe what files this template is for"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">Structural Instructions (Gemini Prompt Context)</label>
          <p className="text-xs text-gray-500 mb-2">
            Describe the file structure to help the AI parser. You can specify header names, layout rules, or provide a text snippet as an example.
          </p>
          <textarea 
            rows={10}
            value={formData.customInstruction} 
            onChange={(e) => handleChange('customInstruction', e.target.value)}
            className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white font-mono text-sm focus:border-blue-500 focus:outline-none" 
            placeholder={`Example: 
- The Product Code is located at the top right, labeled "Ref No:".
- The specification table starts after the header "Analytical Results".
- The columns are: Test Name | Specification | Result | Method.
- Ignore the footer disclaimer.`} 
          />
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-6 border-t border-gray-700">
        <Button variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button variant="primary" onClick={() => onSave(formData)}>Save Template</Button>
      </div>
    </div>
  );
};

export default TemplateForm;