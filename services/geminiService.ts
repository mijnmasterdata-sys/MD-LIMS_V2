import { GoogleGenAI, Type } from "@google/genai";
import { ParseInput, ProductSpec, CatalogueEntry, TestItem, ParsedLine } from "../types";
// @ts-ignore
import * as pdfjsLib from 'pdfjs-dist';
// NOTE: Tesseract is now dynamically imported to prevent blocking initial load.

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Set worker for PDF.js - Ensure it points to the correct version matching the library
if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@4.0.379/build/pdf.worker.min.mjs`;
}

/**
 * Main entry point to parse a document against a catalogue.
 */
export async function parseSpecDocument(
  input: ParseInput,
  catalogue: CatalogueEntry[],
  customInstruction?: string
): Promise<ProductSpec | null> {
  try {
    let textContent = "";

    // 1. Extract Text
    if (input.type === 'text') {
      textContent = input.data;
    } else if (input.type === 'file' && input.mimeType === 'application/pdf') {
      // Decode Base64 to Uint8Array
      const binaryString = atob(input.data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      // Extract text using PDF.js with OCR fallback
      textContent = await extractTextFromPdf(bytes);
    } else {
      throw new Error("Unsupported input type");
    }

    if (!textContent || textContent.trim().length === 0) {
      console.warn("No text extracted from document");
      return null;
    }

    // 2. Call Gemini to Extract Structure using ONLY text, optionally with custom template instructions
    const extractedData = await callGeminiExtraction(textContent, customInstruction);

    if (!extractedData) return null;

    // 3. Process Header
    const productCode = extractedData.header.productCode || "DRAFT-" + Date.now().toString().slice(-4);
    const productName = extractedData.header.productName || "New Product";
    const version = extractedData.header.version || "1.0";
    const effectiveDate = extractedData.header.effectiveDate || new Date().toISOString().split('T')[0];
    const materialType = extractedData.header.materialType || "Finished Good";

    // 4. Match Lines to Catalogue
    const tests: TestItem[] = [];
    const seenCodes = new Set<string>();

    for (const [index, line] of extractedData.rows.entries()) {
      if (!line.rawTestCode && !line.rawDescription) continue;

      const match = matchCatalogue(line, catalogue);
      
      const testCode = match?.entry.testCode || line.rawTestCode || `UNKNOWN-${index}`;
      
      if (seenCodes.has(testCode)) continue;
      seenCodes.add(testCode);

      // Determine Rules
      const { rule, min, max, textSpec } = interpretRule(line.rawLimit || line.rawTextSpec);

      const newItem: TestItem = {
        id: `imported-${index}-${Date.now()}`,
        order: (index + 1) * 10,
        matchStatus: match ? (match.confidence >= 95 ? 'MATCHED' : 'LOW_CONFIDENCE') : 'UNMATCHED',
        confidenceScore: match ? match.confidence : 0,
        suggestions: match ? [] : findSuggestions(line, catalogue),
        
        analysis: match?.entry.analysis || line.rawDescription || "Unknown Analysis",
        component: match?.entry.component || "Unknown Component",
        testCode: testCode,
        description: match?.entry.analysis || line.rawDescription || "",
        
        rule: rule,
        min: min,
        max: max,
        textSpec: textSpec,
        
        units: match?.entry.units || "-",
        category: match?.entry.category || "General",
        reportedNameAnalysis: match?.entry.analysis || "",
        reportedNameComponent: match?.entry.component || "",
        cLitReference: "",
      };

      tests.push(newItem);
    }

    return {
      productCode,
      productName,
      materialType,
      version,
      effectiveDate,
      tests
    };

  } catch (error) {
    console.error("Parsing failed", error);
    return null;
  }
}

// --- Helper Functions ---

export async function extractTextFromPdf(data: Uint8Array): Promise<string> {
  try {
    const loadingTask = pdfjsLib.getDocument({
      data,
      cMapUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@4.0.379/cmaps/`,
      cMapPacked: true,
      standardFontDataUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@4.0.379/standard_fonts/`
    });

    const doc = await loadingTask.promise;
    let fullText = "";
    let useOCR = false;
    
    // Pass 1: Try Text Layer
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      const strings = content.items.map((item: any) => item.str);
      const pageText = strings.join(" ");
      
      // Heuristic: If page text is very short, it's likely a scanned image
      if (pageText.trim().length < 50) {
        useOCR = true;
      }
      fullText += pageText + "\n\n";
    }

    // Pass 2: Fallback to OCR if text is missing or sparse
    if (useOCR || fullText.trim().length === 0) {
      console.log("Text layer missing or sparse. Falling back to OCR...");
      fullText = ""; // Reset to build from OCR
      
      // Dynamic import of Tesseract.js
      const { createWorker } = await import('tesseract.js');
      const worker = await createWorker('eng');
      
      for (let i = 1; i <= doc.numPages; i++) {
        const page = await doc.getPage(i);
        const viewport = page.getViewport({ scale: 2.0 }); // Scale up for better OCR accuracy
        
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({ canvasContext: context!, viewport: viewport }).promise;
        
        // Tesseract takes the canvas directly
        const { data: { text } } = await worker.recognize(canvas);
        fullText += text + "\n\n";
      }
      
      await worker.terminate();
    }

    if (fullText.trim().length === 0) {
      throw new Error("No text found. OCR also failed to extract readable text.");
    }

    return fullText;
  } catch (err: any) {
    console.error("PDF.js/OCR Extraction Error:", err);
    throw new Error(`Extraction failed: ${err.message}`);
  }
}

async function callGeminiExtraction(textData: string, customInstruction?: string): Promise<{ header: any, rows: ParsedLine[] } | null> {
  const model = "gemini-2.5-flash";
  
  let systemInstruction = `
    You are a specialized LIMS Specification Parser. 
    Your job is to extract structured data from raw product specification text.
    
    Extract the following Header fields:
    - Product Code
    - Product Name
    - Version
    - Effective Date
    - Material Type (Raw Material, Finished Good, etc.)

    Extract the Specification Rows (Tests). For each row identify:
    - Raw Test Code (e.g., pH, ASSAY, APP)
    - Raw Description (e.g., Appearance, pH Value, HPLC Assay)
    - Raw Limit/Spec (e.g., "NMT 1.0%", "98.0 - 102.0 %", "Complies", "White powder")
    
    Return the result in JSON format.
  `;

  if (customInstruction) {
    systemInstruction += `\n\nIMPORTANT - CUSTOM PARSING INSTRUCTIONS PROVIDED BY USER:\n${customInstruction}\n\nFollow these custom instructions strictly to locate fields and headers.`;
  }

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: { 
        parts: [{ text: `Extract the specification data from this text:\n\n${textData}` }] 
      },
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            header: {
              type: Type.OBJECT,
              properties: {
                productCode: { type: Type.STRING },
                productName: { type: Type.STRING },
                version: { type: Type.STRING },
                effectiveDate: { type: Type.STRING },
                materialType: { type: Type.STRING },
              }
            },
            rows: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  rawTestCode: { type: Type.STRING },
                  rawDescription: { type: Type.STRING },
                  rawLimit: { type: Type.STRING },
                  rawTextSpec: { type: Type.STRING },
                }
              }
            }
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text);
    }
    return null;
  } catch (e) {
    console.error("Gemini API Error", e);
    return null;
  }
}

function matchCatalogue(line: ParsedLine, catalogue: CatalogueEntry[]): { entry: CatalogueEntry, confidence: number } | null {
  const rawCode = (line.rawTestCode || "").trim().toUpperCase();
  const rawDesc = (line.rawDescription || "").trim().toLowerCase();

  // 1. Exact Test Code Match
  const exactCode = catalogue.find(c => c.testCode.toUpperCase() === rawCode);
  if (exactCode) return { entry: exactCode, confidence: 100 };

  // 2. Synonym Match
  for (const entry of catalogue) {
    if (entry.synonyms) {
      const syns = entry.synonyms.split(',').map(s => s.trim().toUpperCase());
      if (syns.includes(rawCode)) return { entry, confidence: 95 };
      if (syns.includes(rawDesc.toUpperCase())) return { entry, confidence: 90 };
    }
  }

  // 3. Description Contains Match (simplified Levenshtein substitute)
  // Check if words in description match
  for (const entry of catalogue) {
    const entryDesc = entry.analysis.toLowerCase();
    if (rawDesc.includes(entryDesc) || entryDesc.includes(rawDesc)) {
       // Simple heuristic scoring
       return { entry, confidence: 80 };
    }
  }

  return null;
}

function findSuggestions(line: ParsedLine, catalogue: CatalogueEntry[]): string[] {
  // Simple suggestion based on partial text match
  const rawDesc = (line.rawDescription || "").toLowerCase();
  return catalogue
    .filter(c => c.analysis.toLowerCase().includes(rawDesc) || rawDesc.includes(c.analysis.toLowerCase()))
    .map(c => c.analysis)
    .slice(0, 3);
}

function interpretRule(rawLimit: string): { rule: string, min: string, max: string, textSpec: string } {
  let rule = "N/A";
  let min = "";
  let max = "";
  let textSpec = "";

  if (!rawLimit) return { rule, min, max, textSpec };

  const clean = rawLimit.trim();
  const lower = clean.toLowerCase();

  // Numeric Rules
  // NMT / Not more than / <=
  if (lower.match(/nmt|not more than|<=|<|^max/)) {
    const num = clean.match(/-?\d+(\.\d+)?/);
    if (num) {
      rule = "Max";
      max = num[0];
    }
  }
  // NLT / Not less than / >=
  else if (lower.match(/nlt|not less than|>=|>|^min/)) {
    const num = clean.match(/-?\d+(\.\d+)?/);
    if (num) {
      rule = "Min";
      min = num[0];
    }
  }
  // Range (X - Y, X to Y)
  else if (clean.match(/\d+(\.\d+)?\s*[-–to]\s*\d+(\.\d+)?/)) {
    const nums = clean.match(/-?\d+(\.\d+)?/g);
    if (nums && nums.length >= 2) {
      rule = "Range";
      min = nums[0];
      max = nums[1];
    }
  }
  // Text Rules
  // Complies, Pass, Positive, Appearance description
  else {
    rule = "Text";
    textSpec = clean;
  }

  return { rule, min, max, textSpec };
}