import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createServiceClient, extractContext, type TenantContext } from '../_shared/supabase-client.ts'
import { jsonResponse, errorResponse, corsResponse } from '../_shared/response.ts'
import { mean, sum } from '../_shared/statistics.ts'
import { daysDiff, toISODate, today, isCIHoliday } from '../_shared/date-utils.ts'
import { buildCounterpartyProfile, computeVelocity } from '../_shared/feature-engineering.ts'
import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ============================================================================
// TYPES
// ============================================================================

interface FraudCheckInput {
  cash_flow_id?: string
  payment_request_id?: string
  tenant_id?: string
  company_id?: string
  scope?: string
}

type FraudRuleId =
  | 'payment_smurfing'
  | 'ghost_vendor'
  | 'duplicate_payment'
  | 'rib_change_then_payment'
  | 'cash_register_manipulation'
  | 'unauthorized_transfer'
  | 'off_hours_transaction'
  | 'excess_cash_not_deposited'

type FraudSeverity = 'medium' | 'high' | 'critical'

interface RuleResult {
  rule_id: FraudRuleId
  triggered: boolean
  severity: FraudSeverity
  score: number // 0-100
  message: string
  evidence: Record<string, unknown>
}

interface TransactionContext {
  transaction: Record<string, unknown>
  recentPayments: Record<string, unknown>[]
  knownIBANs: string[]
  ribChanges: Record<string, unknown>[]
  counterpartyProfile: ReturnType<typeof buildCounterpartyProfile>
  velocity: ReturnType<typeof computeVelocity>
}

// ============================================================================
// LOAD CONTEXT
// ============================================================================

async function loadTransactionContext(
  supabase: SupabaseClient,
  ctx: TenantContext,
  input: FraudCheckInput
): Promise<TransactionContext | null> {
  // Load transaction
  let transaction: Record<string, unknown> | null = null

  if (input.cash_flow_id) {
    const { data } = await supabase
      .from('cash_flows')
      .select('*')
      .eq('id', input.cash_flow_id)
      .eq('tenant_id', ctx.tenant_id)
      .single()
    transaction = data
  } else if (input.payment_request_id) {
    const { data } = await supabase
      .from('payment_requests')
      .select('*')
      .eq('id', input.payment_request_id)
      .eq('tenant_id', ctx.tenant_id)
      .single()
    if (data) {
      transaction = {
        ...data,
        flow_date: data.due_date || toISODate(today()),
        flow_type: 'disbursement',
      }
    }
  }

  if (!transaction) return null

  const referenceDate = (transaction.flow_date || toISODate(today())) as string
  const startDate90d = new Date(referenceDate)
  startDate90d.setDate(startDate90d.getDate() - 90)

  // Load recent payments (90 days)
  const { data: recentPayments = [] } = await supabase
    .from('cash_flows')
    .select('*')
    .eq('tenant_id', ctx.tenant_id)
    .eq('company_id', ctx.company_id)
    .eq('is_forecast', false)
    .gte('flow_date', toISODate(startDate90d))
    .lte('flow_date', referenceDate)
    .order('flow_date', { ascending: false })

  // Load known IBANs from counterparties
  const { data: counterparties = [] } = await supabase
    .from('counterparties')
    .select('id, iban, bank_account_number')
    .eq('tenant_id', ctx.tenant_id)
    .eq('company_id', ctx.company_id)

  const knownIBANs = counterparties
    .map((c: Record<string, unknown>) => (c.iban || c.bank_account_number) as string)
    .filter(Boolean)

  // Load RIB/IBAN changes (from audit log or counterparty updates)
  const startDate30d = new Date(referenceDate)
  startDate30d.setDate(startDate30d.getDate() - 30)

  const { data: ribChanges = [] } = await supabase
    .from('audit_log')
    .select('*')
    .eq('tenant_id', ctx.tenant_id)
    .eq('table_name', 'counterparties')
    .ilike('changes', '%iban%')
    .gte('created_at', toISODate(startDate30d))
    .order('created_at', { ascending: false })
    .limit(50)

  // Build counterparty profile
  const counterpartyId = transaction.counterparty_id as string | null
  const counterpartyProfile = buildCounterpartyProfile(
    recentPayments.map((p: Record<string, unknown>) => ({
      amount: p.amount as number,
      flow_date: p.flow_date as string,
      counterparty_id: p.counterparty_id as string | null,
    })),
    counterpartyId,
    referenceDate
  )

  // Compute velocity
  const velocity = computeVelocity(
    recentPayments
      .filter((p: Record<string, unknown>) => p.counterparty_id === counterpartyId)
      .map((p: Record<string, unknown>) => ({
        amount: p.amount as number,
        flow_date: p.flow_date as string,
      })),
    referenceDate
  )

  return {
    transaction,
    recentPayments,
    knownIBANs,
    ribChanges,
    counterpartyProfile,
    velocity,
  }
}

