import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createServiceClient, extractContext, type TenantContext } from '../_shared/supabase-client.ts'
import { jsonResponse, errorResponse, corsResponse } from '../_shared/response.ts'
import { mean, stddev, linearRegression, clamp, sum } from '../_shared/statistics.ts'
import { toISODate, today, addDays, daysDiff } from '../_shared/date-utils.ts'
import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ============================================================================
// TYPES
// ============================================================================

interface BehaviorScoreInput {
  company_id?: string
  tenant_id?: string
  counterparty_id?: string
  scope?: string
}

type ScoreClassification = 'excellent' | 'good' | 'watch' | 'at_risk' | 'critical'
type ScoreTrend = 'improving' | 'stable' | 'degrading' | 'critical_degradation'
type RecommendedAction = 'none' | 'monitor' | 'preventive_contact' | 'formal_notice' | 'legal_procedure'

interface CounterpartyFeatures {
  avg_delay_recent_3m: number
  avg_delay_all_time: number
  delay_trend: number
  full_payment_rate: number
  partial_payment_rate: number
  no_payment_rate: number
  relances_count: number
  arrears_amount: number
  arrears_months: number
  payment_regularity: number
  days_since_last_payment: number
  total_transactions: number
}

// ============================================================================
// FEATURE EXTRACTION
// ============================================================================

async function extractCounterpartyFeatures(
  supabase: SupabaseClient,
  ctx: TenantContext,
  counterpartyId: string
): Promise<CounterpartyFeatures> {
  const now = today()
  const past3m = toISODate(addDays(now, -90))
  const past12m = toISODate(addDays(now, -365))

  // Get payment history
  const { data: payments = [] } = await supabase
    .from('cash_flows')
    .select('flow_date, amount, due_date, category, status')
    .eq('tenant_id', ctx.tenant_id)
    .eq('company_id', ctx.company_id)
    .eq('counterparty_id', counterpartyId)
    .eq('is_forecast', false)
    .eq('flow_type', 'receipt')
    .gte('flow_date', past12m)
    .order('flow_date', { ascending: true })

  // Get payment requests (expected payments)
  const { data: requests = [] } = await supabase
    .from('payment_requests')
    .select('due_date, amount, status, payment_date')
    .eq('tenant_id', ctx.tenant_id)
    .eq('company_id', ctx.company_id)
    .eq('counterparty_id', counterpartyId)
    .gte('due_date', past12m)
    .order('due_date', { ascending: true })

  // Calculate delays (payment_date - due_date)
  const delays: number[] = []
  const delays3m: number[] = []
  let fullPayments = 0, partialPayments = 0, noPayments = 0

  for (const req of requests) {
    const dueDate = req.due_date as string
    const paymentDate = req.payment_date as string | null
    const status = req.status as string

    if (status === 'paid' && paymentDate) {
      const delay = daysDiff(dueDate, paymentDate)
      delays.push(delay)
      if (new Date(dueDate) >= new Date(past3m)) {
        delays3m.push(delay)
      }
      fullPayments++
    } else if (status === 'partial') {
      partialPayments++
      // Estimate delay as days from due to now
      delays.push(daysDiff(dueDate, toISODate(now)))
    } else if (new Date(dueDate) < now && status !== 'cancelled') {
      noPayments++
    }
  }

  const totalExpected = fullPayments + partialPayments + noPayments
  const avgDelayAll = delays.length > 0 ? mean(delays) : 0
  const avgDelay3m = delays3m.length > 0 ? mean(delays3m) : avgDelayAll

  // Delay trend: linear regression on delays over time
  let delayTrend = 0
  if (delays.length >= 3) {
    const x = delays.map((_, i) => i)
    const { slope } = linearRegression(x, delays)
    delayTrend = slope
  }

  // Payment regularity: std of intervals between payments
  let paymentRegularity = 0
  if (payments.length >= 3) {
    const intervals: number[] = []
    for (let i = 1; i < payments.length; i++) {
      intervals.push(daysDiff(
        (payments[i - 1] as Record<string, unknown>).flow_date as string,
        (payments[i] as Record<string, unknown>).flow_date as string
      ))
    }
    const avgInterval = mean(intervals)
    paymentRegularity = avgInterval > 0 ? 1 - clamp(stddev(intervals) / avgInterval, 0, 1) : 0
  }

  // Days since last payment
  const lastPayment = payments.length > 0
    ? daysDiff((payments[payments.length - 1] as Record<string, unknown>).flow_date as string, toISODate(now))
    : 999

  // Arrears: unpaid amounts past due
  let arrearsAmount = 0
  let arrearsMonths = 0
  for (const req of requests) {
    const dueDate = req.due_date as string
    const status = req.status as string
    if (new Date(dueDate) < now && status !== 'paid' && status !== 'cancelled') {
      arrearsAmount += (req.amount as number) || 0
      const monthsOverdue = Math.ceil(daysDiff(dueDate, toISODate(now)) / 30)
      if (monthsOverdue > arrearsMonths) arrearsMonths = monthsOverdue
    }
  }

  // Relances count (approximated from payment requests with late status)
  const relances = requests.filter((r: Record<string, unknown>) => {
    const status = r.status as string
    return status === 'reminded' || status === 'overdue' || status === 'late'
  }).length

  return {
    avg_delay_recent_3m: avgDelay3m,
    avg_delay_all_time: avgDelayAll,
    delay_trend: delayTrend,
    full_payment_rate: totalExpected > 0 ? fullPayments / totalExpected : 1,
    partial_payment_rate: totalExpected > 0 ? partialPayments / totalExpected : 0,
    no_payment_rate: totalExpected > 0 ? noPayments / totalExpected : 0,
    relances_count: relances,
    arrears_amount: arrearsAmount,
    arrears_months: arrearsMonths,
    payment_regularity: paymentRegularity,
    days_since_last_payment: lastPayment,
    total_transactions: payments.length,
  }
}

