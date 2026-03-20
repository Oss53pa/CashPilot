import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createServiceClient, extractContext, type TenantContext } from '../_shared/supabase-client.ts'
import { jsonResponse, errorResponse, corsResponse } from '../_shared/response.ts'
import { mean, sum, min } from '../_shared/statistics.ts'
import { toISODate, today, addDays } from '../_shared/date-utils.ts'
import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ============================================================================
// TYPES
// ============================================================================

interface AlertEngineInput {
  tenant_id?: string
  company_id?: string
  scope?: string
}

type AlertPriority = 'critical' | 'high' | 'medium' | 'low'
type AlertCategory = 'liquidity' | 'receivables' | 'accounts' | 'debt' | 'investment' | 'fraud'

interface AlertResult {
  rule_id: string
  category: AlertCategory
  priority: AlertPriority
  title: string
  summary: string
  details: Record<string, unknown>
  causes: Record<string, unknown>[]
  breach_date: string | null
  breach_amount: number | null
  probability: number | null
}

interface AlertContext {
  forecasts: Record<string, unknown>[]
  positions: Record<string, unknown>[]
  scores: Record<string, unknown>[]
  anomalies: Record<string, unknown>[]
  accounts: Record<string, unknown>[]
  creditLines: Record<string, unknown>[]
  cashFlows: Record<string, unknown>[]
}

// ============================================================================
// LOAD CONTEXT
// ============================================================================

async function loadAlertContext(
  supabase: SupabaseClient,
  ctx: TenantContext
): Promise<AlertContext> {
  const now = toISODate(today())
  const past30 = toISODate(addDays(today(), -30))

  const [forecasts, accounts, scores, anomalies, cashFlows, creditLines] = await Promise.all([
    supabase
      .from('proph3t_forecasts')
      .select('*')
      .eq('company_id', ctx.company_id)
      .eq('scenario', 'base')
      .gte('forecast_date', now)
      .order('forecast_date')
      .limit(100)
      .then(r => r.data ?? []),

    supabase
      .from('bank_accounts')
      .select('*')
      .eq('company_id', ctx.company_id)
      .eq('is_active', true)
      .then(r => r.data ?? []),

    supabase
      .from('proph3t_tenant_scores')
      .select('*')
      .eq('company_id', ctx.company_id)
      .gte('scored_at', past30)
      .order('scored_at', { ascending: false })
      .limit(200)
      .then(r => r.data ?? []),

    supabase
      .from('proph3t_anomalies')
      .select('*')
      .eq('company_id', ctx.company_id)
      .eq('status', 'open')
      .eq('severity', 'critical')
      .then(r => r.data ?? []),

    supabase
      .from('cash_flows')
      .select('*')
      .eq('company_id', ctx.company_id)
      .eq('is_forecast', false)
      .gte('flow_date', past30)
      .order('flow_date', { ascending: false })
      .limit(500)
      .then(r => r.data ?? []),

    supabase
      .from('credit_lines')
      .select('*')
      .eq('company_id', ctx.company_id)
      .eq('is_active', true)
      .then(r => r.data ?? []),
  ])

  return {
    forecasts,
    positions: accounts,
    scores,
    anomalies,
    accounts,
    creditLines,
    cashFlows,
  }
}

// ============================================================================
// ALERT RULES
// ============================================================================

function checkLiquidityTension(ctx: AlertContext): AlertResult | null {
  // Check if forecasted net position goes negative within 30 days
  const totalBalance = sum(ctx.accounts.map(a => (a.current_balance as number) || 0))
  const availableCredit = sum(ctx.creditLines.map(cl => {
    const limit = (cl.credit_limit as number) || 0
    const used = (cl.used_amount as number) || 0
    return limit - used
  }))

  const forecastsByDate = new Map<string, number>()
  for (const f of ctx.forecasts) {
    const date = f.forecast_date as string
    const current = forecastsByDate.get(date) || 0
    forecastsByDate.set(date, current + (f.amount_central as number))
  }

  let runningPosition = totalBalance
  let breachDate: string | null = null
  let breachAmount = 0

  for (const [date, netFlow] of [...forecastsByDate.entries()].sort()) {
    runningPosition += netFlow
    if (runningPosition < 0 && !breachDate) {
      breachDate = date
      breachAmount = runningPosition
    }
  }

  if (!breachDate) return null

  const daysUntilBreach = Math.round(
    (new Date(breachDate).getTime() - today().getTime()) / (1000 * 60 * 60 * 24)
  )

  const priority: AlertPriority = daysUntilBreach <= 7 ? 'critical' : daysUntilBreach <= 14 ? 'high' : 'medium'

  return {
    rule_id: 'liquidity_tension',
    category: 'liquidity',
    priority,
    title: 'Tension de liquidité imminente',
    summary: `Position prévisionnelle négative de ${breachAmount} centimes le ${breachDate}`,
    details: {
      current_balance: totalBalance,
      available_credit: availableCredit,
      breach_position: breachAmount,
      days_until_breach: daysUntilBreach,
    },
    causes: [
      { factor: 'current_balance', value: totalBalance },
      { factor: 'forecast_net', value: breachAmount - totalBalance },
    ],
    breach_date: breachDate,
    breach_amount: breachAmount,
    probability: Math.min(0.95, 0.5 + (30 - daysUntilBreach) * 0.015),
  }
}