// ============================================================================
// FRAUD RULES
// ============================================================================

/**
 * Rule 1: Payment Smurfing
 * Multiple sub-DOA-threshold payments to same counterparty in 48h
 */
function checkPaymentSmurfing(ctx: TransactionContext): RuleResult {
  const DOA_THRESHOLD = 500_000_00 // 500,000 FCFA in centimes
  const amount = ctx.transaction.amount as number
  const counterpartyId = ctx.transaction.counterparty_id as string

  if (!counterpartyId || amount >= DOA_THRESHOLD) {
    return { rule_id: 'payment_smurfing', triggered: false, severity: 'medium', score: 0, message: '', evidence: {} }
  }

  const subThresholdIn48h = ctx.recentPayments.filter((p: Record<string, unknown>) => {
    if (p.counterparty_id !== counterpartyId) return false
    const diff = daysDiff(p.flow_date as string, ctx.transaction.flow_date as string)
    return diff >= 0 && diff <= 2 && (p.amount as number) < DOA_THRESHOLD
  })

  const totalAmount = sum(subThresholdIn48h.map((p: Record<string, unknown>) => p.amount as number)) + amount
  const triggered = subThresholdIn48h.length >= 2 && totalAmount >= DOA_THRESHOLD

  return {
    rule_id: 'payment_smurfing',
    triggered,
    severity: totalAmount >= DOA_THRESHOLD * 2 ? 'critical' : 'high',
    score: triggered ? Math.min(90, 50 + subThresholdIn48h.length * 10) : 0,
    message: triggered
      ? `${subThresholdIn48h.length + 1} paiements sous le seuil DOA (${totalAmount} centimes cumulés) en 48h vers la même contrepartie`
      : '',
    evidence: triggered ? {
      count: subThresholdIn48h.length + 1,
      total_amount: totalAmount,
      threshold: DOA_THRESHOLD,
      payments: subThresholdIn48h.map((p: Record<string, unknown>) => ({
        id: p.id,
        amount: p.amount,
        date: p.flow_date,
      })),
    } : {},
  }
}

/**
 * Rule 2: Ghost Vendor
 * Counterparty not in system or unknown IBAN
 */
function checkGhostVendor(ctx: TransactionContext): RuleResult {
  const counterpartyId = ctx.transaction.counterparty_id as string | null
  const isUnknown = !ctx.counterpartyProfile.is_known
  const isNew = ctx.counterpartyProfile.first_seen_days_ago < 7

  const triggered = !counterpartyId || isUnknown || (isNew && ctx.counterpartyProfile.transaction_count <= 1)
  const severity: FraudSeverity = !counterpartyId ? 'critical' : isUnknown ? 'high' : 'medium'

  return {
    rule_id: 'ghost_vendor',
    triggered,
    severity,
    score: triggered ? (!counterpartyId ? 85 : isUnknown ? 70 : 50) : 0,
    message: triggered
      ? !counterpartyId
        ? 'Paiement sans contrepartie identifiée'
        : isUnknown
          ? 'Contrepartie inconnue dans l\'historique'
          : 'Contrepartie très récente (< 7 jours)'
      : '',
    evidence: triggered ? {
      counterparty_id: counterpartyId,
      is_known: ctx.counterpartyProfile.is_known,
      transaction_count: ctx.counterpartyProfile.transaction_count,
      first_seen_days_ago: ctx.counterpartyProfile.first_seen_days_ago,
    } : {},
  }
}

/**
 * Rule 3: Duplicate Payment
 * Same amount + counterparty within 30 days
 */
