import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createServiceClient, extractContext, type TenantContext } from '../_shared/supabase-client.ts'
import { jsonResponse, errorResponse, corsResponse } from '../_shared/response.ts'
import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ============================================================================
// PDF & Image Bank Statement Parser
// Extracts transactions from PDF text or OCR'd image text
// ============================================================================

interface ParsePdfInput {
  account_id: string
  file_content: string  // base64 encoded
  file_name: string
  file_type: 'pdf' | 'image'
  tenant_id?: string
  company_id?: string
}

interface ParsedTransaction {
  transaction_date: string
  value_date: string | null
  amount: number
  reference: string | null
  description: string
  counterparty_name: string | null
  counterparty_account: string | null
  balance_after: number | null
}

// ============================================================================
// PDF TEXT EXTRACTION (pure Deno — no external library)
// ============================================================================

function extractTextFromPdf(base64Content: string): string {
  // Decode base64 to binary
  const binary = atob(base64Content)

  // Simple PDF text extraction:
  // PDF stores text in streams between BT (Begin Text) and ET (End Text)
  // Text operators: Tj (show string), TJ (show array), ' (next line + show)
  const textParts: string[] = []

  // Extract all text strings from PDF
  // Look for parenthesized strings and hex strings
  let i = 0
  while (i < binary.length) {
    // Find stream content
    if (binary.substring(i, i + 6) === 'stream') {
      const streamEnd = binary.indexOf('endstream', i)
      if (streamEnd > i) {
        const streamContent = binary.substring(i + 7, streamEnd)

        // Extract text between parentheses (PDF string literals)
        let j = 0
        while (j < streamContent.length) {
          if (streamContent[j] === '(') {
            let depth = 1
            let str = ''
            j++
            while (j < streamContent.length && depth > 0) {
              if (streamContent[j] === '(' && streamContent[j - 1] !== '\\') depth++
              else if (streamContent[j] === ')' && streamContent[j - 1] !== '\\') depth--
              if (depth > 0) str += streamContent[j]
              j++
            }
            if (str.trim()) textParts.push(str.trim())
          }
          j++
        }
        i = streamEnd
      }
    }
    i++
  }

  return textParts.join('\n')
}

// ============================================================================
// OCR SIMULATION FOR IMAGES
// Uses Supabase Storage + external OCR API if configured
// Falls back to returning instructions for manual entry
// ============================================================================

async function extractTextFromImage(
  base64Content: string,
  supabase: SupabaseClient
): Promise<{ text: string; confidence: number; method: string }> {
  // Check if external OCR API is configured
  const ocrApiUrl = Deno.env.get('OCR_API_URL')
  const ocrApiKey = Deno.env.get('OCR_API_KEY')

  if (ocrApiUrl && ocrApiKey) {
    // Call external OCR service (Google Vision, AWS Textract, Tesseract API, etc.)
    try {
      const response = await fetch(ocrApiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ocrApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: base64Content,
          language: 'fra', // French
          output_format: 'text',
        }),
      })

      if (response.ok) {
        const result = await response.json()
        return {
          text: result.text || result.extracted_text || '',
          confidence: result.confidence || 0.75,
          method: 'external_ocr',
        }
      }
    } catch (err) {
      console.error('OCR API error:', err)
    }
  }

  // Fallback: Store image in Supabase Storage for manual processing
  const filePath = `ocr-queue/${Date.now()}_statement.jpg`
  await supabase.storage
    .from('documents')
    .upload(filePath, Uint8Array.from(atob(base64Content), c => c.charCodeAt(0)), {
      contentType: 'image/jpeg',
    })

  return {
    text: '',
    confidence: 0,
    method: 'manual_required',
  }
}

// ============================================================================
// INTELLIGENT TRANSACTION LINE PARSER
// Parses raw text into structured transactions using pattern matching
// ============================================================================

