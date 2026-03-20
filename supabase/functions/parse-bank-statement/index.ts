import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createServiceClient, extractContext, type TenantContext } from '../_shared/supabase-client.ts'
import { jsonResponse, errorResponse, corsResponse } from '../_shared/response.ts'
import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ============================================================================
// TYPES
// ============================================================================

interface ParseInput {
  account_id: string
  file_content: string  // base64 encoded
  file_name: string
  format: 'mt940' | 'camt053' | 'csv' | 'excel'
  tenant_id?: string
  company_id?: string
  csv_config?: {
    delimiter: string
    date_column: number
    amount_column: number
    description_column: number
    reference_column?: number
    counterparty_column?: number
    balance_column?: number
    date_format: string
    skip_header: boolean
    decimal_separator: string
  }
}

interface ParsedTransaction {
  transaction_date: string
  value_date: string | null
  amount: number // centimes
  reference: string | null
  description: string
  counterparty_name: string | null
  counterparty_account: string | null
  transaction_type: string | null
  balance_after: number | null
}

// ============================================================================
// MT940 PARSER (SWIFT Standard)
// ============================================================================

function parseMT940(content: string): {
  transactions: ParsedTransaction[]
  opening_balance: number | null
  closing_balance: number | null
  period_start: string | null
  period_end: string | null
} {
  const lines = content.split(/\r?\n/)
  const transactions: ParsedTransaction[] = []
  let openingBalance: number | null = null
  let closingBalance: number | null = null
  let periodStart: string | null = null
  let periodEnd: string | null = null

  let currentTransaction: Partial<ParsedTransaction> | null = null

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()

    // :60F: Opening Balance
    if (line.startsWith(':60F:') || line.startsWith(':60M:')) {
      const data = line.substring(5)
      // Format: C/D YYMMDD CURRENCY AMOUNT
      const sign = data[0] === 'C' ? 1 : -1
      const dateStr = data.substring(1, 7)
      const amount = parseFloat(data.substring(10).replace(',', '.')) * 100
      openingBalance = Math.round(sign * amount)
      periodStart = parseMT940Date(dateStr)
    }

    // :62F: Closing Balance
    if (line.startsWith(':62F:') || line.startsWith(':62M:')) {
      const data = line.substring(5)
      const sign = data[0] === 'C' ? 1 : -1
      const dateStr = data.substring(1, 7)
      const amount = parseFloat(data.substring(10).replace(',', '.')) * 100
      closingBalance = Math.round(sign * amount)
      periodEnd = parseMT940Date(dateStr)
    }

    // :61: Transaction line
    if (line.startsWith(':61:')) {
      if (currentTransaction) {
        transactions.push(currentTransaction as ParsedTransaction)
      }

      const data = line.substring(4)
      // Format: YYMMDD[YYMMDD]C/D[amount]N[type][reference]
      const valueDate = parseMT940Date(data.substring(0, 6))
      const bookingDate = data.length > 10 && /^\d{4}/.test(data.substring(6, 10))
        ? parseMT940Date(data.substring(0, 2) + data.substring(6, 10))
        : valueDate

      // Find C/D indicator and amount
      let idx = 6
      if (/^\d{4}/.test(data.substring(6, 10))) idx = 10

      const creditDebit = data[idx]
      idx++
      // Skip third currency letter if present
      if (data[idx] && /[A-Z]/.test(data[idx]) && data[idx] !== 'N') idx++

      // Extract amount
      let amountStr = ''
      while (idx < data.length && (data[idx] === ',' || data[idx] === '.' || /\d/.test(data[idx]))) {
        amountStr += data[idx]
        idx++
      }
      const amount = parseFloat(amountStr.replace(',', '.')) * 100
      const signedAmount = Math.round(creditDebit === 'C' ? amount : -amount)

      // Extract transaction type and reference
      let txType = ''
      let reference = ''
      if (idx < data.length && data[idx] === 'N') {
        idx++
        txType = data.substring(idx, idx + 3)
        idx += 3
        reference = data.substring(idx).trim()
      }

      currentTransaction = {
        transaction_date: bookingDate || valueDate,
        value_date: valueDate,
        amount: signedAmount,
        reference: reference || null,
        description: '',
        counterparty_name: null,
        counterparty_account: null,
        transaction_type: txType || null,
        balance_after: null,
      }
    }

    // :86: Transaction details
    if (line.startsWith(':86:') && currentTransaction) {
      const detail = line.substring(4)
      currentTransaction.description = (currentTransaction.description || '') + detail

      // Look for continuation lines
      let j = i + 1
      while (j < lines.length && !lines[j].startsWith(':') && lines[j].trim()) {
        currentTransaction.description += ' ' + lines[j].trim()
        j++
      }

      // Try to extract counterparty from description
      const nameMatch = currentTransaction.description.match(/\/NAME\/([^/]+)/)
      if (nameMatch) currentTransaction.counterparty_name = nameMatch[1].trim()

      const acctMatch = currentTransaction.description.match(/\/ACCT\/([^/]+)/)
      if (acctMatch) currentTransaction.counterparty_account = acctMatch[1].trim()
    }
  }

  // Push last transaction
  if (currentTransaction) {
    transactions.push(currentTransaction as ParsedTransaction)
  }

  return { transactions, opening_balance: openingBalance, closing_balance: closingBalance, period_start: periodStart, period_end: periodEnd }
}

