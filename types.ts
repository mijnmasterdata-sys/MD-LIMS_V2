
export interface Product {
  id: string;
  productCode: string;
  productName: string;
  version: string;
  materialType: string;
  effectiveDate?: string;
}

export interface TestItem {
  id: string;
  order: number;
  matchStatus: 'MATCHED' | 'UNMATCHED' | 'MANUAL' | 'LOW_CONFIDENCE';
  confidenceScore: number;
  suggestions?: string[];
  analysis: string;
  component: string;
  testCode: string;
  description: string;
  rule: string;
  min: string;
  max: string;
  textSpec: string;
  units: string;
  category: string;
  reportedNameAnalysis: string;
  reportedNameComponent: string;
  cLitReference: string;
}

export interface CatalogueEntry {
  id: string;
  testCode: string;
  analysis: string;
  component: string;
  units: string;
  category: string;
  type: string;
  defaultGrade: string;
  rounding: string;
  synonyms: string;
  tags: string;
  priority: 'High' | 'Medium' | 'Low';
}

export interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  user: string;
  details: string;
}

export type ViewState = 'PRODUCT_LIST' | 'PRODUCT_FORM' | 'CATALOGUE_LIST' | 'CATALOGUE_FORM';

export interface ModalState {
  importDoc: boolean;
  manualMatch: boolean;
  exportTool: boolean;
  auditTrail: boolean;
}

// Service Types
export type ParseInput = 
  | { type: 'file'; data: string; mimeType: 'application/pdf' } 
  | { type: 'text'; data: string };

export interface ProductSpec {
  productCode: string;
  productName: string;
  materialType: string;
  version: string;
  effectiveDate: string;
  tests: TestItem[];
}

export interface ParsedLine {
  rawTestCode: string;
  rawDescription: string;
  rawLimit: string;
  rawTextSpec: string;
}