function parseTransactionLines(text: string): ParsedTransaction[] {
  const transactions: ParsedTransaction[] = []
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0)

  // Common date patterns in bank statements
  const datePatterns = [
    /(\d{2}[/\-\.]\d{2}[/\-\.]\d{4})/, // DD/MM/YYYY
    /(\d{2}[/\-\.]\d{2}[/\-\.]\d{2})/, // DD/MM/YY
    /(\d{4}[/\-\.]\d{2}[/\-\.]\d{2})/, // YYYY/MM/DD
  ]

  // Amount patterns (with FCFA context — no decimal typically, space separators)
  const amountPatterns = [
    /([+-]?\s*[\d\s]{1,3}(?:[\s.]\d{3})*(?:[,\.]\d{2})?)\s*(?:FCFA|XOF|F\s*CFA)?/i,
    /(?:DEBIT|CREDIT|D|C)\s*:?\s*([\d\s.,]+)/i,
  ]

  for (const line of lines) {
    // Try to find a date in the line
    let txDate: string | null = null
    for (const pattern of datePatterns) {
      const match = line.match(pattern)
      if (match) {
        txDate = normalizeDate(match[1])
        break
      }
    }

    if (!txDate) continue // Skip lines without dates

    // Try to extract amount
    let amount: number | null = null
    const remainingAfterDate = line.replace(datePatterns[0], '').replace(datePatterns[1], '')

    for (const pattern of amountPatterns) {
      const match = remainingAfterDate.match(pattern)
      if (match) {
        const raw = match[1].replace(/\s/g, '').replace(/\./g, '').replace(',', '.')
        const parsed = parseFloat(raw)
        if (!isNaN(parsed) && parsed !== 0) {
          amount = Math.round(parsed * 100) // Convert to centimes
          break
        }
      }
    }

    if (amount === null) continue // Skip lines without amounts

    // Determine sign (debit/credit)
    const isDebit = /debit|dbt|sortie|prlv|vir\s*em|paiement|retrait/i.test(line)
    const isCredit = /credit|cdt|entree|versement|remise|encaissement/i.test(line)
    if (isDebit && amount > 0) amount = -amount
    if (isCredit && amount < 0) amount = -amount

    // Extract description (everything that's not date or amount)
    let description = line
    // Remove date
    for (const p of datePatterns) { description = description.replace(p, '') }
    // Remove amount
    for (const p of amountPatterns) { description = description.replace(p, '') }
    description = description.replace(/\s+/g, ' ').trim()
    if (!description) description = 'Transaction'

    // Try to extract reference
    const refMatch = description.match(/(?:REF|N°|NO|NUM)\s*:?\s*([A-Z0-9\-\/]+)/i)
    const reference = refMatch ? refMatch[1] : null

    // Try to extract counterparty (capitalized words)
    const cpMatch = description.match(/(?:DE|A|VERS|FROM|TO)\s+([A-Z][A-Z\s]{3,})/i)
    const counterparty = cpMatch ? cpMatch[1].trim() : null

    // Try to extract balance
    let balanceAfter: number | null = null
    const balMatch = line.match(/(?:SOLDE|SOLD|BAL)\s*:?\s*([\d\s.,]+)/i)
    if (balMatch) {
      const balRaw = balMatch[1].replace(/\s/g, '').replace(/\./g, '').replace(',', '.')
      balanceAfter = Math.round(parseFloat(balRaw) * 100)
    }

    transactions.push({
      transaction_date: txDate,
      value_date: null,
      amount,
      reference,
      description: description.substring(0, 200),
      counterparty_name: counterparty,
      counterparty_account: null,
      balance_after: isNaN(balanceAfter!) ? null : balanceAfter,
    })
  }

  return transactions
}

