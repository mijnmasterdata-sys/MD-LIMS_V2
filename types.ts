

export interface Product {
  id: string;
  productCode: string;
  productName: string;
  version: string;
  materialType: string;
  effectiveDate?: string;
  packDescription?: string;
}

export interface TestItem {
  id: string;
  order: number;
  matchStatus: 'MATCHED' | 'UNMATCHED' | 'MANUAL' | 'LOW_CONFIDENCE';
  confidenceScore: number;
  suggestions?: Pick<CatalogueEntry, 'id' | 'analysis' | 'testCode'>[];
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
  stage?: string;
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

export interface TemplateMapping {
  id: string;
  text: string;
  fieldType: 'Analysis' | 'Component' | 'Unit' | 'Spec Min' | 'Spec Max' | 'Spec Text' | 'Reference' | 'Reported Name';
  color: string;
}

export interface ParsingTemplate {
  id: string;
  name: string;
  description: string;
  customInstruction: string; // The specific structural prompt for Gemini
  sampleText?: string; // The raw text of the sample file
  mappings?: TemplateMapping[]; // The user-defined tags
}

export interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  user: string;
  details: string;
}

export type ViewState = 'PRODUCT_LIST' | 'PRODUCT_FORM' | 'CATALOGUE_LIST' | 'CATALOGUE_FORM' | 'TEMPLATE_LIST' | 'TEMPLATE_FORM';

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
  packDescription?: string;
  tests: TestItem[];
}

export interface ParsedLine {
  rawTestCode: string;
  rawDescription: string;
  rawLimit: string;
  rawTextSpec: string;
  rawReference?: string;
  rawStage?: string;
}