function checkDuplicatePayment(ctx: TransactionContext): RuleResult {
  const amount = ctx.transaction.amount as number
  const counterpartyId = ctx.transaction.counterparty_id as string | null
  const flowDate = ctx.transaction.flow_date as string

  if (!counterpartyId) {
    return { rule_id: 'duplicate_payment', triggered: false, severity: 'medium', score: 0, message: '', evidence: {} }
  }

  const duplicates = ctx.recentPayments.filter((p: Record<string, unknown>) => {
    if (p.counterparty_id !== counterpartyId) return false
    if (p.id === ctx.transaction.id) return false
    const diff = daysDiff(p.flow_date as string, flowDate)
    return diff >= 0 && diff <= 30 && Math.abs((p.amount as number) - amount) < amount * 0.01
  })

  const triggered = duplicates.length > 0

  return {
    rule_id: 'duplicate_payment',
    triggered,
    severity: duplicates.length >= 2 ? 'critical' : 'high',
    score: triggered ? Math.min(95, 60 + duplicates.length * 15) : 0,
    message: triggered
      ? `${duplicates.length} paiement(s) identique(s) (${amount} centimes) vers la même contrepartie en 30 jours`
      : '',
    evidence: triggered ? {
      duplicate_count: duplicates.length,
      amount,
      duplicates: duplicates.map((p: Record<string, unknown>) => ({
        id: p.id,
        amount: p.amount,
        date: p.flow_date,
      })),
    } : {},
  }
}

/**
 * Rule 4: RIB Change Then Payment
 * Bank detail change within 30 days before payment
 */
function checkRibChangeThenPayment(ctx: TransactionContext): RuleResult {
  const counterpartyId = ctx.transaction.counterparty_id as string | null
  if (!counterpartyId) {
    return { rule_id: 'rib_change_then_payment', triggered: false, severity: 'medium', score: 0, message: '', evidence: {} }
  }

  const relevantChanges = ctx.ribChanges.filter((c: Record<string, unknown>) => {
    const changes = c.changes as string || ''
    return changes.includes(counterpartyId)
  })

  const triggered = relevantChanges.length > 0

  return {
    rule_id: 'rib_change_then_payment',
    triggered,
    severity: 'critical',
    score: triggered ? 80 : 0,
    message: triggered
      ? `Modification des coordonnées bancaires de la contrepartie dans les 30 derniers jours avant ce paiement`
      : '',
    evidence: triggered ? {
      changes_count: relevantChanges.length,
      changes: relevantChanges.map((c: Record<string, unknown>) => ({
        date: c.created_at,
        changes: c.changes,
      })),
    } : {},
  }
}

/**
 * Rule 5: Cash Register Manipulation
 * Repeated sub-threshold cash discrepancies (>=5 in 30 days)
 */
function checkCashRegisterManipulation(ctx: TransactionContext): RuleResult {
  const DISCREPANCY_THRESHOLD = 10_000_00 // 10,000 FCFA
  const flowDate = ctx.transaction.flow_date as string

  const cashDiscrepancies = ctx.recentPayments.filter((p: Record<string, unknown>) => {
    const diff = daysDiff(p.flow_date as string, flowDate)
    return diff >= 0 && diff <= 30 &&
      (p.category as string) === 'cash_register' &&
      Math.abs(p.amount as number) < DISCREPANCY_THRESHOLD &&
      Math.abs(p.amount as number) > 0
  })

  const triggered = cashDiscrepancies.length >= 5

  return {
    rule_id: 'cash_register_manipulation',
    triggered,
    severity: cashDiscrepancies.length >= 10 ? 'critical' : 'high',
    score: triggered ? Math.min(90, 40 + cashDiscrepancies.length * 5) : 0,
    message: triggered
      ? `${cashDiscrepancies.length} écarts de caisse sous le seuil de détection en 30 jours`
      : '',
    evidence: triggered ? {
      discrepancy_count: cashDiscrepancies.length,
      total_amount: sum(cashDiscrepancies.map((p: Record<string, unknown>) => Math.abs(p.amount as number))),
      threshold: DISCREPANCY_THRESHOLD,
    } : {},
  }
}

/**
 * Rule 6: Unauthorized Transfer
 * Transfer above threshold without approval
 */
