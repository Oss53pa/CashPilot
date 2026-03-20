import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createServiceClient, extractContext, type TenantContext } from '../_shared/supabase-client.ts'
import { jsonResponse, errorResponse, corsResponse } from '../_shared/response.ts'
import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ============================================================================
// TYPES
// ============================================================================

interface MatchInput {
  statement_id: string
  tenant_id?: string
  company_id?: string
}

interface MatchResult {
  transaction_id: string
  flow_id: string | null
  match_type: string
  confidence: number
}

// ============================================================================
// MATCHING ALGORITHM (5 levels, descending confidence)
// ============================================================================

async function executeMatching(
  supabase: SupabaseClient,
  ctx: TenantContext,
  statementId: string
): Promise<Record<string, unknown>> {
  // Load unmatched bank transactions from the statement
  const { data: transactions = [] } = await supabase
    .from('bank_transactions')
    .select('*')
    .eq('statement_id', statementId)
    .eq('match_status', 'unmatched')
    .order('transaction_date')

  if (transactions.length === 0) {
    return { statement_id: statementId, matched: 0, unmatched: 0, message: 'No unmatched transactions' }
  }

  // Load candidate cash flows (confirmed, from same account, within date range)
  const dates = transactions.map((t: Record<string, unknown>) => t.transaction_date as string)
  const minDate = dates.sort()[0]
  const maxDate = dates.sort().reverse()[0]

  // Extend search window by 15 days on each side
  const searchStart = new Date(minDate)
  searchStart.setDate(searchStart.getDate() - 15)
  const searchEnd = new Date(maxDate)
  searchEnd.setDate(searchEnd.getDate() + 15)

  const { data: flows = [] } = await supabase
    .from('cash_flows')
    .select('*')
    .eq('tenant_id', ctx.tenant_id)
    .eq('company_id', ctx.company_id)
    .eq('is_forecast', false)
    .gte('flow_date', searchStart.toISOString().split('T')[0])
    .lte('flow_date', searchEnd.toISOString().split('T')[0])
    .order('flow_date')

  // Load counterparties for name matching
  const { data: counterparties = [] } = await supabase
    .from('counterparties')
    .select('id, name')
    .eq('tenant_id', ctx.tenant_id)
    .eq('company_id', ctx.company_id)

  const counterpartyMap = new Map<string, string>()
  for (const cp of counterparties) {
    counterpartyMap.set((cp.id as string), (cp.name as string).toLowerCase())
  }

  // Track which flows have been matched (one-to-one matching)
  const matchedFlowIds = new Set<string>()
  const results: MatchResult[] = []
  let matchedCount = 0

  for (const tx of transactions) {
    const txAmount = tx.amount as number
    const txDate = tx.transaction_date as string
    const txRef = ((tx.reference as string) || '').toLowerCase().trim()
    const txDesc = ((tx.description as string) || '').toLowerCase()
    const txCounterparty = ((tx.counterparty_name as string) || '').toLowerCase()

    let bestMatch: { flowId: string; confidence: number; matchType: string } | null = null

    for (const flow of flows) {
      if (matchedFlowIds.has(flow.id as string)) continue

      const flowAmount = flow.amount as number
      const flowDate = flow.flow_date as string
      const flowRef = ((flow.reference as string) || '').toLowerCase().trim()
      const flowCounterpartyId = flow.counterparty_id as string | null
      const flowCounterpartyName = flowCounterpartyId ? counterpartyMap.get(flowCounterpartyId) || '' : ''

      // Level 1: Exact reference match (confidence 0.98)
      if (txRef && flowRef && txRef === flowRef) {
        if (!bestMatch || 0.98 > bestMatch.confidence) {
          bestMatch = { flowId: flow.id as string, confidence: 0.98, matchType: 'exact_ref' }
        }
        continue
      }

      // Reference contained in description
      if (flowRef && txDesc.includes(flowRef)) {
        if (!bestMatch || 0.92 > bestMatch.confidence) {
          bestMatch = { flowId: flow.id as string, confidence: 0.92, matchType: 'exact_ref' }
        }
        continue
      }

      // Level 2: Exact amount + known counterparty (confidence 0.85)
      const amountMatch = txAmount === flowAmount
      const counterpartyMatch = flowCounterpartyName &&
        (txCounterparty.includes(flowCounterpartyName) || flowCounterpartyName.includes(txCounterparty) ||
         txDesc.includes(flowCounterpartyName))

      if (amountMatch && counterpartyMatch) {
        if (!bestMatch || 0.85 > bestMatch.confidence) {
          bestMatch = { flowId: flow.id as string, confidence: 0.85, matchType: 'exact_amount_counterparty' }
        }
        continue
      }

      // Level 3: Exact amount + date within 5 days (confidence 0.70)
      const daysDiff = Math.abs(
        (new Date(txDate).getTime() - new Date(flowDate).getTime()) / (1000 * 60 * 60 * 24)
      )

      if (amountMatch && daysDiff <= 5) {
        const dateConfidence = 0.70 + (1 - daysDiff / 5) * 0.10
        if (!bestMatch || dateConfidence > bestMatch.confidence) {
          bestMatch = { flowId: flow.id as string, confidence: dateConfidence, matchType: 'amount_date_range' }
        }
        continue
      }

      // Level 4: Approximate amount (±2%) + known counterparty (confidence 0.55)
      const amountDiff = Math.abs(txAmount - flowAmount)
      const amountPct = Math.abs(flowAmount) > 0 ? amountDiff / Math.abs(flowAmount) : 1
      const approxAmount = amountPct <= 0.02

      if (approxAmount && counterpartyMatch) {
        const approxConfidence = 0.55 + (1 - amountPct / 0.02) * 0.10
        if (!bestMatch || approxConfidence > bestMatch.confidence) {
          bestMatch = { flowId: flow.id as string, confidence: approxConfidence, matchType: 'approx_amount_counterparty' }
        }
        continue
      }

      // Level 5: Approximate amount + date range (confidence 0.35)
      if (approxAmount && daysDiff <= 10) {
        const weakConfidence = 0.35 + (1 - amountPct / 0.02) * 0.05 + (1 - daysDiff / 10) * 0.05
        if (!bestMatch || weakConfidence > bestMatch.confidence) {
          bestMatch = { flowId: flow.id as string, confidence: weakConfidence, matchType: 'approx_amount_counterparty' }
        }
      }
    }

    if (bestMatch && bestMatch.confidence >= 0.50) {
      // Auto-confirm matches with confidence >= 0.90
      const autoConfirm = bestMatch.confidence >= 0.90
      const matchStatus = autoConfirm ? 'matched' : 'proposed'

      const { error } = await supabase
        .from('bank_transactions')
        .update({
          matched_flow_id: bestMatch.flowId,
          match_type: bestMatch.matchType,
          match_confidence: bestMatch.confidence,
          match_status: matchStatus,
          matched_at: autoConfirm ? new Date().toISOString() : null,
        })
        .eq('id', tx.id)

      if (!error) {
        matchedFlowIds.add(bestMatch.flowId)
        matchedCount++

        // If auto-confirmed, also update the cash flow
        if (autoConfirm) {
          await supabase
            .from('cash_flows')
            .update({ status: 'matched' })
            .eq('id', bestMatch.flowId)
        }
      }

      results.push({
        transaction_id: tx.id as string,
        flow_id: bestMatch.flowId,
        match_type: bestMatch.matchType,
        confidence: bestMatch.confidence,
      })
    } else {
      results.push({
        transaction_id: tx.id as string,
        flow_id: null,
        match_type: 'manual',
        confidence: bestMatch?.confidence || 0,
      })
    }
  }

  // Update statement counters
  const { data: updatedTxs } = await supabase
    .from('bank_transactions')
    .select('match_status')
    .eq('statement_id', statementId)

  const matched = (updatedTxs ?? []).filter((t: Record<string, unknown>) =>
    t.match_status === 'matched' || t.match_status === 'proposed'
  ).length
  const unmatched = (updatedTxs ?? []).length - matched

  await supabase
    .from('bank_statements')
    .update({ matched_count: matched, unmatched_count: unmatched })
    .eq('id', statementId)

  return {
    statement_id: statementId,
    total_transactions: transactions.length,
    matched: matchedCount,
    auto_confirmed: results.filter(r => r.confidence >= 0.90).length,
    proposed: results.filter(r => r.confidence >= 0.50 && r.confidence < 0.90).length,
    unmatched: results.filter(r => !r.flow_id).length,
    results,
  }
}

// ============================================================================
// SERVE
// ============================================================================

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return corsResponse()

  try {
    const supabase = createServiceClient()
    const body = await req.json() as MatchInput

    if (!body.statement_id) {
      return errorResponse('Missing required field: statement_id', 400)
    }

    const ctx = await extractContext(req, supabase, body)
    const result = await executeMatching(supabase, ctx, body.statement_id)
    return jsonResponse(result)

  } catch (err) {
    console.error('match-transactions error:', err)
    return errorResponse((err as Error).message)
  }
})
