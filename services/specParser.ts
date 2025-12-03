import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';

export interface ExtractedTest {
  name: string;
  text: string;
  min: string;
  max: string;
  unit: string;
}

export interface ParsedSpecDocument {
  productName: string;
  productCode: string;
  effectiveDate: string;
  extractedTests: ExtractedTest[];
}

GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.js', import.meta.url).toString();

export async function extractTextFromPdf(file: File): Promise<string> {
  const base64Text = await extractTextWithGemini(file);
  if (base64Text) {
    return base64Text;
  }
  return extractTextWithPdfJs(file);
}

async function extractTextWithGemini(file: File): Promise<string | null> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  try {
    const base64 = await readFileAsBase64(file);
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: 'Extract OCR text from this PDF. Return the clean text only, no formatting or additional narration.' },
              { inlineData: { data: base64, mimeType: file.type || 'application/pdf' } },
            ],
          },
        ],
        generationConfig: {
          temperature: 0,
        },
      }),
    });

    if (!response.ok) {
      console.warn('Gemini OCR request failed', await response.text());
      return null;
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text).filter(Boolean).join(' ');
    return text ? cleanExtractedText(text) : null;
  } catch (error) {
    console.warn('Gemini OCR error', error);
    return null;
  }
}

async function extractTextWithPdfJs(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const pdf = await getDocument({ data: new Uint8Array(buffer) }).promise;
  let text = '';

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum += 1) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    const strings = content.items
      .map(item => ('str' in item ? (item as { str: string }).str : ''))
      .join(' ');
    text += `${strings}\n`;
  }

  return cleanExtractedText(text);
}

function cleanExtractedText(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .replace(/[^\x20-\x7E]+/g, ' ')
    .trim();
}

async function readFileAsBase64(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = '';
  bytes.forEach(b => { binary += String.fromCharCode(b); });
  return btoa(binary);
}

export function parseSpecDocument(rawText: string): ParsedSpecDocument {
  const normalizedText = rawText.replace(/\s+/g, ' ');
  const productName = findValue(normalizedText, /(Product\s*Name|Material):\s*([^;]+)/i);
  const productCode = findValue(normalizedText, /(Product\s*(Code|ID|Number)):\s*([^;]+)/i);
  const effectiveDate = findValue(normalizedText, /(Effective\s*Date|Revision\s*Date):\s*([\d\-\/\.]+)/i);

  const extractedTests = extractTests(normalizedText);

  return {
    productName: productName || '',
    productCode: productCode || '',
    effectiveDate: effectiveDate || '',
    extractedTests,
  };
}

function findValue(text: string, pattern: RegExp): string | null {
  const match = text.match(pattern);
  if (!match) return null;
  const value = match[2] || match[3] || '';
  return value.trim();
}

function extractTests(text: string): ExtractedTest[] {
  const tests: ExtractedTest[] = [];
  const candidateLines = text.split(/(?<=[.;])/).map(segment => segment.trim()).filter(Boolean);

  candidateLines.forEach(segment => {
    if (/product\s*(name|code|id|number|material)/i.test(segment)) return;
    const [namePart, detailPart] = segment.split(/:\s*/, 2);
    if (!detailPart || !namePart) return;

    const minMax = getRange(detailPart);
    const unit = detectUnit(detailPart);

    tests.push({
      name: namePart.trim(),
      text: detailPart.trim(),
      min: minMax.min,
      max: minMax.max,
      unit,
    });
  });

  return tests;
}

function getRange(detail: string): { min: string; max: string } {
  const rangeMatch = detail.match(/(\d+(?:\.\d+)?)\s*(?:to|-|–|—)\s*(\d+(?:\.\d+)?)/i);
  if (rangeMatch) {
    return { min: rangeMatch[1], max: rangeMatch[2] };
  }

  const minMatch = detail.match(/(minimum|min|>=|greater than|not less than)\s*(\d+(?:\.\d+)?)/i);
  const maxMatch = detail.match(/(maximum|max|<=|less than|not more than)\s*(\d+(?:\.\d+)?)/i);

  return { min: minMatch ? minMatch[2] : '', max: maxMatch ? maxMatch[2] : '' };
}

function detectUnit(detail: string): string {
  const unitMatch = detail.match(/\d+(?:\.\d+)?\s*([a-zA-Z%µ\/]+)\b/);
  return unitMatch ? unitMatch[1] : '';
}