function parseMT940Date(yymmdd: string): string {
  const year = parseInt('20' + yymmdd.substring(0, 2))
  const month = yymmdd.substring(2, 4)
  const day = yymmdd.substring(4, 6)
  return `${year}-${month}-${day}`
}

// ============================================================================
// CAMT.053 PARSER (ISO 20022 XML)
// ============================================================================

function parseCAMT053(content: string): {
  transactions: ParsedTransaction[]
  opening_balance: number | null
  closing_balance: number | null
  period_start: string | null
  period_end: string | null
} {
  const transactions: ParsedTransaction[] = []
  let openingBalance: number | null = null
  let closingBalance: number | null = null
  let periodStart: string | null = null
  let periodEnd: string | null = null

  // Simple XML parsing without dependencies
  const getTag = (xml: string, tag: string): string | null => {
    const regex = new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`, 'i')
    const match = xml.match(regex)
    return match ? match[1].trim() : null
  }

  const getBlocks = (xml: string, tag: string): string[] => {
    const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'gi')
    const blocks: string[] = []
    let match
    while ((match = regex.exec(xml)) !== null) {
      blocks.push(match[0])
    }
    return blocks
  }

  // Parse balances
  const balanceBlocks = getBlocks(content, 'Bal')
  for (const bal of balanceBlocks) {
    const type = getTag(bal, 'Cd')
    const amount = parseFloat(getTag(bal, 'Amt') || '0') * 100
    const creditDebit = getTag(bal, 'CdtDbtInd')
    const date = getTag(bal, 'Dt')
    const signed = creditDebit === 'CRDT' ? amount : -amount

    if (type === 'OPBD') {
      openingBalance = Math.round(signed)
      if (date) periodStart = date
    }
    if (type === 'CLBD') {
      closingBalance = Math.round(signed)
      if (date) periodEnd = date
    }
  }

  // Parse entries
  const entries = getBlocks(content, 'Ntry')
  for (const entry of entries) {
    const amount = parseFloat(getTag(entry, 'Amt') || '0') * 100
    const creditDebit = getTag(entry, 'CdtDbtInd')
    const signed = Math.round(creditDebit === 'CRDT' ? amount : -amount)

    const bookDate = getTag(entry, 'BookgDt') || getTag(entry, 'Dt')
    const valDate = getTag(entry, 'ValDt')

    const ref = getTag(entry, 'AcctSvcrRef') || getTag(entry, 'EndToEndId')
    const desc = getTag(entry, 'AddtlNtryInf') || getTag(entry, 'Ustrd') || ''

    const counterpartyName = getTag(entry, 'Nm')
    const counterpartyAccount = getTag(entry, 'IBAN') || getTag(entry, 'Id')

    transactions.push({
      transaction_date: bookDate || periodStart || new Date().toISOString().split('T')[0],
      value_date: valDate || null,
      amount: signed,
      reference: ref || null,
      description: desc,
      counterparty_name: counterpartyName || null,
      counterparty_account: counterpartyAccount || null,
      transaction_type: getTag(entry, 'Prtry') || null,
      balance_after: null,
    })
  }

  return { transactions, opening_balance: openingBalance, closing_balance: closingBalance, period_start: periodStart, period_end: periodEnd }
}

// ============================================================================
// CSV PARSER (Configurable)
// ============================================================================

function parseCSV(content: string, config: ParseInput['csv_config']): {
  transactions: ParsedTransaction[]
  opening_balance: number | null
  closing_balance: number | null
  period_start: string | null
  period_end: string | null
} {
  const cfg = config || {
    delimiter: ';',
    date_column: 0,
    amount_column: 1,
    description_column: 2,
    date_format: 'DD/MM/YYYY',
    skip_header: true,
    decimal_separator: ',',
  }

  const lines = content.split(/\r?\n/).filter(l => l.trim())
  const transactions: ParsedTransaction[] = []

  const startIdx = cfg.skip_header ? 1 : 0

  for (let i = startIdx; i < lines.length; i++) {
    const cols = lines[i].split(cfg.delimiter).map(c => c.trim().replace(/^"(.*)"$/, '$1'))

    if (cols.length <= Math.max(cfg.date_column, cfg.amount_column)) continue

    const dateRaw = cols[cfg.date_column]
    const amountRaw = cols[cfg.amount_column]
    const description = cols[cfg.description_column] || ''
    const reference = cfg.reference_column !== undefined ? cols[cfg.reference_column] || null : null
    const counterparty = cfg.counterparty_column !== undefined ? cols[cfg.counterparty_column] || null : null
    const balanceRaw = cfg.balance_column !== undefined ? cols[cfg.balance_column] : null

    // Parse date
    const txDate = parseFlexibleDate(dateRaw, cfg.date_format)
    if (!txDate) continue

    // Parse amount (handle decimal separator)
    const cleanAmount = amountRaw
      .replace(/\s/g, '')
      .replace(cfg.decimal_separator === ',' ? /\./g : /,/g, '') // remove thousands sep
      .replace(cfg.decimal_separator, '.')
    const amount = Math.round(parseFloat(cleanAmount) * 100)
    if (isNaN(amount)) continue

    const balance = balanceRaw
      ? Math.round(parseFloat(balanceRaw.replace(/\s/g, '').replace(cfg.decimal_separator, '.')) * 100)
      : null

    transactions.push({
      transaction_date: txDate,
      value_date: null,
      amount,
      reference,
      description,
      counterparty_name: counterparty,
      counterparty_account: null,
      transaction_type: null,
      balance_after: balance,
    })
  }

  const periodStart = transactions.length > 0 ? transactions[0].transaction_date : null
  const periodEnd = transactions.length > 0 ? transactions[transactions.length - 1].transaction_date : null

  return { transactions, opening_balance: null, closing_balance: null, period_start: periodStart, period_end: periodEnd }
}

function parseFlexibleDate(raw: string, format: string): string | null {
  try {
    let day: string, month: string, year: string

    if (format === 'DD/MM/YYYY' || format === 'dd/mm/yyyy') {
      const parts = raw.split(/[/\-.]/)
      if (parts.length < 3) return null
      day = parts[0].padStart(2, '0')
      month = parts[1].padStart(2, '0')
      year = parts[2].length === 2 ? '20' + parts[2] : parts[2]
    } else if (format === 'MM/DD/YYYY') {
      const parts = raw.split(/[/\-.]/)
      if (parts.length < 3) return null
      month = parts[0].padStart(2, '0')
      day = parts[1].padStart(2, '0')
      year = parts[2].length === 2 ? '20' + parts[2] : parts[2]
    } else if (format === 'YYYY-MM-DD') {
      const parts = raw.split('-')
      if (parts.length < 3) return null
      year = parts[0]
      month = parts[1].padStart(2, '0')
      day = parts[2].padStart(2, '0')
    } else {
      // Try ISO format
      const d = new Date(raw)
      if (isNaN(d.getTime())) return null
      return d.toISOString().split('T')[0]
    }

    return `${year}-${month}-${day}`
  } catch {
    return null
  }
}

// ============================================================================
// EXCEL PARSER (Simple .xlsx via TSV extraction)
// ============================================================================

function parseExcel(base64Content: string, config: ParseInput['csv_config']): {
  transactions: ParsedTransaction[]
  opening_balance: number | null
  closing_balance: number | null
  period_start: string | null
  period_end: string | null
} {
  // Decode base64 to binary, extract shared strings and sheet data from xlsx
  // xlsx is a zip containing XML files
  // For Edge Functions, we use a lightweight approach:
  // The frontend converts Excel to CSV before sending via SheetJS (xlsx library)
  // So we receive tab-separated content here

  const content = atob(base64Content)

  // Try parsing as tab-separated (pre-converted by frontend)
  return parseCSV(content, {
    ...config,
    delimiter: config?.delimiter || '\t',
    date_column: config?.date_column ?? 0,
    amount_column: config?.amount_column ?? 1,
    description_column: config?.description_column ?? 2,
    date_format: config?.date_format || 'DD/MM/YYYY',
    skip_header: config?.skip_header ?? true,
    decimal_separator: config?.decimal_separator || ',',
  })
}

// ============================================================================
// MAIN
// ============================================================================

async function executeParser(
  supabase: SupabaseClient,
  ctx: TenantContext,
  input: ParseInput
): Promise<Record<string, unknown>> {
  // Decode content
  let content: string
  try {
    content = atob(input.file_content)
  } catch {
    content = input.file_content // Already plain text
  }

  // Parse based on format
  let result: ReturnType<typeof parseMT940>

  switch (input.format) {
    case 'mt940':
      result = parseMT940(content)
      break
    case 'camt053':
      result = parseCAMT053(content)
      break
    case 'csv':
      result = parseCSV(content, input.csv_config)
      break
    case 'excel':
      result = parseExcel(input.file_content, input.csv_config)
      break
    default:
      return errorResponse(`Unsupported format: ${input.format}`, 400) as unknown as Record<string, unknown>
  }

  // Create bank statement record
  const { data: statement, error: stmtError } = await supabase
    .from('bank_statements')
    .insert({
      tenant_id: ctx.tenant_id,
      company_id: ctx.company_id,
      account_id: input.account_id,
      file_name: input.file_name,
      format: input.format,
      period_start: result.period_start,
      period_end: result.period_end,
      transaction_count: result.transactions.length,
      matched_count: 0,
      unmatched_count: result.transactions.length,
      opening_balance: result.opening_balance,
      closing_balance: result.closing_balance,
      status: 'processing',
    })
    .select('id')
    .single()

  if (stmtError) throw stmtError

  // Insert transactions
  if (result.transactions.length > 0) {
    const txRows = result.transactions.map(tx => ({
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
      transaction_type: tx.transaction_type,
      balance_after: tx.balance_after,
      match_status: 'unmatched',
    }))

    const { error: txError } = await supabase
      .from('bank_transactions')
      .insert(txRows)

    if (txError) throw txError
  }

  // Update statement status
  await supabase
    .from('bank_statements')
    .update({ status: 'completed' })
    .eq('id', statement.id)

  return {
    statement_id: statement.id,
    file_name: input.file_name,
    format: input.format,
    transaction_count: result.transactions.length,
    period_start: result.period_start,
    period_end: result.period_end,
    opening_balance: result.opening_balance,
    closing_balance: result.closing_balance,
  }
}

// ============================================================================
// SERVE
// ============================================================================

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return corsResponse()

  try {
    const supabase = createServiceClient()
    const body = await req.json() as ParseInput

    if (!body.account_id || !body.file_content || !body.format) {
      return errorResponse('Missing required fields: account_id, file_content, format', 400)
    }

    const ctx = await extractContext(req, supabase, body)
    const result = await executeParser(supabase, ctx, body)
    return jsonResponse(result)

  } catch (err) {
    console.error('parse-bank-statement error:', err)
    return errorResponse((err as Error).message)
  }
})
