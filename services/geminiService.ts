import { GoogleGenAI, Type } from "@google/genai";
import { ParseInput, ProductSpec, CatalogueEntry, TestItem, ParsedLine } from "../types";
// @ts-ignore
import * as pdfjsLib from "pdfjs-dist";

// Initialize Gemini Client
// The API key is provided through the environment variable process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// -------- PDF.JS SETUP --------

// Get the version of the loaded pdfjs-dist library to prevent version mismatch errors.
const PDF_JS_VERSION = pdfjsLib.version;

// Set worker for PDF.js - Ensure it points to the correct version matching the library
if (typeof window !== "undefined" && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDF_JS_VERSION}/build/pdf.worker.min.mjs`;
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
    if (input.type === "text") {
      textContent = input.data;
    } else if (input.type === "file" && input.mimeType === "application/pdf") {
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
    console.log("RAW GEMINI OUTPUT:", extractedData);


    if (!extractedData) return null;

    // 3. Process Header
    const productCode =
      extractedData.header.productCode || "DRAFT-" + Date.now().toString().slice(-4);
    const productName = extractedData.header.productName || "New Product";
    const version = extractedData.header.version || "1.0";
    const effectiveDate =
      extractedData.header.effectiveDate || new Date().toISOString().split("T")[0];
    const materialType = extractedData.header.materialType || "Finished Good";
    const packDescription = extractedData.header.packDescription || "";

    // 4. Match Lines to Catalogue
    const tests: TestItem[] = [];

    for (const [index, line] of extractedData.rows.entries()) {
      if (!line.rawTestCode && !line.rawDescription) continue;

      const match = matchCatalogue(line, catalogue);

      const baseTestCode = match?.entry.testCode || line.rawTestCode || `UNMATCHED-${index}`;

      // Determine Rules
      const { rule, min, max, textSpec } = interpretRule(line.rawLimit || line.rawTextSpec);

      const newItem: TestItem = {
        id: `imported-${index}-${Date.now()}`,
        order: (index + 1) * 10,
        matchStatus: match ? (match.confidence >= 95 ? "MATCHED" : "LOW_CONFIDENCE") : "UNMATCHED",
        confidenceScore: match ? match.confidence : 0,
        suggestions: (match && match.confidence >= 95) ? [] : findSuggestions(line, catalogue),

        analysis: match?.entry.analysis || line.rawDescription || "--- UNMATCHED ---",
        component: match?.entry.component || "---",
        testCode: baseTestCode,
        // Always keep raw description for context
        description: line.rawDescription || "",

        rule: rule,
        min: min,
        max: max,
        textSpec: textSpec,

        units: match?.entry.units || "-",
        category: match?.entry.category || "Uncategorized",
        reportedNameAnalysis: line.rawDescription || "",
        reportedNameComponent: "",
        cLitReference: line.rawReference || "",
        stage: line.rawStage || undefined,
      };

      tests.push(newItem);
    }

    const assignedTests = autoAssignComponents(tests, catalogue);
    console.log("FINAL TESTS ARRAY:", assignedTests);

    return {
      productCode,
      productName,
      materialType,
      version,
      effectiveDate,
      packDescription,
      tests: assignedTests,
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
      cMapUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDF_JS_VERSION}/cmaps/`,
      cMapPacked: true,
      standardFontDataUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDF_JS_VERSION}/standard_fonts/`,
    });

    const doc = await loadingTask.promise;
    let fullText = "";
    let useOCR = false;

    // Pass 1: Try Text Layer, preserving structure
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();

      if (!content.items || content.items.length === 0) {
        fullText += "\n\n"; // Add page break even for empty pages
        continue;
      }

      // Group text items by line based on their y-coordinate.
      const lines = new Map<number, any[]>();
      for (const item of content.items as any[]) {
        const y = Math.round(item.transform[5]);
        if (!lines.has(y)) {
          lines.set(y, []);
        }
        lines.get(y)!.push(item);
      }

      const sortedYCoords = Array.from(lines.keys()).sort((a, b) => b - a);

      const pageLines: string[] = [];
      for (const y of sortedYCoords) {
        const lineItems = lines.get(y)!;
        lineItems.sort((a, b) => a.transform[4] - b.transform[4]);
        pageLines.push(lineItems.map((item) => item.str).join("   "));
      }
      const pageText = pageLines.join("\n");

      if (pageText.trim().length < 50) {
        useOCR = true;
      }
      fullText += pageText + "\n\n";
    }

    // Pass 2: Fallback to OCR if text is missing or sparse
    if (useOCR || fullText.trim().length === 0) {
      console.log("Text layer missing or sparse. Falling back to OCR...");
      fullText = ""; // Reset to build from OCR

      const { createWorker } = await import(
        "https://cdn.jsdelivr.net/npm/tesseract.js@5.0.5/dist/tesseract.esm.min.js"
      );
      const worker = await createWorker("eng");

      for (let i = 1; i <= doc.numPages; i++) {
        const page = await doc.getPage(i);
        const viewport = page.getViewport({ scale: 2.0 });

        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        // FIX: The page.render method in newer pdf.js versions expects a `canvas` property
        // instead of `canvasContext`.
        await page.render({ canvas: canvas, viewport: viewport }).promise;

        const {
          data: { text },
        } = await worker.recognize(canvas);
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

async function callGeminiExtraction(
  textData: string,
  customInstruction?: string
): Promise<{ header: any; rows: ParsedLine[] } | null> {
  const model = "gemini-2.5-flash";

  let systemInstruction = `
    You are an expert LIMS Specification Parser. Your task is to meticulously extract structured data from unstructured text. You must follow the provided guidelines and schema precisely.

    **Primary Goal:** Analyze the text and extract product header information and a list of specification tests.

    **CRITICAL RULE: Always return a valid JSON object that matches the requested schema.**
    - If the input text does not appear to be a product specification, do your best to extract any relevant information that might fit the schema.
    - If you cannot find a specific field (e.g., 'productCode', 'version'), return an empty string "" for that field.
    - If you cannot identify any specification tests or rows, return an empty array [] for the 'rows' property.
    - **It is better to return an empty or partially filled JSON structure than to fail the parse.** Your primary objective is to avoid errors and always provide a structured response.

    --- DETAILED PARSING GUIDELINES (if applicable) ---

    **1. PRODUCT-LEVEL FIELDS (Header)**
    - Extract the following fields from the top part of the document:
    - \`productName\`: Taken from the header (e.g. “cap 1000IU”).
    - \`productCode\`: Find any code next to or under the product name. If there are multiple code fragments, concatenate them with a hyphen (e.g., "S", "H-CHB08001", "02" becomes "S-H-CHB08001-02").
    - \`materialType\`: Use the value from "Pharmaceutical Form" if given.
    - \`effectiveDate\`: Convert date exactly as written (e.g. “15-03-2022”).
    - \`packDescription\`: Copy the full pack description paragraph if available.

    **2. TEST ROW EXTRACTION & SPLITTING**
    - Your output must be an array of test rows.
    - Each numbered item (e.g., "1 - ...", "2- ...") is a base for one or more test rows.
    - **Critical Splitting Rule**: If a single numbered item contains multiple analytes/components OR separate "Release" and "Shelf" limits, you MUST create a separate JSON object (a distinct row) for each combination.
      - **Example 1 (Multiple Analytes)**: A test for "Assay by HPLC" with sub-items for "Cholecalciferol" and "Vitamin E acetate" must result in TWO separate rows.
      - **Example 2 (Multiple Stages)**: The "Assay by HPLC" test has "Release Limit" and "Shelf Limit" columns. This means for EACH analyte, you must create TWO rows: one for release and one for shelf.
        - The output for "Cholecalciferol" would be:
          1. A row with \`rawStage: "release"\` and its corresponding limit.
          2. A row with \`rawStage: "shelf"\` and its corresponding limit.
    - For each generated row:
      - \`rawDescription\`: Combine the main test name with the specific sub-item/analyte name. (e.g., "Assay by HPLC of Cholecalciferol").
      - \`rawStage\`: Set to "release" or "shelf" if specified. If not mentioned, omit this field.
      - \`rawLimit\` or \`rawTextSpec\`: Extract the corresponding limit for that specific analyte and stage.
      - \`rawReference\`: Extract any pharmacopeial reference for that test. The reference may apply to all sub-items.

    **3. LIMIT & SPECIFICATION EXTRACTION**
    - You must distinguish between numeric limits and textual specifications.
    - \`rawLimit\`: Use for numeric specs. Capture the full text. Examples: "150 mg ± 10%", "Not more than 15 min", "Not less than 80% (Q)", "95% - 110%", "NMT 3000 cfu/gm".
    - \`rawTextSpec\`: Use for textual specs. Examples: "Positive", "Absent", "As per actual product description", "Light grey body and ivory cap...".
    - \`rawReference\`: Capture any text that looks like a reference from columns or text next to the spec. Examples: "BP appendix XII C", "USP general monograph <905>", "According to FDA", "USP 44".

    **4. TEST CODE GENERATION**
    - \`rawTestCode\`: If a short code is present, use it. Otherwise, create a logical abbreviation from the description (e.g., "Disintegration Time" -> "DISINT"). For split sub-items, you can append a suffix (e.g., "ASSAY-CHOL", "ASSAY-VITE").

    Return ONLY the final JSON object that adheres to the provided schema. Do not add any commentary or introductory text.
  `;

  if (customInstruction) {
    systemInstruction += `\n\nIMPORTANT - CUSTOM PARSING INSTRUCTIONS PROVIDED BY USER:\n${customInstruction}\n\nFollow these custom instructions strictly to locate fields and headers.`;
  }

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: `Extract the specification data from this text:\n\n${textData}`,
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
                packDescription: { type: Type.STRING },
              },
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
                  rawReference: { type: Type.STRING },
                  rawStage: { type: Type.STRING },
                },
              },
            },
          },
        },
      },
    });

    if (response.text) {
      // Robust JSON parsing: clean the response text to remove potential markdown fences
      let cleanedText = response.text.trim();
      const jsonRegex = /```(json)?\s*([\s\S]*?)\s*```/;
      const match = cleanedText.match(jsonRegex);
      if (match && match[2]) {
        cleanedText = match[2];
      }

      try {
        const parsed = JSON.parse(cleanedText);
        // Basic sanity check
        if (!parsed.header || !Array.isArray(parsed.rows)) {
          console.warn("Gemini JSON does not match expected shape:", parsed);
        }
        return parsed;
      } catch (jsonError) {
        console.error("Failed to parse JSON from Gemini response even after cleaning.", jsonError);
        console.error("Original raw text from Gemini:", response.text);
        console.error("Cleaned text that failed parsing:", cleanedText);
        return null;
      }
    }
    
    console.error("Gemini returned no text payload for structured output", response);
    return null;

  } catch (e) {
    console.error("Gemini API Error", e);
    return null;
  }
}