function normalizeDate(raw: string): string {
  const parts = raw.split(/[/\-\.]/)
  if (parts.length < 3) return raw

  let day: string, month: string, year: string

  if (parts[0].length === 4) {
    // YYYY/MM/DD
    year = parts[0]
    month = parts[1].padStart(2, '0')
    day = parts[2].padStart(2, '0')
  } else {
    // DD/MM/YYYY or DD/MM/YY
    day = parts[0].padStart(2, '0')
    month = parts[1].padStart(2, '0')
    year = parts[2].length === 2 ? '20' + parts[2] : parts[2]
  }

  return `${year}-${month}-${day}`
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function executePdfParse(
  supabase: SupabaseClient,
  ctx: TenantContext,
  input: ParsePdfInput
): Promise<Record<string, unknown>> {
  let rawText = ''
  let ocrConfidence = 1.0
  let extractionMethod = 'pdf_text'

  if (input.file_type === 'pdf') {
    // Extract text from PDF
    rawText = extractTextFromPdf(input.file_content)

    if (!rawText || rawText.length < 50) {
      // PDF might be scanned (image-based) — try OCR
      const ocr = await extractTextFromImage(input.file_content, supabase)
      rawText = ocr.text
      ocrConfidence = ocr.confidence
      extractionMethod = ocr.method

      if (ocr.method === 'manual_required') {
        return {
          status: 'ocr_required',
          message: 'Ce PDF semble etre une image scannee. Le fichier a ete stocke pour traitement manuel.',
          file_name: input.file_name,
          extraction_method: extractionMethod,
          suggestions: [
            'Demandez a votre banque un releve au format MT940 ou CSV',
            'Utilisez un outil OCR externe puis importez le resultat en CSV',
            'Saisissez les transactions manuellement dans CashPilot',
          ],
        }
      }
    }
  } else if (input.file_type === 'image') {
    // OCR the image
    const ocr = await extractTextFromImage(input.file_content, supabase)
    rawText = ocr.text
    ocrConfidence = ocr.confidence
    extractionMethod = ocr.method

    if (ocr.method === 'manual_required') {
      return {
        status: 'ocr_required',
        message: 'L\'image a ete stockee pour traitement. Configurez un service OCR pour l\'extraction automatique.',
        file_name: input.file_name,
        extraction_method: extractionMethod,
      }
    }
  }

  // Parse the extracted text into transactions
  const transactions = parseTransactionLines(rawText)

  if (transactions.length === 0) {
    return {
      status: 'no_transactions',
      message: 'Aucune transaction n\'a pu etre extraite du fichier. Le texte extrait est peut-etre insuffisant ou dans un format non reconnu.',
      file_name: input.file_name,
      extraction_method: extractionMethod,
      ocr_confidence: ocrConfidence,
      raw_text_length: rawText.length,
      raw_text_preview: rawText.substring(0, 500),
      suggestions: [
        'Verifiez que le fichier est un releve bancaire',
        'Essayez avec un format MT940 ou CSV si disponible',
        'Utilisez le template CashPilot pour saisir manuellement',
      ],
    }
  }

  // Store in database (same flow as parse-bank-statement)
  const { data: statement, error: stmtError } = await supabase
    .from('bank_statements')
    .insert({
      tenant_id: ctx.tenant_id,
      company_id: ctx.company_id,
      account_id: input.account_id,
      file_name: input.file_name,
      format: input.file_type,
      period_start: transactions[0].transaction_date,
      period_end: transactions[transactions.length - 1].transaction_date,
      transaction_count: transactions.length,
      matched_count: 0,
      unmatched_count: transactions.length,
      status: 'processing',
    })
    .select('id')
    .single()

  if (stmtError) throw stmtError

  // Insert transactions
  const txRows = transactions.map(tx => ({
    tenant_id: ctx.tenant_id,
    company_id: ctx.company_id,
    statement_id: statement.id,
    account_id: input.account_id,
    transaction_date: tx.transaction_date,
    value_date: tx.value_date,
    amount: tx.amount,
    currency: 'XOF',
    reference: tx.reference,
    description: tx.description,
    counterparty_name: tx.counterparty_name,
    counterparty_account: tx.counterparty_account,
    balance_after: tx.balance_after,
    match_status: 'unmatched',
  }))

  const { error: txError } = await supabase
    .from('bank_transactions')
    .insert(txRows)

  if (txError) throw txError

  await supabase
    .from('bank_statements')
    .update({ status: 'completed' })
    .eq('id', statement.id)

  return {
    status: 'success',
    statement_id: statement.id,
    file_name: input.file_name,
    file_type: input.file_type,
    extraction_method: extractionMethod,
    ocr_confidence: ocrConfidence,
    transaction_count: transactions.length,
    period_start: transactions[0].transaction_date,
    period_end: transactions[transactions.length - 1].transaction_date,
    needs_review: ocrConfidence < 0.9,
    review_message: ocrConfidence < 0.9
      ? `Confiance OCR : ${Math.round(ocrConfidence * 100)}% — veuillez verifier les transactions extraites`
      : null,
  }
}

// ============================================================================
// SERVE
// ============================================================================

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return corsResponse()

  try {
    const supabase = createServiceClient()
    const body = await req.json() as ParsePdfInput

    if (!body.account_id || !body.file_content || !body.file_type) {
      return errorResponse('Missing required fields: account_id, file_content, file_type', 400)
    }

    const ctx = await extractContext(req, supabase, body)
    const result = await executePdfParse(supabase, ctx, body)
    return jsonResponse(result)

  } catch (err) {
    console.error('parse-bank-pdf error:', err)
    return errorResponse((err as Error).message)
  }
})