// ============================================================================
// SCORING ENGINE (Rule-based with weighted features)
// ============================================================================

function computeScore(features: CounterpartyFeatures): {
  score: number
  raw_probability: number
  top_risk_factors: { feature: string; value: number; contribution: number; description: string }[]
} {
  // Weighted rule-based scoring (used when <50 labeled counterparties)
  // Each factor contributes to a default probability (0 = no risk, 1 = certain default)

  const factors: { feature: string; weight: number; rawValue: number; riskContribution: number; description: string }[] = [
    {
      feature: 'avg_delay_recent_3m',
      weight: 0.20,
      rawValue: features.avg_delay_recent_3m,
      riskContribution: clamp(features.avg_delay_recent_3m / 60, 0, 1), // 60+ days = max risk
      description: features.avg_delay_recent_3m > 30
        ? `Retard moyen de ${Math.round(features.avg_delay_recent_3m)} jours (3 derniers mois)`
        : 'Délais de paiement récents acceptables',
    },
    {
      feature: 'delay_trend',
      weight: 0.10,
      rawValue: features.delay_trend,
      riskContribution: clamp(features.delay_trend / 5, 0, 1), // +5 days/period = max
      description: features.delay_trend > 1
        ? 'Tendance à la dégradation des délais'
        : 'Délais stables ou en amélioration',
    },
    {
      feature: 'full_payment_rate',
      weight: 0.20,
      rawValue: features.full_payment_rate,
      riskContribution: 1 - features.full_payment_rate,
      description: features.full_payment_rate < 0.7
        ? `Taux de paiement complet faible: ${Math.round(features.full_payment_rate * 100)}%`
        : 'Bon taux de paiement complet',
    },
    {
      feature: 'no_payment_rate',
      weight: 0.15,
      rawValue: features.no_payment_rate,
      riskContribution: features.no_payment_rate,
      description: features.no_payment_rate > 0.1
        ? `${Math.round(features.no_payment_rate * 100)}% d'échéances impayées`
        : 'Peu d\'impayés',
    },
    {
      feature: 'arrears_amount',
      weight: 0.15,
      rawValue: features.arrears_amount,
      riskContribution: clamp(features.arrears_amount / 10_000_000_00, 0, 1), // 10M FCFA = max
      description: features.arrears_amount > 0
        ? `Arriérés de ${features.arrears_amount} centimes sur ${features.arrears_months} mois`
        : 'Aucun arriéré',
    },
    {
      feature: 'payment_regularity',
      weight: 0.10,
      rawValue: features.payment_regularity,
      riskContribution: 1 - features.payment_regularity,
      description: features.payment_regularity < 0.5
        ? 'Paiements très irréguliers'
        : 'Paiements réguliers',
    },
    {
      feature: 'days_since_last_payment',
      weight: 0.10,
      rawValue: features.days_since_last_payment,
      riskContribution: clamp(features.days_since_last_payment / 120, 0, 1), // 120+ days = max
      description: features.days_since_last_payment > 60
        ? `Aucun paiement depuis ${features.days_since_last_payment} jours`
        : 'Paiement récent',
    },
  ]

  // Compute raw default probability
  const raw_probability = factors.reduce((sum, f) => sum + f.weight * f.riskContribution, 0)

  // Score = inverse: 0 = certain default, 100 = no risk
  const score = Math.round((1 - raw_probability) * 100)

  // Top risk factors
  const topRisk = factors
    .sort((a, b) => b.weight * b.riskContribution - a.weight * a.riskContribution)
    .slice(0, 3)
    .map(f => ({
      feature: f.feature,
      value: f.rawValue,
      contribution: f.weight * f.riskContribution,
      description: f.description,
    }))

  return { score: clamp(score, 0, 100), raw_probability: clamp(raw_probability, 0, 1), top_risk_factors: topRisk }
}