function checkRecoveryRisk(ctx: AlertContext): AlertResult | null {
  // Check for critical or at_risk tenant scores
  const atRiskScores = ctx.scores.filter(s =>
    (s.classification as string) === 'critical' || (s.classification as string) === 'at_risk'
  )

  if (atRiskScores.length === 0) return null

  // Deduplicate by counterparty
  const byCounterparty = new Map<string, Record<string, unknown>>()
  for (const s of atRiskScores) {
    const cpId = s.counterparty_id as string
    if (!byCounterparty.has(cpId)) byCounterparty.set(cpId, s)
  }

  const criticalCount = [...byCounterparty.values()].filter(s => (s.classification as string) === 'critical').length

  if (byCounterparty.size < 2 && criticalCount === 0) return null

  const priority: AlertPriority = criticalCount >= 3 ? 'critical' : criticalCount >= 1 ? 'high' : 'medium'

  return {
    rule_id: 'recovery_risk',
    category: 'receivables',
    priority,
    title: 'Risque de recouvrement',
    summary: `${byCounterparty.size} locataire(s) à risque dont ${criticalCount} critique(s)`,
    details: {
      at_risk_count: byCounterparty.size,
      critical_count: criticalCount,
      counterparties: [...byCounterparty.entries()].map(([id, s]) => ({
        id,
        score: s.score,
        classification: s.classification,
      })),
    },
    causes: [...byCounterparty.values()].map(s => ({
      counterparty_id: s.counterparty_id,
      score: s.score,
      classification: s.classification,
    })),
    breach_date: null,
    breach_amount: null,
    probability: Math.min(0.9, 0.3 + criticalCount * 0.15),
  }
}

function checkAccountImbalance(ctx: AlertContext): AlertResult | null {
  if (ctx.accounts.length < 2) return null

  const balances = ctx.accounts.map(a => ({
    id: a.id as string,
    name: `${a.bank_name} - ${a.account_name}`,
    balance: (a.current_balance as number) || 0,
  }))

  const totalBalance = sum(balances.map(b => b.balance))
  if (totalBalance <= 0) return null

  // Check if any single account holds > 80% of total
  const maxAccount = balances.reduce((max, b) => b.balance > max.balance ? b : max, balances[0])
  const concentration = maxAccount.balance / totalBalance

  if (concentration < 0.8) return null

  return {
    rule_id: 'account_imbalance',
    category: 'accounts',
    priority: concentration > 0.95 ? 'high' : 'medium',
    title: 'Déséquilibre inter-comptes',
    summary: `${Math.round(concentration * 100)}% du solde concentré sur ${maxAccount.name}`,
    details: {
      concentration_pct: Math.round(concentration * 100),
      max_account: maxAccount,
      total_balance: totalBalance,
      account_count: balances.length,
    },
    causes: [{ factor: 'concentration', value: concentration, account: maxAccount.name }],
    breach_date: null,
    breach_amount: null,
    probability: null,
  }
}

function checkCovenantBreachRisk(ctx: AlertContext): AlertResult | null {
  // Check debt covenants (if credit lines have ratio thresholds)
  const totalBalance = sum(ctx.accounts.map(a => (a.current_balance as number) || 0))
  const totalDebt = sum(ctx.creditLines.map(cl => (cl.used_amount as number) || 0))

  if (totalDebt === 0) return null

  const debtToEquityRatio = totalDebt / Math.max(1, totalBalance)

  // Typical covenant threshold = 3x
  if (debtToEquityRatio < 2.5) return null

  const priority: AlertPriority = debtToEquityRatio >= 3 ? 'critical' : 'high'

  return {
    rule_id: 'covenant_breach_risk',
    category: 'debt',
    priority,
    title: 'Covenant bancaire en risque',
    summary: `Ratio dette/trésorerie à ${debtToEquityRatio.toFixed(1)}x (seuil: 3x)`,
    details: {
      debt_ratio: debtToEquityRatio,
      total_debt: totalDebt,
      total_balance: totalBalance,
      threshold: 3.0,
    },
    causes: [{ factor: 'debt_ratio', value: debtToEquityRatio }],
    breach_date: null,
    breach_amount: totalDebt - totalBalance * 3,
    probability: Math.min(0.95, debtToEquityRatio / 3),
  }
}