// --- Advanced Matching Logic ---

function normalizeBase(str: string): string {
  return str
    .toLowerCase()
    .replace(/\([^)]*\)/g, " ")        // remove (...) content
    .replace(/[^a-z0-9\s]/g, " ")      // remove punctuation
    .replace(/\s+/g, " ")              // collapse spaces
    .trim();
}

function tokenize(str: string): string[] {
  return normalizeBase(str)
    .split(" ")
    .filter(Boolean);
}

function jaccardSimilarity(aTokens: string[], bTokens: string[]): number {
  const aSet = new Set(aTokens);
  const bSet = new Set(bTokens);
  let intersection = 0;

  for (const t of aSet) {
    if (bSet.has(t)) intersection++;
  }
  const union = aSet.size + bSet.size - intersection;
  if (union === 0) return 0;
  return intersection / union;
}

function buildLineCandidates(line: ParsedLine): string[] {
  const rawDesc = line.rawDescription || "";
  const rawCode = line.rawTestCode || "";

  const candidates = new Set<string>();

  if (rawDesc) {
    candidates.add(normalizeBase(rawDesc));

    // if there's a " - " use the part after dash as a strong cue
    const dashParts = rawDesc.split(" - ");
    if (dashParts.length > 1) {
      candidates.add(normalizeBase(dashParts[dashParts.length - 1]));
    }

    // add content inside parentheses as extra hints
    const parenMatches = rawDesc.match(/\(([^)]+)\)/g);
    if (parenMatches) {
      for (const m of parenMatches) {
        candidates.add(normalizeBase(m.replace(/[()]/g, "")));
      }
    }
  }

  if (rawCode) {
    candidates.add(normalizeBase(rawCode));
  }

  return Array.from(candidates).filter(Boolean);
}

