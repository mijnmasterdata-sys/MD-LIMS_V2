import React, { useState, useEffect, useMemo } from 'react';
import Button from './Button';
import { Product, TestItem, CatalogueEntry } from '../types';
import { DUMMY_TESTS, MATERIAL_TYPES, RULES } from '../constants';

interface ProductFormProps {
  product?: Product; // If null, creating new
  initialTests?: TestItem[]; // For imported data
  catalogue: CatalogueEntry[];
  onSave: (product: Product) => void;
  onCancel: () => void;
  onImportClick: () => void;
}

const ProductForm: React.FC<ProductFormProps> = ({ product, initialTests, catalogue, onSave, onCancel, onImportClick }) => {
  const [headerData, setHeaderData] = useState<Product>({
    id: product?.id || '',
    productCode: product?.productCode || '',
    productName: product?.productName || '',
    version: product?.version || '',
    materialType: product?.materialType || 'Raw Material',
    effectiveDate: product?.effectiveDate || ''
  });

  const [tests, setTests] = useState<TestItem[]>([]);
  const [selectedCatalogueId, setSelectedCatalogueId] = useState<string>('');

  // Memoized calculation for duplicate components
  const duplicateComponents = useMemo(() => {
    const counts = new Map<string, number>();
    tests.forEach(test => {
      // Only count non-empty/non-placeholder components
      if (test.component && test.component.trim() && test.component !== '---') {
        counts.set(test.component, (counts.get(test.component) || 0) + 1);
      }
    });
    const duplicates = new Set<string>();
    for (const [component, count] of counts.entries()) {
      if (count > 1) {
        duplicates.add(component);
      }
    }
    return duplicates;
  }, [tests]);

  // Initialize Tests State
  useEffect(() => {
    if (initialTests && initialTests.length > 0) {
      setTests(initialTests);
    } else if (product && !initialTests) {
      // If editing existing product (simulated), load dummy tests if empty, or keep empty
      if (product.id && !product.id.startsWith('draft') && !product.id.startsWith('new')) {
         setTests(DUMMY_TESTS); 
      } else {
         setTests([]);
      }
    } else {
      setTests([]);
    }
  }, [product, initialTests]);

  // Handle header changes
  const handleHeaderChange = (field: keyof Product, value: string) => {
    setHeaderData(prev => ({ ...prev, [field]: value }));
  };

  const handleTestChange = (id: string, field: keyof TestItem, value: string) => {
    setTests(prevTests => 
        prevTests.map(test => 
            test.id === id ? { ...test, [field]: value } : test
        )
    );
  };

  const handleAddTest = () => {
    if (!selectedCatalogueId) return;
    
    const selectedEntry = catalogue.find(c => c.id === selectedCatalogueId);
    if (!selectedEntry) return;

    const newTest: TestItem = {
      id: `new-${Date.now()}`,
      order: (tests.length + 1) * 10,
      matchStatus: 'MANUAL',
      confidenceScore: 100,
      suggestions: [],
      analysis: selectedEntry.analysis,
      component: selectedEntry.component,
      testCode: selectedEntry.testCode,
      description: selectedEntry.analysis,
      rule: 'N/A',
      min: '',
      max: '',
      textSpec: '',
      units: selectedEntry.units,
      category: selectedEntry.category,
      reportedNameAnalysis: selectedEntry.analysis,
      reportedNameComponent: selectedEntry.component,
      cLitReference: '',
    };
    
    setTests([...tests, newTest]);
    setSelectedCatalogueId(''); // Reset dropdown after adding
  };


  const handleRemoveTest = (id: string) => {
    setTests(tests.filter(t => t.id !== id));
  };

  const handleSuggestionSelect = (testId: string, catalogueEntryId: string) => {
    const selectedEntry = catalogue.find(c => c.id === catalogueEntryId);
    if (!selectedEntry) return;

    setTests(prevTests => 
        prevTests.map(test => {
            if (test.id === testId) {
                return {
                    ...test,
                    matchStatus: 'MANUAL',
                    confidenceScore: 100,
                    analysis: selectedEntry.analysis,
                    component: selectedEntry.component,
                    testCode: selectedEntry.testCode,
                    units: selectedEntry.units,
                    category: selectedEntry.category,
                    suggestions: [], // Clear suggestions after matching
                };
            }
            return test;
        })
    );
  };

  const handleFormSave = () => {
    onSave(headerData);
  };

  const getStatusBadge = (status: TestItem['matchStatus']) => {
    switch(status) {
      case 'MATCHED': return <span className="text-green-400" title="Matched">●</span>;
      case 'LOW_CONFIDENCE': return <span className="text-yellow-400" title="Low Confidence">●</span>;
      case 'UNMATCHED': return <span className="text-red-400" title="Unmatched">●</span>;
      case 'MANUAL': return <span className="text-blue-400" title="Manually Matched">●</span>;
      default: return <span className="text-gray-400">○</span>;
    }
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 90) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
      
      {/* Header / Meta Data */}
      <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 shadow-md">
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-2xl font-bold text-white">
            {headerData.productCode ? `Edit Product: ${headerData.productCode}` : 'Create New Product'}
          </h2>
          <div className="space-x-3">
             <Button variant="secondary" onClick={onImportClick} className="flex items-center gap-2">
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
               Import from Doc
             </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1 uppercase">Product Code</label>
            <input 
              type="text" 
              value={headerData.productCode} 
              onChange={(e) => handleHeaderChange('productCode', e.target.value)}
              className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white focus:border-blue-500 focus:outline-none" 
              placeholder="e.g. P-1001" 
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1 uppercase">Product Name</label>
            <input 
              type="text" 
              value={headerData.productName} 
              onChange={(e) => handleHeaderChange('productName', e.target.value)}
              className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white focus:border-blue-500 focus:outline-none" 
              placeholder="e.g. Phosphate Buffer" 
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1 uppercase">Version</label>
            <input 
              type="text" 
              value={headerData.version} 
              onChange={(e) => handleHeaderChange('version', e.target.value)}
              className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white focus:border-blue-500 focus:outline-none" 
              placeholder="1.0" 
            />
          </div>
           <div>
            <label className="block text-xs font-medium text-gray-400 mb-1 uppercase">Material Type</label>
            <select 
              value={headerData.materialType} 
              onChange={(e) => handleHeaderChange('materialType', e.target.value)}
              className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
            >
              {MATERIAL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1 uppercase">Effective Date</label>
            <input 
              type="date" 
              value={headerData.effectiveDate} 
              onChange={(e) => handleHeaderChange('effectiveDate', e.target.value)}
              className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white focus:border-blue-500 focus:outline-none" 
            />
          </div>
        </div>
      </div>

      {/* Specification Table */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 shadow-md overflow-hidden">
        <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-900/30">
          <h3 className="text-lg font-semibold text-white">Specification Tests</h3>
          
          <div className="flex items-center space-x-2">
            <select 
              className="bg-gray-900 border border-gray-600 text-xs rounded px-2 py-1.5 text-white focus:outline-none max-w-[200px]"
              value={selectedCatalogueId}
              onChange={(e) => setSelectedCatalogueId(e.target.value)}
            >
              <option value="">Select Catalogue Item...</option>
              {catalogue.map(c => (
                <option key={c.id} value={c.id}>{c.testCode} - {c.analysis}</option>
              ))}
            </select>
            <Button size="sm" onClick={handleAddTest}>Add Test</Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[1600px] w-full divide-y divide-gray-700">
            <thead className="bg-gray-900">
              <tr>
                <th className="w-12 px-3 py-3 text-center text-xs font-medium text-gray-400 uppercase">#</th>
                <th className="w-16 px-3 py-3 text-center text-xs font-medium text-gray-400 uppercase">Stat</th>
                <th className="w-16 px-3 py-3 text-center text-xs font-medium text-gray-400 uppercase">Conf</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-400 uppercase w-40">Analysis</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-400 uppercase w-32">Component</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-400 uppercase w-24">Test Code</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-400 uppercase w-48">Description</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-400 uppercase w-28">Rule</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-400 uppercase w-20">Min</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-400 uppercase w-20">Max</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-400 uppercase w-40">Text Spec</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-400 uppercase w-20">Units</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-400 uppercase w-28">Category</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-400 uppercase w-32">Rep. Name (A)</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-400 uppercase w-32">Rep. Name (C)</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-400 uppercase w-32">C-Lit Ref</th>
                <th className="w-24 px-3 py-3 text-center text-xs font-medium text-gray-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700 bg-gray-800">
              {tests.map((test, idx) => (
                <tr key={test.id} className="group hover:bg-gray-750">
                   <td className="px-3 py-2 text-center text-xs text-gray-500 font-mono">{idx + 1}</td>
                   <td className="px-3 py-2 text-center text-xs">
                     <div className="flex justify-center">{getStatusBadge(test.matchStatus)}</div>
                   </td>
                   <td className="px-3 py-2 text-center">
                     <div className="w-full bg-gray-700 rounded-full h-1.5 mb-1">
                        <div className={`${getConfidenceColor(test.confidenceScore)} h-1.5 rounded-full`} style={{ width: `${test.confidenceScore}%` }}></div>
                     </div>
                     <span className="text-[10px] text-gray-400">{test.confidenceScore}%</span>
                   </td>
                   <td className="px-3 py-2">
                     <div className="flex flex-col gap-1">
                       <input type="text" value={test.analysis} onChange={(e) => handleTestChange(test.id, 'analysis', e.target.value)} className="w-full bg-transparent border-none text-xs text-white focus:ring-0 p-0" />
                       {test.matchStatus === 'UNMATCHED' && test.suggestions && test.suggestions.length > 0 && (
                         <select 
                          className="w-full bg-blue-900/30 text-[10px] text-blue-200 border border-blue-800 rounded px-1 py-0.5 focus:outline-none"
                          onChange={(e) => handleSuggestionSelect(test.id, e.target.value)}
                          value=""
                        >
                           <option value="">Match Suggestion...</option>
                           {test.suggestions.map(s => <option key={s.id} value={s.id}>{s.testCode} - {s.analysis}</option>)}
                         </select>
                       )}
                     </div>
                   </td>
                   <td className="px-3 py-2">
                     <input type="text" value={test.component} onChange={(e) => handleTestChange(test.id, 'component', e.target.value)} className={`w-full bg-transparent border-b border-transparent group-hover:border-gray-600 focus:border-blue-500 text-xs focus:ring-0 px-1 py-0.5 ${duplicateComponents.has(test.component) ? 'text-red-400 font-bold border-red-500/50 group-hover:border-red-500' : 'text-white'}`} />
                   </td>
                   <td className="px-3 py-2"><input type="text" value={test.testCode} onChange={(e) => handleTestChange(test.id, 'testCode', e.target.value)} className="w-full bg-transparent border-b border-transparent group-hover:border-gray-600 focus:border-blue-500 text-xs text-blue-300 focus:ring-0 px-1 py-0.5" /></td>
                   <td className="px-3 py-2"><input type="text" value={test.description} onChange={(e) => handleTestChange(test.id, 'description', e.target.value)} className="w-full bg-transparent border-b border-transparent group-hover:border-gray-600 focus:border-blue-500 text-xs text-gray-300 focus:ring-0 px-1 py-0.5" /></td>
                   <td className="px-3 py-2">
                     <select value={test.rule} onChange={(e) => handleTestChange(test.id, 'rule', e.target.value)} className="w-full bg-transparent text-xs text-gray-300 border-none focus:ring-0 p-0 cursor-pointer">
                       {RULES.map(r => <option key={r} value={r} className="bg-gray-800">{r}</option>)}
                     </select>
                   </td>
                   <td className="px-3 py-2"><input type="text" value={test.min} onChange={(e) => handleTestChange(test.id, 'min', e.target.value)} className="w-full bg-gray-900/50 border border-gray-700 rounded text-xs text-white px-1 py-1 focus:border-blue-500 focus:outline-none" /></td>
                   <td className="px-3 py-2"><input type="text" value={test.max} onChange={(e) => handleTestChange(test.id, 'max', e.target.value)} className="w-full bg-gray-900/50 border border-gray-700 rounded text-xs text-white px-1 py-1 focus:border-blue-500 focus:outline-none" /></td>
                   <td className="px-3 py-2"><input type="text" value={test.textSpec} onChange={(e) => handleTestChange(test.id, 'textSpec', e.target.value)} className="w-full bg-gray-900/50 border border-gray-700 rounded text-xs text-white px-1 py-1 focus:border-blue-500 focus:outline-none" /></td>
                   <td className="px-3 py-2"><input type="text" value={test.units} onChange={(e) => handleTestChange(test.id, 'units', e.target.value)} className="w-full bg-transparent text-xs text-gray-300 text-center border-none focus:ring-0 p-0" /></td>
                   <td className="px-3 py-2"><input type="text" value={test.category} onChange={(e) => handleTestChange(test.id, 'category', e.target.value)} className="w-full bg-transparent text-xs text-gray-400 border-none focus:ring-0 p-0" /></td>
                   <td className="px-3 py-2"><input type="text" value={test.reportedNameAnalysis} onChange={(e) => handleTestChange(test.id, 'reportedNameAnalysis', e.target.value)} className="w-full bg-transparent border-b border-transparent group-hover:border-gray-600 text-xs text-gray-400 focus:ring-0 px-1 py-0.5" /></td>
                   <td className="px-3 py-2"><input type="text" value={test.reportedNameComponent} onChange={(e) => handleTestChange(test.id, 'reportedNameComponent', e.target.value)} className="w-full bg-transparent border-b border-transparent group-hover:border-gray-600 text-xs text-gray-400 focus:ring-0 px-1 py-0.5" /></td>
                   <td className="px-3 py-2"><input type="text" value={test.cLitReference} onChange={(e) => handleTestChange(test.id, 'cLitReference', e.target.value)} className="w-full bg-transparent border-b border-transparent group-hover:border-gray-600 text-xs text-gray-400 focus:ring-0 px-1 py-0.5" /></td>
                   <td className="px-3 py-2 text-center">
                     <div className="flex items-center justify-center space-x-2">
                       <button onClick={() => handleRemoveTest(test.id)} className="text-gray-500 hover:text-red-400 transition-colors p-1" title="Delete">
                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                       </button>
                     </div>
                   </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-end space-x-4 pt-4 border-t border-gray-700">
        <Button variant="secondary" size="lg" onClick={onCancel}>Cancel</Button>
        <Button variant="primary" size="lg" onClick={handleFormSave}>Save Product</Button>
      </div>
    </div>
  );
};

export default ProductForm;