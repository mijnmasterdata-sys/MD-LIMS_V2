import { Product, TestItem, CatalogueEntry, AuditLog, ParsingTemplate } from './types';

export const DUMMY_PRODUCTS: Product[] = [
  { id: '1', productCode: 'P-1001', productName: 'Phosphate Buffer', version: '1.0', materialType: 'Raw Material', effectiveDate: '2023-01-01' },
  { id: '2', productCode: 'P-1002', productName: 'Saline Solution', version: '2.1', materialType: 'Finished Good', effectiveDate: '2023-05-15' },
  { id: '3', productCode: 'P-2005', productName: 'Ethanol 99%', version: '1.0', materialType: 'Raw Material', effectiveDate: '2022-11-20' },
];

export const DUMMY_TESTS: TestItem[] = [
  {
    id: 't1', order: 1, 
    matchStatus: 'MATCHED', confidenceScore: 98, suggestions: [],
    analysis: 'Appearance', component: 'Appearance', testCode: 'APP01',
    description: 'Visual check for clarity', rule: 'N/A', min: '', max: '',
    textSpec: 'Clear, colorless liquid', units: '-', category: 'Physical',
    reportedNameAnalysis: 'Appearance', reportedNameComponent: 'Appearance', cLitReference: 'USP <790>'
  },
  {
    id: 't2', order: 2, 
    matchStatus: 'LOW_CONFIDENCE', confidenceScore: 65, 
    // FIX: The 'suggestions' property expects an array of objects, not strings.
    // Replaced string array with objects that match the required type from DUMMY_CATALOGUE.
    suggestions: [
      { id: 'c2', analysis: 'pH', testCode: 'PH01' },
      { id: 'c3', analysis: 'Assay', testCode: 'AS01' },
      { id: 'c4', analysis: 'Density', testCode: 'DN01' }
    ],
    analysis: 'pH', component: 'pH Value', testCode: 'PH01',
    description: 'Potentiometric determination', rule: 'Range', min: '7.2', max: '7.6',
    textSpec: '', units: 'pH', category: 'Chemical',
    reportedNameAnalysis: 'pH', reportedNameComponent: 'pH', cLitReference: 'USP <791>'
  },
  {
    id: 't3', order: 3, 
    matchStatus: 'UNMATCHED', confidenceScore: 12, suggestions: [],
    analysis: 'Assay', component: 'Concentration', testCode: 'AS01',
    description: 'HPLC Assay', rule: 'Min', min: '98.0', max: '',
    textSpec: '', units: '%', category: 'Chemical',
    reportedNameAnalysis: 'Assay', reportedNameComponent: 'Conc.', cLitReference: 'In-house'
  },
];

export const DUMMY_CATALOGUE: CatalogueEntry[] = [
  { 
    id: 'c1', testCode: 'APP01', analysis: 'Appearance', component: 'Appearance', units: '-', 
    category: 'Physical', type: 'Visual', defaultGrade: 'Pharma', rounding: 'N/A',
    synonyms: 'Visual, Clarity, Color', tags: 'Core, USP', priority: 'High'
  },
  { 
    id: 'c2', testCode: 'PH01', analysis: 'pH', component: 'pH Value', units: 'pH', 
    category: 'Chemical', type: 'Instrument', defaultGrade: 'Pharma', rounding: '1',
    synonyms: 'Acidity, Alkalinity, Hydrogen Ion', tags: 'Core', priority: 'High'
  },
  { 
    id: 'c3', testCode: 'AS01', analysis: 'Assay', component: 'Concentration', units: '%', 
    category: 'Chemical', type: 'HPLC', defaultGrade: 'Tech', rounding: '2',
    synonyms: 'Potency, Purity', tags: 'HPLC, Slow', priority: 'Medium'
  },
  { 
    id: 'c4', testCode: 'DN01', analysis: 'Density', component: 'Density', units: 'g/mL', 
    category: 'Physical', type: 'Instrument', defaultGrade: 'Pharma', rounding: '3',
    synonyms: 'Specific Gravity', tags: '', priority: 'Low'
  },
];

export const DUMMY_TEMPLATES: ParsingTemplate[] = [
  {
    id: 'tmpl-1',
    name: 'Standard Certificate of Analysis',
    description: 'General layout for supplier COAs.',
    customInstruction: 'Look for the "Test Name" column on the left and "Result" or "Specification" on the right. The Product Code is usually top-left labeled "Material No".',
    mappings: [],
    sampleText: ''
  },
  {
    id: 'tmpl-2',
    name: 'Legacy Specs (Scanned)',
    description: 'For older typewritten specifications.',
    customInstruction: 'These files are OCR text. Expect noise. The limits are often in parentheses like "(Min 98%)". Ignore handwritten notes.',
    mappings: [],
    sampleText: ''
  }
];

export const DUMMY_AUDIT_LOGS: AuditLog[] = [
  { id: 'a1', timestamp: '2023-10-25 10:30:00', action: 'CREATE', user: 'jdoe', details: 'Created Product P-1001' },
  { id: 'a2', timestamp: '2023-10-25 11:15:22', action: 'UPDATE', user: 'jdoe', details: 'Updated Spec Limits for pH' },
  { id: 'a3', timestamp: '2023-10-26 09:05:00', action: 'IMPORT', user: 'admin', details: 'Imported Catalogue CSV' },
];

export const MATERIAL_TYPES = ['Raw Material', 'Finished Good', 'Intermediate', 'Packaging'];
export const RULES = ['Range', 'Min', 'Max', 'Equal', 'Text', 'N/A'];
export const CATEGORIES = ['Physical', 'Chemical', 'Microbiological', 'Packaging'];