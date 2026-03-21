import Tesseract from 'tesseract.js';

// ============================================================================
// OCR Engine — Browser-side text extraction using Tesseract.js (WASM)
// No external API needed. Runs entirely in the user's browser.
// ============================================================================

export interface OcrResult {
  text: string;
  confidence: number;
  lines: OcrLine[];
  processingTimeMs: number;
}

export interface OcrLine {
  text: string;
  confidence: number;
  bbox: { x0: number; y0: number; x1: number; y1: number };
}

/**
 * Extract text from an image file using Tesseract.js (WASM).
 * Supports: JPG, PNG, BMP, TIFF, WebP
 * Languages: French + English
 */
export async function extractTextFromImage(
  file: File,
  onProgress?: (progress: number, status: string) => void
): Promise<OcrResult> {
  const startTime = Date.now();

  onProgress?.(0, 'Initialisation du moteur OCR...');

  const worker = await Tesseract.createWorker('fra+eng', 1, {
    logger: (m) => {
      if (m.status === 'recognizing text') {
        onProgress?.(Math.round((m.progress || 0) * 100), 'Lecture du document...');
      } else if (m.status === 'loading language traineddata') {
        onProgress?.(10, 'Chargement du modele de langue...');
      }
    },
  });

  onProgress?.(20, 'Analyse du document...');

  const { data } = await worker.recognize(file);

  await worker.terminate();

  const processingTimeMs = Date.now() - startTime;

  onProgress?.(100, 'Terminé');

  return {
    text: data.text,
    confidence: data.confidence / 100,
    lines: ((data as unknown as { lines: { text: string; confidence: number; bbox: { x0: number; y0: number; x1: number; y1: number } }[] }).lines || []).map((line: { text: string; confidence: number; bbox: { x0: number; y0: number; x1: number; y1: number } }) => ({
      text: line.text.trim(),
      confidence: line.confidence / 100,
      bbox: line.bbox,
    })),
    processingTimeMs,
  };
}

/**
 * Extract text from a PDF file.
 * For text-based PDFs: extracts text directly using pdf.js-like approach.
 * For scanned PDFs: converts pages to images then OCRs them.
 */
export async function extractTextFromPdf(
  file: File,
  onProgress?: (progress: number, status: string) => void
): Promise<OcrResult> {
  const startTime = Date.now();

  onProgress?.(0, 'Lecture du PDF...');

  // Read file as ArrayBuffer
  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);

  // Try to extract text from PDF streams (text-based PDF)
  const directText = extractPdfText(bytes);

  if (directText.length > 100) {
    // PDF has extractable text — no OCR needed
    onProgress?.(100, 'Texte extrait directement du PDF');

    return {
      text: directText,
      confidence: 0.95, // High confidence for direct text extraction
      lines: directText.split('\n').filter(l => l.trim()).map(text => ({
        text: text.trim(),
        confidence: 0.95,
        bbox: { x0: 0, y0: 0, x1: 0, y1: 0 },
      })),
      processingTimeMs: Date.now() - startTime,
    };
  }

  // PDF is likely scanned — convert to image and OCR
  onProgress?.(10, 'PDF scanne detecte — conversion en image...');

  // Convert PDF to image using canvas (requires pdf.js or similar)
  // For now, we'll pass the PDF file directly to Tesseract which can handle PDFs
  const worker = await Tesseract.createWorker('fra+eng', 1, {
    logger: (m) => {
      if (m.status === 'recognizing text') {
        onProgress?.(30 + Math.round((m.progress || 0) * 60), 'OCR en cours...');
      }
    },
  });

  onProgress?.(25, 'Demarrage OCR...');

  // Tesseract.js can process PDF files directly if they contain images
  const { data } = await worker.recognize(file);

  await worker.terminate();

  onProgress?.(100, 'Terminé');

  return {
    text: data.text,
    confidence: data.confidence / 100,
    lines: ((data as unknown as { lines: { text: string; confidence: number; bbox: { x0: number; y0: number; x1: number; y1: number } }[] }).lines || []).map((line: { text: string; confidence: number; bbox: { x0: number; y0: number; x1: number; y1: number } }) => ({
      text: line.text.trim(),
      confidence: line.confidence / 100,
      bbox: line.bbox,
    })),
    processingTimeMs: Date.now() - startTime,
  };
}

