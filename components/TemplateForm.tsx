import React, { useState, useEffect, useRef } from 'react';
import Button from './Button';
import { ParsingTemplate, TemplateMapping } from '../types';
import { extractTextFromPdf } from '../services/geminiService';

interface TemplateFormProps {
  template?: ParsingTemplate;
  onSave: (template: ParsingTemplate) => void;
  onCancel: () => void;
}

const TAG_TYPES = [
  { label: 'Analysis', value: 'Analysis', color: 'bg-blue-500/40 text-blue-200 border-blue-500' },
  { label: 'Component', value: 'Component', color: 'bg-indigo-500/40 text-indigo-200 border-indigo-500' },
  { label: 'Unit', value: 'Unit', color: 'bg-purple-500/40 text-purple-200 border-purple-500' },
  { label: 'Spec Min', value: 'Spec Min', color: 'bg-green-500/40 text-green-200 border-green-500' },
  { label: 'Spec Max', value: 'Spec Max', color: 'bg-emerald-500/40 text-emerald-200 border-emerald-500' },
  { label: 'Spec Text', value: 'Spec Text', color: 'bg-teal-500/40 text-teal-200 border-teal-500' },
  { label: 'Reference', value: 'Reference', color: 'bg-orange-500/40 text-orange-200 border-orange-500' },
  { label: 'Reported Name', value: 'Reported Name', color: 'bg-pink-500/40 text-pink-200 border-pink-500' },
];