function checkInvestmentOpportunity(ctx: AlertContext): AlertResult | null {
  const totalBalance = sum(ctx.accounts.map(a => (a.current_balance as number) || 0))

  // Check if position stays positive in all forecasts for next 90 days
  const next90 = ctx.forecasts.filter(f => {
    const daysAway = Math.round(
      (new Date(f.forecast_date as string).getTime() - today().getTime()) / (1000 * 60 * 60 * 24)
    )
    return daysAway <= 90
  })

  if (next90.length === 0) return null

  const minForecast = min(next90.map(f => (f.amount_lower_80 as number) || 0))
  const surplus = totalBalance + minForecast

  // Only alert if surplus > 10M FCFA (1_000_000_000 centimes)
  const SURPLUS_THRESHOLD = 10_000_000_00
  if (surplus < SURPLUS_THRESHOLD) return null

  return {
    rule_id: 'investment_opportunity',
    category: 'investment',
    priority: 'low',
    title: 'Excédent plaçable détecté',
    summary: `Surplus estimé de ${surplus} centimes disponible pour placement`,
    details: {
      surplus_amount: surplus,
      current_balance: totalBalance,
      min_forecast_80: minForecast,
      horizon_days: 90,
    },
    causes: [{ factor: 'surplus', value: surplus }],
    breach_date: null,
    breach_amount: surplus,
    probability: null,
  }
}

function checkCapexTension(ctx: AlertContext): AlertResult | null {
  // Check if CAPEX disbursements are exceeding budget (using category pattern)
  const capexFlows = ctx.cashFlows.filter(f =>
    (f.category as string) === 'capex' || (f.category as string) === 'investment'
  )

  if (capexFlows.length < 3) return null

  const totalCapex = sum(capexFlows.map(f => Math.abs(f.amount as number)))
  const avgMonthlyCapex = totalCapex / 1 // last 30 days

  // Check forecasted CAPEX
  const capexForecasts = ctx.forecasts.filter(f => (f.category as string) === 'capex')
  const forecastedCapex = sum(capexForecasts.map(f => Math.abs(f.amount_central as number)))

  const totalBalance = sum(ctx.accounts.map(a => (a.current_balance as number) || 0))
  const capexRatio = (totalCapex + forecastedCapex) / Math.max(1, totalBalance)

  if (capexRatio < 0.5) return null

  return {
    rule_id: 'capex_tension',
    category: 'liquidity',
    priority: capexRatio > 0.8 ? 'high' : 'medium',
    title: 'Tension CAPEX',
    summary: `CAPEX représente ${Math.round(capexRatio * 100)}% de la trésorerie disponible`,
    details: {
      total_capex_30d: totalCapex,
      forecasted_capex: forecastedCapex,
      capex_ratio: capexRatio,
      balance: totalBalance,
    },
    causes: [{ factor: 'capex_ratio', value: capexRatio }],
    breach_date: null,
    breach_amount: null,
    probability: null,
  }
}

function checkCriticalTenantScore(ctx: AlertContext): AlertResult | null {
  const criticalScores = ctx.scores.filter(s =>
    (s.classification as string) === 'critical' &&
    (s.trend as string) === 'critical_degradation'
  )

  if (criticalScores.length === 0) return null

  // Deduplicate by counterparty
  const unique = new Map<string, Record<string, unknown>>()
  for (const s of criticalScores) {
    const cpId = s.counterparty_id as string
    if (!unique.has(cpId)) unique.set(cpId, s)
  }

  return {
    rule_id: 'critical_tenant_score',
    category: 'receivables',
    priority: unique.size >= 3 ? 'critical' : 'high',
    title: 'Score locataire critique',
    summary: `${unique.size} locataire(s) en dégradation critique`,
    details: {
      count: unique.size,
      counterparties: [...unique.values()].map(s => ({
        counterparty_id: s.counterparty_id,
        score: s.score,
        trend: s.trend,
      })),
    },
    causes: [...unique.values()].map(s => ({
      counterparty_id: s.counterparty_id,
      score: s.score,
    })),
    breach_date: null,
    breach_amount: null,
    probability: null,
  }
}