function checkUnauthorizedTransfer(ctx: TransactionContext): RuleResult {
  const APPROVAL_THRESHOLD = 1_000_000_00 // 1M FCFA
  const amount = ctx.transaction.amount as number
  const status = ctx.transaction.status as string || ''
  const approvedBy = ctx.transaction.approved_by as string || ctx.transaction.validated_by as string || null

  const triggered = Math.abs(amount) >= APPROVAL_THRESHOLD && !approvedBy && status !== 'approved'

  return {
    rule_id: 'unauthorized_transfer',
    triggered,
    severity: Math.abs(amount) >= APPROVAL_THRESHOLD * 5 ? 'critical' : 'high',
    score: triggered ? Math.min(95, 60 + Math.floor(Math.abs(amount) / APPROVAL_THRESHOLD) * 10) : 0,
    message: triggered
      ? `Transfert de ${amount} centimes au-dessus du seuil d'approbation sans validation`
      : '',
    evidence: triggered ? {
      amount,
      threshold: APPROVAL_THRESHOLD,
      status,
      approved_by: approvedBy,
    } : {},
  }
}

/**
 * Rule 7: Off-Hours Transaction
 * Transactions 22:00-06:00 or CI holidays
 */
function checkOffHoursTransaction(ctx: TransactionContext): RuleResult {
  const createdAt = ctx.transaction.created_at as string
  if (!createdAt) {
    return { rule_id: 'off_hours_transaction', triggered: false, severity: 'medium', score: 0, message: '', evidence: {} }
  }

  const date = new Date(createdAt)
  const hour = date.getUTCHours()
  const isOffHours = hour >= 22 || hour < 6
  const isHoliday = isCIHoliday(date)
  const isWeekend = date.getUTCDay() === 0 || date.getUTCDay() === 6

  const triggered = isOffHours || isHoliday

  return {
    rule_id: 'off_hours_transaction',
    triggered,
    severity: isOffHours && (isHoliday || isWeekend) ? 'high' : 'medium',
    score: triggered ? (isOffHours ? 60 : 40) + (isHoliday ? 15 : 0) + (isWeekend ? 10 : 0) : 0,
    message: triggered
      ? isOffHours
        ? `Transaction effectuée à ${hour}h (hors horaires: 22h-6h)${isHoliday ? ' un jour férié' : ''}${isWeekend ? ' un week-end' : ''}`
        : `Transaction effectuée un jour férié en Côte d'Ivoire`
      : '',
    evidence: triggered ? {
      hour,
      is_off_hours: isOffHours,
      is_holiday: isHoliday,
      is_weekend: isWeekend,
      timestamp: createdAt,
    } : {},
  }
}

/**
 * Rule 8: Excess Cash Not Deposited
 * Cash balance exceeding threshold without deposit
 */