function buildEntryCandidates(entry: CatalogueEntry): string[] {
  const candidates = new Set<string>();

  if (entry.testCode) candidates.add(normalizeBase(entry.testCode));
  if (entry.analysis) candidates.add(normalizeBase(entry.analysis));

  if (entry.synonyms) {
    for (const s of entry.synonyms.split(",")) {
      if (s.trim()) candidates.add(normalizeBase(s));
    }
  }

  return Array.from(candidates).filter(Boolean);
}

function matchCatalogue(
  line: ParsedLine,
  catalogue: CatalogueEntry[]
): { entry: CatalogueEntry; confidence: number } | null {
  const lineCandidates = buildLineCandidates(line);
  if (lineCandidates.length === 0) return null;

  let best: { entry: CatalogueEntry; confidence: number } | null = null;

  for (const entry of catalogue) {
    const entryCandidates = buildEntryCandidates(entry);
    if (entryCandidates.length === 0) continue;

    let maxScoreForEntry = 0;

    // check all combinations
    for (const l of lineCandidates) {
      for (const e of entryCandidates) {
        // exact match
        if (l === e && l.length > 0) {
          maxScoreForEntry = Math.max(maxScoreForEntry, 1);
          continue;
        }

        // fallback: Jaccard on tokens
        const score = jaccardSimilarity(tokenize(l), tokenize(e));
        if (score > maxScoreForEntry) {
          maxScoreForEntry = score;
        }
      }
    }

    // Translate similarity → confidence
    let confidence = 0;
    if (maxScoreForEntry >= 0.9) confidence = 100;      // almost identical
    else if (maxScoreForEntry >= 0.75) confidence = 95; // very strong
    else if (maxScoreForEntry >= 0.6) confidence = 85;  // good
    else if (maxScoreForEntry >= 0.4) confidence = 70;  // weak but usable

    if (confidence > 0 && (!best || confidence > best.confidence)) {
      best = { entry, confidence };
    }
  }

  // Return the best match found, even if confidence is low.
  // The calling function will handle the status (e.g., LOW_CONFIDENCE).
  return best;
}