function checkCriticalAnomaly(ctx: AlertContext): AlertResult | null {
  if (ctx.anomalies.length === 0) return null

  return {
    rule_id: 'critical_anomaly',
    category: 'fraud',
    priority: ctx.anomalies.length >= 5 ? 'critical' : 'high',
    title: 'Anomalie critique',
    summary: `${ctx.anomalies.length} anomalie(s) critique(s) non résolue(s)`,
    details: {
      count: ctx.anomalies.length,
      anomalies: ctx.anomalies.slice(0, 10).map(a => ({
        id: a.id,
        score: a.anomaly_score,
        human_readable: a.human_readable,
      })),
    },
    causes: ctx.anomalies.slice(0, 5).map(a => ({
      anomaly_id: a.id,
      score: a.anomaly_score,
    })),
    breach_date: null,
    breach_amount: null,
    probability: null,
  }
}

// ============================================================================
// DEDUPLICATION
// ============================================================================

async function isDuplicate(
  supabase: SupabaseClient,
  ctx: TenantContext,
  ruleId: string
): Promise<boolean> {
  const yesterday = toISODate(addDays(today(), -1))

  const { data } = await supabase
    .from('proph3t_alerts')
    .select('id')
    .eq('company_id', ctx.company_id)
    .eq('rule_id', ruleId)
    .in('status', ['open', 'acknowledged'])
    .gte('created_at', yesterday)
    .limit(1)

  return (data?.length ?? 0) > 0
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function executeAlertEngine(
  supabase: SupabaseClient,
  ctx: TenantContext
): Promise<Record<string, unknown>> {
  const alertCtx = await loadAlertContext(supabase, ctx)

  // Run all 8 rules
  const rules = [
    checkLiquidityTension,
    checkRecoveryRisk,
    checkAccountImbalance,
    checkCovenantBreachRisk,
    checkInvestmentOpportunity,
    checkCapexTension,
    checkCriticalTenantScore,
    checkCriticalAnomaly,
  ]

  const alerts: AlertResult[] = []
  for (const rule of rules) {
    const result = rule(alertCtx)
    if (result) alerts.push(result)
  }

  // Deduplicate and insert
  const inserted: string[] = []
  for (const alert of alerts) {
    const dup = await isDuplicate(supabase, ctx, alert.rule_id)
    if (dup) continue

    const { data: insertedAlert, error } = await supabase
      .from('proph3t_alerts')
      .insert({
        tenant_id: ctx.tenant_id,
        company_id: ctx.company_id,
        rule_id: alert.rule_id,
        category: alert.category,
        priority: alert.priority,
        title: alert.title,
        summary: alert.summary,
        details: alert.details,
        causes: alert.causes,
        breach_date: alert.breach_date,
        breach_amount: alert.breach_amount,
        probability: alert.probability,
        status: 'open',
        notification_sent: false,
      })
      .select('id')
      .single()

    if (error) {
      console.error(`Failed to insert alert ${alert.rule_id}:`, error)
      continue
    }

    inserted.push(insertedAlert.id)

    // Trigger recommendation generation for each new alert
    try {
      await supabase.functions.invoke('proph3t-recommendation', {
        body: {
          tenant_id: ctx.tenant_id,
          company_id: ctx.company_id,
          alert_id: insertedAlert.id,
          alert_rule_id: alert.rule_id,
          alert_details: alert.details,
        },
      })
    } catch (err) {
      console.error(`Failed to generate recommendations for alert ${alert.rule_id}:`, err)
    }
  }

  return {
    company_id: ctx.company_id,
    rules_evaluated: rules.length,
    alerts_triggered: alerts.length,
    alerts_inserted: inserted.length,
    alert_ids: inserted,
    skipped_duplicates: alerts.length - inserted.length,
  }
}

// ============================================================================
// SERVE
// ============================================================================

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return corsResponse()

  try {
    const supabase = createServiceClient()
    const body = await req.json().catch(() => ({})) as AlertEngineInput

    if (body.scope === 'all_active_companies') {
      const { data: companies } = await supabase
        .from('companies')
        .select('id, tenant_id')
        .eq('is_active', true)

      const results = []
      for (const company of companies ?? []) {
        try {
          const ctx: TenantContext = { tenant_id: company.tenant_id, company_id: company.id }
          const result = await executeAlertEngine(supabase, ctx)
          results.push(result)
        } catch (err) {
          results.push({ company_id: company.id, error: (err as Error).message })
        }
      }
      return jsonResponse({ scope: 'all_active_companies', results })
    }

    const ctx = await extractContext(req, supabase, body)
    const result = await executeAlertEngine(supabase, ctx)
    return jsonResponse(result)

  } catch (err) {
    console.error('proph3t-alert-engine error:', err)
    return errorResponse((err as Error).message)
  }
})