/**
 * Direct text extraction from PDF binary (no OCR).
 * Parses PDF stream objects to find text content.
 */
function extractPdfText(bytes: Uint8Array): string {
  const decoder = new TextDecoder('latin1');
  const content = decoder.decode(bytes);
  const textParts: string[] = [];

  // Find all text between BT (Begin Text) and ET (End Text) operators
  const btEtRegex = /BT\s([\s\S]*?)ET/g;
  let match;

  while ((match = btEtRegex.exec(content)) !== null) {
    const textBlock = match[1];

    // Extract strings from Tj operator: (text) Tj
    const tjRegex = /\(([^)]*)\)\s*Tj/g;
    let tjMatch;
    while ((tjMatch = tjRegex.exec(textBlock)) !== null) {
      const text = decodePdfString(tjMatch[1]);
      if (text.trim()) textParts.push(text);
    }

    // Extract strings from TJ operator: [(text) num (text)] TJ
    const tjArrayRegex = /\[(.*?)\]\s*TJ/g;
    let tjArrMatch;
    while ((tjArrMatch = tjArrayRegex.exec(textBlock)) !== null) {
      const arrContent = tjArrMatch[1];
      const strRegex = /\(([^)]*)\)/g;
      let strMatch;
      let lineText = '';
      while ((strMatch = strRegex.exec(arrContent)) !== null) {
        lineText += decodePdfString(strMatch[1]);
      }
      if (lineText.trim()) textParts.push(lineText);
    }

    // Extract strings from ' operator (move to next line and show)
    const quoteRegex = /\(([^)]*)\)\s*'/g;
    let quoteMatch;
    while ((quoteMatch = quoteRegex.exec(textBlock)) !== null) {
      const text = decodePdfString(quoteMatch[1]);
      if (text.trim()) textParts.push(text);
    }
  }

  return textParts.join('\n');
}

/**
 * Decode PDF string escape sequences.
 */
function decodePdfString(raw: string): string {
  return raw
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t')
    .replace(/\\\(/g, '(')
    .replace(/\\\)/g, ')')
    .replace(/\\\\/g, '\\');
}

/**
 * Parse transactions from OCR'd text.
 * Detects dates, amounts, references, and counterparties.
 */
export function parseTransactionsFromText(text: string): ParsedOcrTransaction[] {
  const transactions: ParsedOcrTransaction[] = [];
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 5);

  const datePattern = /(\d{2}[/\-\.]\d{2}[/\-\.]\d{2,4})/;
  const amountPattern = /([\d\s]{1,3}(?:[\s.]\d{3})*(?:[,\.]\d{2})?)\s*(?:FCFA|XOF|F\s*CFA)?/i;

  for (const line of lines) {
    const dateMatch = line.match(datePattern);
    if (!dateMatch) continue;

    // Extract and normalize date
    const rawDate = dateMatch[1];
    const dateParts = rawDate.split(/[/\-\.]/);
    if (dateParts.length < 3) continue;

    const day = dateParts[0].padStart(2, '0');
    const month = dateParts[1].padStart(2, '0');
    const year = dateParts[2].length === 2 ? '20' + dateParts[2] : dateParts[2];
    const isoDate = `${year}-${month}-${day}`;

    // Extract amount
    const afterDate = line.substring(dateMatch.index! + dateMatch[0].length);
    const amtMatch = afterDate.match(amountPattern);
    if (!amtMatch) continue;

    const rawAmount = amtMatch[1].replace(/\s/g, '').replace(/\./g, '').replace(',', '.');
    const amount = parseFloat(rawAmount);
    if (isNaN(amount) || amount === 0) continue;

    // Determine sign
    const isDebit = /debit|dbt|sortie|prlv|retrait|paiement/i.test(line);
    const signedAmount = isDebit ? -Math.abs(amount) : Math.abs(amount);

    // Extract description
    let desc = line
      .replace(datePattern, '')
      .replace(amountPattern, '')
      .replace(/\s+/g, ' ')
      .trim();
    if (!desc) desc = 'Transaction';

    transactions.push({
      date: isoDate,
      amount: Math.round(signedAmount * 100), // centimes
      description: desc.substring(0, 200),
      confidence: 0.75,
      rawLine: line,
    });
  }

  return transactions;
}

export interface ParsedOcrTransaction {
  date: string;
  amount: number; // centimes
  description: string;
  confidence: number;
  rawLine: string;
}