const TemplateForm: React.FC<TemplateFormProps> = ({ template, onSave, onCancel }) => {
  const [formData, setFormData] = useState<ParsingTemplate>({
    id: template?.id || '',
    name: template?.name || '',
    description: template?.description || '',
    customInstruction: template?.customInstruction || '',
    sampleText: template?.sampleText || '',
    mappings: template?.mappings || [],
  });

  const [isLoading, setIsLoading] = useState(false);
  const [selection, setSelection] = useState<{text: string, range: Range | null} | null>(null);
  const contentEditableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (template) setFormData(template);
  }, [template]);

  // Handle PDF Upload and Extraction
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setIsLoading(true);
      const file = e.target.files[0];
      try {
        const arrayBuffer = await file.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        const text = await extractTextFromPdf(bytes);
        setFormData(prev => ({ ...prev, sampleText: text }));
      } catch (err) {
        console.error("Error extracting text", err);
        alert("Failed to extract text from PDF.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleTextMouseUp = () => {
    const sel = window.getSelection();
    if (sel && sel.toString().trim().length > 0 && sel.rangeCount > 0) {
      setSelection({
        text: sel.toString().trim(),
        range: sel.getRangeAt(0).cloneRange()
      });
    } else {
      setSelection(null);
    }
  };

  const addMapping = (typeValue: string) => {
    if (!selection) return;
    
    const tagType = TAG_TYPES.find(t => t.value === typeValue);
    if (!tagType) return;

    const newMapping: TemplateMapping = {
      id: `map-${Date.now()}`,
      text: selection.text,
      fieldType: typeValue as any,
      color: tagType.color
    };

    const updatedMappings = [...(formData.mappings || []), newMapping];
    setFormData(prev => ({ ...prev, mappings: updatedMappings }));
    setSelection(null);
    window.getSelection()?.removeAllRanges();
  };

  const removeMapping = (id: string) => {
    setFormData(prev => ({
      ...prev,
      mappings: prev.mappings?.filter(m => m.id !== id)
    }));
  };

  const generateInstructions = () => {
    if (!formData.mappings || formData.mappings.length === 0) {
      alert("Please add some tags first.");
      return;
    }

    let instruction = "Structure analysis based on user tags:\n\n";
    
    // Group by field type
    const grouped = formData.mappings.reduce((acc, curr) => {
      acc[curr.fieldType] = acc[curr.fieldType] || [];
      acc[curr.fieldType].push(curr.text);
      return acc;
    }, {} as Record<string, string[]>);

    Object.entries(grouped).forEach(([type, examples]) => {
      instruction += `- The field '${type}' often appears as: "${examples.join('", "')}".\n`;
    });
    
    instruction += "\nUse these marked examples to understand the document layout and extract similar fields.";

    setFormData(prev => ({ ...prev, customInstruction: instruction }));
  };

  // Render text with highlighting
  // Note: This is a simplified read-only rendering of highlights. 
  // Editing raw text with overlays is complex, so we just render the raw text and highlights separately or via simple string replacement for display.
  // For the builder, we just show the raw text and allow selection. The "mappings" list shows what has been tagged.
  const renderHighlightedPreview = () => {
    if (!formData.sampleText) return <p className="text-gray-500 italic">No sample text loaded.</p>;
    return (
       <div 
         className="font-mono text-xs text-gray-300 whitespace-pre-wrap leading-relaxed select-text"
         onMouseUp={handleTextMouseUp}
       >
         {formData.sampleText}
       </div>
    );
  };

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] animate-in fade-in duration-300 gap-6">
      
      {/* Header Area */}
      <div className="flex justify-between items-center bg-gray-800 p-4 rounded-lg border border-gray-700">
        <div>
           <h2 className="text-xl font-bold text-white">
            {template ? 'Edit Parsing Template' : 'New Parsing Template'}
           </h2>
           <p className="text-sm text-gray-400">Upload a sample and tag fields to train the parser.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={onCancel}>Cancel</Button>
          <Button variant="primary" onClick={() => onSave(formData)}>Save Template</Button>
        </div>
      </div>

      <div className="flex-1 flex gap-6 min-h-0">
        
        {/* Left Panel: Inputs & Mappings */}
        <div className="w-1/3 flex flex-col gap-4 overflow-y-auto pr-2">
          
          <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Template Name</label>
              <input 
                type="text" 
                value={formData.name} 
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white text-sm focus:border-blue-500 focus:outline-none" 
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Description</label>
              <input 
                type="text" 
                value={formData.description} 
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white text-sm focus:border-blue-500 focus:outline-none" 
              />
            </div>
          </div>

          <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 flex-1 flex flex-col">
            <h3 className="text-sm font-semibold text-white mb-3">Tagged Fields</h3>
            
            <div className="flex-1 overflow-y-auto space-y-2 mb-4">
              {formData.mappings && formData.mappings.length > 0 ? (
                formData.mappings.map(m => (
                  <div key={m.id} className={`flex justify-between items-center p-2 rounded border ${m.color.replace('bg-', 'bg-opacity-20 ')}`}>
                    <div className="truncate pr-2">
                      <span className="block text-xs font-bold opacity-80">{m.fieldType}</span>
                      <span className="text-xs font-mono text-white truncate">"{m.text}"</span>
                    </div>
                    <button onClick={() => removeMapping(m.id)} className="text-gray-400 hover:text-red-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-500 text-center py-4">No tags yet. Select text in the sample to add tags.</p>
              )}
            </div>
            
            <Button size="sm" variant="secondary" onClick={generateInstructions} className="w-full">
               Generate Gemini Prompt
            </Button>
          </div>

          <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
             <label className="block text-xs font-medium text-gray-400 mb-1">System Instruction (Auto-generated)</label>
             <textarea 
               rows={6}
               value={formData.customInstruction}
               onChange={(e) => setFormData({...formData, customInstruction: e.target.value})}
               className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white font-mono text-xs focus:border-blue-500 focus:outline-none"
             />
          </div>

        </div>

        {/* Right Panel: Interactive Builder */}
        <div className="w-2/3 bg-gray-800 rounded-lg border border-gray-700 flex flex-col overflow-hidden relative">
           
           {/* Toolbar */}
           <div className="p-3 border-b border-gray-700 bg-gray-900 flex justify-between items-center">
             <div className="flex items-center gap-3">
               <label className="cursor-pointer bg-blue-700 hover:bg-blue-600 text-white text-xs px-3 py-1.5 rounded transition-colors shadow-sm">
                 Upload Sample PDF
                 <input type="file" className="hidden" accept=".pdf" onChange={handleFileUpload} />
               </label>
               {isLoading && <span className="text-xs text-blue-400 animate-pulse">Extracting Text...</span>}
             </div>
             <span className="text-xs text-gray-500">Select text below to tag</span>
           </div>

           {/* Floating Tag Menu (only shows when text is selected) */}
           {selection && (
             <div className="absolute top-16 left-1/2 transform -translate-x-1/2 bg-gray-900 border border-gray-600 shadow-2xl rounded-lg p-2 z-50 flex gap-1 animate-in fade-in zoom-in-95 duration-150">
                {TAG_TYPES.map(tag => (
                  <button
                    key={tag.value}
                    onClick={() => addMapping(tag.value)}
                    className={`px-2 py-1 text-[10px] font-bold rounded border uppercase tracking-wider transition-transform hover:scale-105 ${tag.color}`}
                  >
                    {tag.label}
                  </button>
                ))}
             </div>
           )}

           {/* Text Container */}
           <div className="flex-1 overflow-auto p-6 bg-gray-950/50">
              {renderHighlightedPreview()}
           </div>

        </div>

      </div>
    </div>
  );
};

export default TemplateForm;