// ============================================================================
// CLASSIFICATION + TREND + ACTION
// ============================================================================

function classify(score: number): ScoreClassification {
  if (score >= 80) return 'excellent'
  if (score >= 65) return 'good'
  if (score >= 50) return 'watch'
  if (score >= 35) return 'at_risk'
  return 'critical'
}

function computeTrend(
  currentScore: number,
  previousScores: number[]
): { trend: ScoreTrend; delta_4weeks: number } {
  if (previousScores.length === 0) {
    return { trend: 'stable', delta_4weeks: 0 }
  }

  const oldScore = mean(previousScores.slice(0, 4))
  const delta = currentScore - oldScore

  let trend: ScoreTrend
  if (delta > 5) trend = 'improving'
  else if (delta > -5) trend = 'stable'
  else if (delta > -15) trend = 'degrading'
  else trend = 'critical_degradation'

  return { trend, delta_4weeks: Math.round(delta) }
}

function recommendAction(classification: ScoreClassification, trend: ScoreTrend): RecommendedAction {
  if (classification === 'critical') return 'legal_procedure'
  if (classification === 'at_risk' && trend === 'critical_degradation') return 'formal_notice'
  if (classification === 'at_risk') return 'preventive_contact'
  if (classification === 'watch') return 'monitor'
  return 'none'
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function executeBehaviorScore(
  supabase: SupabaseClient,
  ctx: TenantContext,
  counterpartyId?: string
): Promise<Record<string, unknown>> {
  // Get counterparties to score
  let counterpartyIds: string[] = []

  if (counterpartyId) {
    counterpartyIds = [counterpartyId]
  } else {
    const { data: counterparties } = await supabase
      .from('counterparties')
      .select('id')
      .eq('tenant_id', ctx.tenant_id)
      .eq('company_id', ctx.company_id)
      .eq('is_active', true)

    counterpartyIds = (counterparties ?? []).map((c: Record<string, unknown>) => c.id as string)
  }

  const results: Record<string, unknown>[] = []

  for (const cpId of counterpartyIds) {
    try {
      // Extract features
      const features = await extractCounterpartyFeatures(supabase, ctx, cpId)

      // Compute score
      const { score, raw_probability, top_risk_factors } = computeScore(features)

      // Get previous scores for trend
      const { data: prevScores = [] } = await supabase
        .from('proph3t_tenant_scores')
        .select('score')
        .eq('company_id', ctx.company_id)
        .eq('counterparty_id', cpId)
        .order('scored_at', { ascending: false })
        .limit(4)

      const previousScoreValues = prevScores.map((s: Record<string, unknown>) => s.score as number)
      const { trend, delta_4weeks } = computeTrend(score, previousScoreValues)

      const classification = classify(score)
      const recommended_action = recommendAction(classification, trend)

      // Insert score
      const { error } = await supabase.from('proph3t_tenant_scores').insert({
        tenant_id: ctx.tenant_id,
        company_id: ctx.company_id,
        counterparty_id: cpId,
        score,
        raw_probability,
        classification,
        trend,
        delta_4weeks,
        recommended_action,
        features_snapshot: features as unknown as Record<string, number>,
        top_risk_factors,
        model_version: 'rule_based_v1',
      })

      if (error) {
        console.error(`Failed to insert score for ${cpId}:`, error)
      }

      results.push({
        counterparty_id: cpId,
        score,
        classification,
        trend,
        delta_4weeks,
        recommended_action,
      })
    } catch (err) {
      results.push({
        counterparty_id: cpId,
        error: (err as Error).message,
      })
    }
  }

  return {
    company_id: ctx.company_id,
    scored_count: results.filter(r => !r.error).length,
    error_count: results.filter(r => r.error).length,
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
    const body = await req.json().catch(() => ({})) as BehaviorScoreInput

    if (body.scope === 'all_active_companies') {
      const { data: companies } = await supabase
        .from('companies')
        .select('id, tenant_id')
        .eq('is_active', true)

      const results = []
      for (const company of companies ?? []) {
        try {
          const ctx: TenantContext = { tenant_id: company.tenant_id, company_id: company.id }
          const result = await executeBehaviorScore(supabase, ctx)
          results.push(result)
        } catch (err) {
          results.push({ company_id: company.id, error: (err as Error).message })
        }
      }
      return jsonResponse({ scope: 'all_active_companies', results })
    }

    const ctx = await extractContext(req, supabase, body)
    const result = await executeBehaviorScore(supabase, ctx, body.counterparty_id)
    return jsonResponse(result)

  } catch (err) {
    console.error('proph3t-behavior-score error:', err)
    return errorResponse((err as Error).message)
  }
})