function findSuggestions(
  line: ParsedLine,
  catalogue: CatalogueEntry[]
): Pick<CatalogueEntry, "id" | "analysis" | "testCode">[] {
  const lineCandidates = buildLineCandidates(line);
  const scored: { entry: CatalogueEntry; score: number }[] = [];

  for (const entry of catalogue) {
    const entryCandidates = buildEntryCandidates(entry);
    if (!entryCandidates.length) continue;

    let maxScoreForEntry = 0;
    for (const l of lineCandidates) {
      for (const e of entryCandidates) {
        const score = jaccardSimilarity(tokenize(l), tokenize(e));
        if (score > maxScoreForEntry) maxScoreForEntry = score;
      }
    }

    if (maxScoreForEntry > 0.3) {
      scored.push({ entry, score: maxScoreForEntry });
    }
  }

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(({ entry }) => ({
      id: entry.id,
      analysis: entry.analysis,
      testCode: entry.testCode,
    }));
}


// Make rawLimit optional so call site is type-safe.
function interpretRule(rawLimit?: string): {
  rule: string;
  min: string;
  max: string;
  textSpec: string;
} {
  let rule = "N/A";
  let min = "";
  let max = "";
  let textSpec = "";

  if (!rawLimit) return { rule, min, max, textSpec };

  const clean = rawLimit.trim();
  const lower = clean.toLowerCase();

  // Logic for "X ± Y%"
  const toleranceMatch = clean.match(/(-?\d+(\.\d+)?)\s*(mg)?\s*±\s*(-?\d+(\.\d+)?)\s*%/);
  if (toleranceMatch) {
    const centralValue = parseFloat(toleranceMatch[1]);
    const percentage = parseFloat(toleranceMatch[4]);
    if (!isNaN(centralValue) && !isNaN(percentage)) {
      rule = "Range";
      min = (centralValue * (1 - percentage / 100)).toFixed(2);
      max = (centralValue * (1 + percentage / 100)).toFixed(2);
      return { rule, min, max, textSpec };
    }
  }

  // Existing Numeric Rules
  if (lower.match(/nmt|not more than|<=|<|^max/)) {
    const num = clean.match(/-?\d+(\.\d+)?/);
    if (num) {
      rule = "Max";
      max = num[0];
    }
  } else if (lower.match(/nlt|not less than|>=|>|^min/)) {
    const num = clean.match(/-?\d+(\.\d+)?/);
    if (num) {
      rule = "Min";
      min = num[0];
    }
  } else if (clean.match(/\d+(\.\d+)?\s*[-–to]\s*\d+(\.\d+)?/)) {
    const nums = clean.match(/-?\d+(\.\d+)?/g);
    if (nums && nums.length >= 2) {
      rule = "Range";
      min = nums[0];
      max = nums[1];
    }
  } else if (lower.match(/equal to/)) {
    const num = clean.match(/-?\d+(\.\d+)?/);
    if (num) {
      rule = "Equal";
      min = num[0];
    }
  } else {
    rule = "Text";
    textSpec = clean;
  }

  // Fallback check: if a numeric rule was matched but no numbers were extracted, treat as text.
  if (
    ((rule === "Min" || rule === "Equal") && !min) ||
    (rule === "Max" && !max) ||
    (rule === "Range" && (!min || !max))
  ) {
    rule = "Text";
    textSpec = clean;
    min = "";
    max = "";
  }

  return { rule, min, max, textSpec };
}