function checkExcessCashNotDeposited(ctx: TransactionContext): RuleResult {
  const CASH_THRESHOLD = 2_000_000_00 // 2M FCFA
  const category = ctx.transaction.category as string

  if (category !== 'cash_register' && category !== 'cash') {
    return { rule_id: 'excess_cash_not_deposited', triggered: false, severity: 'medium', score: 0, message: '', evidence: {} }
  }

  // Sum all cash transactions in last 7 days
  const flowDate = ctx.transaction.flow_date as string
  const cashIn7d = ctx.recentPayments.filter((p: Record<string, unknown>) => {
    const diff = daysDiff(p.flow_date as string, flowDate)
    const cat = p.category as string
    return diff >= 0 && diff <= 7 && (cat === 'cash_register' || cat === 'cash')
  })

  const cashBalance = sum(cashIn7d.map((p: Record<string, unknown>) => p.amount as number))

  // Check if there was a deposit in the same period
  const deposits = ctx.recentPayments.filter((p: Record<string, unknown>) => {
    const diff = daysDiff(p.flow_date as string, flowDate)
    return diff >= 0 && diff <= 7 && (p.category as string) === 'bank_deposit'
  })

  const triggered = cashBalance > CASH_THRESHOLD && deposits.length === 0

  return {
    rule_id: 'excess_cash_not_deposited',
    triggered,
    severity: cashBalance > CASH_THRESHOLD * 3 ? 'critical' : 'high',
    score: triggered ? Math.min(85, 50 + Math.floor(cashBalance / CASH_THRESHOLD) * 15) : 0,
    message: triggered
      ? `Solde caisse de ${cashBalance} centimes dépasse le seuil sans reversement bancaire depuis 7 jours`
      : '',
    evidence: triggered ? {
      cash_balance: cashBalance,
      threshold: CASH_THRESHOLD,
      deposits_in_period: deposits.length,
      days_without_deposit: 7,
    } : {},
  }
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function executeFraudCheck(
  supabase: SupabaseClient,
  ctx: TenantContext,
  input: FraudCheckInput
): Promise<Record<string, unknown>> {
  const txContext = await loadTransactionContext(supabase, ctx, input)

  if (!txContext) {
    return { status: 'skipped', message: 'No transaction found' }
  }

  // Run all 8 rules
  const ruleResults: RuleResult[] = [
    checkPaymentSmurfing(txContext),
    checkGhostVendor(txContext),
    checkDuplicatePayment(txContext),
    checkRibChangeThenPayment(txContext),
    checkCashRegisterManipulation(txContext),
    checkUnauthorizedTransfer(txContext),
    checkOffHoursTransaction(txContext),
    checkExcessCashNotDeposited(txContext),
  ]

  const triggered = ruleResults.filter(r => r.triggered)

  if (triggered.length === 0) {
    return {
      cash_flow_id: input.cash_flow_id,
      payment_request_id: input.payment_request_id,
      fraud_score: 0,
      triggered_rules: 0,
      status: 'clean',
    }
  }

  // Composite score = max of triggered rules
  const fraudScore = Math.max(...triggered.map(r => r.score))
  const maxSeverity = triggered.some(r => r.severity === 'critical')
    ? 'critical'
    : triggered.some(r => r.severity === 'high')
      ? 'high'
      : 'medium'

  // Block transaction if critical severity
  const blockTransaction = maxSeverity === 'critical'

  // Insert one fraud alert per triggered rule
  for (const rule of triggered) {
    const { error } = await supabase.from('proph3t_fraud_alerts').insert({
      tenant_id: ctx.tenant_id,
      company_id: ctx.company_id,
      rule_id: rule.rule_id,
      severity: rule.severity,
      fraud_score: rule.score,
      cash_flow_id: input.cash_flow_id || null,
      payment_request_id: input.payment_request_id || null,
      evidence: rule.evidence,
      message: rule.message,
      transaction_blocked: blockTransaction,
      status: 'open',
    })

    if (error) {
      console.error(`Failed to insert fraud alert for rule ${rule.rule_id}:`, error)
    }
  }

  return {
    cash_flow_id: input.cash_flow_id,
    payment_request_id: input.payment_request_id,
    fraud_score: fraudScore,
    severity: maxSeverity,
    transaction_blocked: blockTransaction,
    triggered_rules: triggered.length,
    rules: triggered.map(r => ({
      rule_id: r.rule_id,
      severity: r.severity,
      score: r.score,
      message: r.message,
    })),
  }
}

// ============================================================================
// SERVE
// ============================================================================

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return corsResponse()

  try {
    const supabase = createServiceClient()
    const body = await req.json().catch(() => ({})) as FraudCheckInput

    if (body.scope === 'all_active_companies') {
      const { data: companies } = await supabase
        .from('companies')
        .select('id, tenant_id')
        .eq('is_active', true)

      const results = []
      for (const company of companies ?? []) {
        try {
          const ctx: TenantContext = { tenant_id: company.tenant_id, company_id: company.id }

          const { data: recentFlows } = await supabase
            .from('cash_flows')
            .select('id')
            .eq('tenant_id', ctx.tenant_id)
            .eq('company_id', ctx.company_id)
            .eq('is_forecast', false)
            .gte('flow_date', toISODate(new Date(Date.now() - 24 * 60 * 60 * 1000)))
            .order('created_at', { ascending: false })
            .limit(50)

          for (const flow of recentFlows ?? []) {
            try {
              const result = await executeFraudCheck(supabase, ctx, { cash_flow_id: flow.id })
              results.push(result)
            } catch (err) {
              results.push({ cash_flow_id: flow.id, error: (err as Error).message })
            }
          }
        } catch (err) {
          results.push({ company_id: company.id, error: (err as Error).message })
        }
      }

      return jsonResponse({ scope: 'all_active_companies', checked: results.length, results })
    }

    const ctx = await extractContext(req, supabase, body)
    const result = await executeFraudCheck(supabase, ctx, body)
    return jsonResponse(result)

  } catch (err) {
    console.error('proph3t-fraud-check error:', err)
    return errorResponse((err as Error).message)
  }
})