// --- Component Auto-Assignment Logic ---

function normalizeAnalysis(name: string): string {
  return name.trim().toUpperCase();
}

function groupCatalogueByAnalysis(catalogue: CatalogueEntry[]) {
  const map: Record<string, CatalogueEntry[]> = {};
  for (const entry of catalogue) {
    const key = normalizeAnalysis(entry.analysis);
    if (!map[key]) map[key] = [];
    map[key].push(entry);
  }
  return map;
}

export function autoAssignComponents(
  tests: TestItem[],
  catalogue: CatalogueEntry[]
): TestItem[] {
  const byAnalysis = groupCatalogueByAnalysis(catalogue);
  const usedByAnalysis: Record<string, Set<string>> = {};

  return tests.map((test) => {
    const key = normalizeAnalysis(test.analysis || "");
    const candidates = byAnalysis[key] || [];

    if (!key || candidates.length <= 1) { // Only run for analyses with multiple component options
      return test;
    }

    if (!usedByAnalysis[key]) {
      usedByAnalysis[key] = new Set();
    }
    const used = usedByAnalysis[key];

    // If this test already has a valid component, respect it and mark as used
    if (test.component && test.component !== '---') {
      const isKnownComponent = candidates.some(c => c.component === test.component);
      if (isKnownComponent) {
        used.add(test.component);
        return test;
      }
    }

    // Pick first candidate whose component is not used yet
    let chosen = candidates.find((c) => !used.has(c.component));

    // If all components are used, reuse the first one
    if (!chosen) {
      chosen = candidates[0];
    }

    if (chosen) {
      used.add(chosen.component);
      return {
        ...test,
        testCode: chosen.testCode,
        component: chosen.component,
        units: chosen.units,
        category: chosen.category,
      };
    }

    return test;
  });
}