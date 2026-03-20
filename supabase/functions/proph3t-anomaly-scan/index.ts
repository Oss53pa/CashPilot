import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createServiceClient, extractContext, type TenantContext } from '../_shared/supabase-client.ts'
import { jsonResponse, errorResponse, corsResponse } from '../_shared/response.ts'
import { mean, stddev, zScore, clamp } from '../_shared/statistics.ts'
import { daysDiff, toISODate, today, cyclicalEncode } from '../_shared/date-utils.ts'
import {
  buildCounterpartyProfile,
  computeVelocity,
  computeZScoreFeatures,
  hourNormality,
  sequentialCount,
} from '../_shared/feature-engineering.ts'
import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ============================================================================
// TYPES
// ============================================================================

interface AnomalyScanInput {
  cash_flow_id?: string
  payment_request_id?: string
  tenant_id?: string
  company_id?: string
  scope?: string
}

interface FeatureContribution {
  feature: string
  value: number
  contribution: number
  description: string
}

type Severity = 'normal' | 'watch' | 'alert' | 'critical'

// ============================================================================
// ISOLATION FOREST (simplified pure-TS implementation)
// ============================================================================

interface IsolationTree {
  splitFeature: number
  splitValue: number
  left: IsolationTree | null
  right: IsolationTree | null
  size: number
}

function buildIsolationTree(
  data: number[][],
  currentDepth: number,
  maxDepth: number
): IsolationTree {
  const n = data.length

  if (currentDepth >= maxDepth || n <= 1) {
    return { splitFeature: -1, splitValue: 0, left: null, right: null, size: n }
  }

  const numFeatures = data[0].length
  const featureIdx = Math.floor(Math.random() * numFeatures)
  const featureValues = data.map(d => d[featureIdx])
  const minVal = Math.min(...featureValues)
  const maxVal = Math.max(...featureValues)

  if (minVal === maxVal) {
    return { splitFeature: -1, splitValue: 0, left: null, right: null, size: n }
  }

  const splitValue = minVal + Math.random() * (maxVal - minVal)
  const leftData = data.filter(d => d[featureIdx] < splitValue)
  const rightData = data.filter(d => d[featureIdx] >= splitValue)

  return {
    splitFeature: featureIdx,
    splitValue,
    left: buildIsolationTree(leftData, currentDepth + 1, maxDepth),
    right: buildIsolationTree(rightData, currentDepth + 1, maxDepth),
    size: n,
  }
}

function pathLength(point: number[], tree: IsolationTree, depth: number): number {
  if (tree.left === null || tree.right === null || tree.splitFeature === -1) {
    // Average path length for remaining data (c(n) approximation)
    const n = tree.size
    if (n <= 1) return depth
    const H = Math.log(n - 1) + 0.5772156649 // Euler-Mascheroni
    return depth + 2 * H - (2 * (n - 1)) / n
  }

  if (point[tree.splitFeature] < tree.splitValue) {
    return pathLength(point, tree.left, depth + 1)
  }
  return pathLength(point, tree.right, depth + 1)
}

function isolationForestScore(
  historicalData: number[][],
  point: number[],
  numTrees: number = 100,
  sampleSize: number = 256
): number {
  if (historicalData.length < 10) return 0.5

  const maxDepth = Math.ceil(Math.log2(Math.min(sampleSize, historicalData.length)))
  const trees: IsolationTree[] = []

  for (let t = 0; t < numTrees; t++) {
    // Random subsample
    const sample: number[][] = []
    const actualSampleSize = Math.min(sampleSize, historicalData.length)
    for (let i = 0; i < actualSampleSize; i++) {
      const idx = Math.floor(Math.random() * historicalData.length)
      sample.push(historicalData[idx])
    }
    trees.push(buildIsolationTree(sample, 0, maxDepth))
  }

  // Average path length across all trees
  const avgPath = trees.reduce((sum, tree) => sum + pathLength(point, tree, 0), 0) / numTrees

  // Anomaly score: 2^(-avgPath / c(n))
  const n = Math.min(sampleSize, historicalData.length)
  const H = Math.log(n - 1) + 0.5772156649
  const cn = 2 * H - (2 * (n - 1)) / n

  return Math.pow(2, -avgPath / cn)
}

// ============================================================================
// FEATURE EXTRACTION
// ============================================================================

interface AnomalyFeatures {
  amount_z_score: number
  timing_deviation: number
  account_frequency: number
  counterparty_known: number
  hour_normality: number
  amount_vs_budget: number
  sequential_count: number
}

async function extractFeatures(
  supabase: SupabaseClient,
  ctx: TenantContext,
  cashFlow: Record<string, unknown>
): Promise<{ features: AnomalyFeatures; historicalFeatureVectors: number[][] }> {
  const flowDate = cashFlow.flow_date as string
  const amount = cashFlow.amount as number
  const category = cashFlow.category as string
  const counterpartyId = cashFlow.counterparty_id as string | null
  const accountId = cashFlow.account_id as string | null

  // Load 90 days of same-category history
  const startDate = new Date(flowDate)
  startDate.setDate(startDate.getDate() - 90)

  const { data: history = [] } = await supabase
    .from('cash_flows')
    .select('id, flow_date, amount, category, counterparty_id, account_id, created_at')
    .eq('tenant_id', ctx.tenant_id)
    .eq('company_id', ctx.company_id)
    .eq('category', category)
    .eq('is_forecast', false)
    .gte('flow_date', toISODate(startDate))
    .lt('flow_date', flowDate)
    .order('flow_date', { ascending: true })

  const histAmounts = history.map((h: Record<string, unknown>) => h.amount as number)

  // Feature 1: Amount Z-score
  const amountZScore = histAmounts.length >= 3 ? zScore(amount, histAmounts) : 0

  // Feature 2: Timing deviation (days since last similar transaction)
  const lastSimilar = history.filter((h: Record<string, unknown>) =>
    h.counterparty_id === counterpartyId
  )
  let timingDeviation = 0
  if (lastSimilar.length >= 2) {
    const intervals: number[] = []
    for (let i = 1; i < lastSimilar.length; i++) {
      intervals.push(daysDiff(
        (lastSimilar[i - 1] as Record<string, unknown>).flow_date as string,
        (lastSimilar[i] as Record<string, unknown>).flow_date as string
      ))
    }
    const avgInterval = mean(intervals)
    const stdInterval = stddev(intervals)
    if (stdInterval > 0 && lastSimilar.length > 0) {
      const daysSinceLast = daysDiff(
        (lastSimilar[lastSimilar.length - 1] as Record<string, unknown>).flow_date as string,
        flowDate
      )
      timingDeviation = Math.abs(daysSinceLast - avgInterval) / stdInterval
    }
  }

  // Feature 3: Account frequency (how often this account is used)
  const accountTxns = history.filter((h: Record<string, unknown>) => h.account_id === accountId)
  const accountFrequency = history.length > 0
    ? 1 - (accountTxns.length / history.length)
    : 0.5

  // Feature 4: Counterparty known
  const profile = buildCounterpartyProfile(
    history.map((h: Record<string, unknown>) => ({
      amount: h.amount as number,
      flow_date: h.flow_date as string,
      counterparty_id: h.counterparty_id as string | null,
    })),
    counterpartyId,
    flowDate
  )
  const counterpartyKnown = profile.is_known ? 0 : 1

  // Feature 5: Hour normality
  const createdAt = cashFlow.created_at as string
  const hour = createdAt ? new Date(createdAt).getUTCHours() : 12
  const hourNorm = hourNormality(hour)

  // Feature 6: Amount vs budget ratio (use category mean as proxy for budget)
  const categoryMean = histAmounts.length > 0 ? mean(histAmounts) : amount
  const amountVsBudget = categoryMean !== 0 ? Math.abs(amount / categoryMean - 1) : 0

  // Feature 7: Sequential count (same amount repeated)
  const seqCount = sequentialCount(histAmounts, amount) / Math.max(1, histAmounts.length)

  const features: AnomalyFeatures = {
    amount_z_score: amountZScore,
    timing_deviation: timingDeviation,
    account_frequency: accountFrequency,
    counterparty_known: counterpartyKnown,
    hour_normality: hourNorm,
    amount_vs_budget: amountVsBudget,
    sequential_count: seqCount,
  }

  // Build historical feature vectors for isolation forest
  const historicalFeatureVectors: number[][] = history.map((h: Record<string, unknown>) => {
    const hAmount = h.amount as number
    const hZScore = histAmounts.length >= 3 ? zScore(hAmount, histAmounts) : 0
    const hAccountTxns = history.filter((hh: Record<string, unknown>) => hh.account_id === h.account_id)
    const hAccountFreq = history.length > 0 ? 1 - (hAccountTxns.length / history.length) : 0.5
    const hCounterpartyKnown = history.some((hh: Record<string, unknown>) =>
      hh.counterparty_id === h.counterparty_id && hh.id !== h.id
    ) ? 0 : 1
    const hCreatedAt = h.created_at as string
    const hHour = hCreatedAt ? new Date(hCreatedAt).getUTCHours() : 12
    const hBudgetRatio = categoryMean !== 0 ? Math.abs(hAmount / categoryMean - 1) : 0

    return [hZScore, 0, hAccountFreq, hCounterpartyKnown, hourNormality(hHour), hBudgetRatio, 0]
  })

  return { features, historicalFeatureVectors }
}

// ============================================================================
// SEVERITY MAPPING + EXPLANATION
// ============================================================================

function mapSeverity(score: number): Severity {
  if (score >= 0.90) return 'critical'
  if (score >= 0.75) return 'alert'
  if (score >= 0.50) return 'watch'
  return 'normal'
}

function generateExplanation(
  features: AnomalyFeatures,
  severity: Severity
): { human_readable: string; top_reasons: FeatureContribution[] } {
  const contributions: FeatureContribution[] = [
    {
      feature: 'amount_z_score',
      value: features.amount_z_score,
      contribution: Math.abs(features.amount_z_score) / 5,
      description: features.amount_z_score > 2
        ? 'Montant significativement supérieur à la moyenne historique'
        : features.amount_z_score < -2
          ? 'Montant significativement inférieur à la moyenne historique'
          : 'Montant dans la plage normale',
    },
    {
      feature: 'timing_deviation',
      value: features.timing_deviation,
      contribution: Math.min(features.timing_deviation / 3, 1),
      description: features.timing_deviation > 2
        ? 'Timing inhabituel par rapport au cycle de paiement habituel'
        : 'Timing cohérent avec l\'historique',
    },
    {
      feature: 'account_frequency',
      value: features.account_frequency,
      contribution: features.account_frequency,
      description: features.account_frequency > 0.7
        ? 'Compte bancaire rarement utilisé pour cette catégorie'
        : 'Compte bancaire habituel',
    },
    {
      feature: 'counterparty_known',
      value: features.counterparty_known,
      contribution: features.counterparty_known,
      description: features.counterparty_known === 1
        ? 'Contrepartie inconnue dans l\'historique'
        : 'Contrepartie connue',
    },
    {
      feature: 'hour_normality',
      value: features.hour_normality,
      contribution: features.hour_normality,
      description: features.hour_normality > 0.5
        ? 'Transaction effectuée en dehors des heures ouvrables'
        : 'Transaction dans les heures normales',
    },
    {
      feature: 'amount_vs_budget',
      value: features.amount_vs_budget,
      contribution: Math.min(features.amount_vs_budget, 1),
      description: features.amount_vs_budget > 0.5
        ? 'Écart significatif par rapport au budget moyen de la catégorie'
        : 'Montant proche du budget habituel',
    },
    {
      feature: 'sequential_count',
      value: features.sequential_count,
      contribution: features.sequential_count,
      description: features.sequential_count > 0.3
        ? 'Montant identique répété de manière suspecte'
        : 'Pas de répétition suspecte',
    },
  ]

  // Sort by contribution descending, take top 3
  contributions.sort((a, b) => b.contribution - a.contribution)
  const top3 = contributions.slice(0, 3)

  const severityLabels: Record<Severity, string> = {
    normal: 'Normal',
    watch: 'À surveiller',
    alert: 'Alerte',
    critical: 'Critique',
  }

  const humanReadable = `[${severityLabels[severity]}] ` +
    top3
      .filter(c => c.contribution > 0.1)
      .map(c => c.description)
      .join('. ') +
    '.'

  return { human_readable: humanReadable, top_reasons: top3 }
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function executeAnomalyScan(
  supabase: SupabaseClient,
  ctx: TenantContext,
  input: AnomalyScanInput
): Promise<Record<string, unknown>> {
  // Load the triggering cash flow
  let cashFlow: Record<string, unknown> | null = null

  if (input.cash_flow_id) {
    const { data } = await supabase
      .from('cash_flows')
      .select('*')
      .eq('id', input.cash_flow_id)
      .eq('tenant_id', ctx.tenant_id)
      .single()
    cashFlow = data
  } else if (input.payment_request_id) {
    // For payment requests, get the linked cash flow or use the request data
    const { data } = await supabase
      .from('payment_requests')
      .select('*')
      .eq('id', input.payment_request_id)
      .eq('tenant_id', ctx.tenant_id)
      .single()
    if (data) {
      cashFlow = {
        id: null,
        flow_date: data.due_date || toISODate(today()),
        amount: data.amount,
        category: data.category || 'disbursement',
        counterparty_id: data.counterparty_id,
        account_id: data.account_id,
        created_at: data.created_at,
      }
    }
  }

  if (!cashFlow) {
    return { status: 'skipped', message: 'No cash flow or payment request found' }
  }

  // Extract features
  const { features, historicalFeatureVectors } = await extractFeatures(
    supabase, ctx, cashFlow
  )

  // Build feature vector for current transaction
  const currentVector = [
    features.amount_z_score,
    features.timing_deviation,
    features.account_frequency,
    features.counterparty_known,
    features.hour_normality,
    features.amount_vs_budget,
    features.sequential_count,
  ]

  // Run isolation forest
  const anomalyScore = isolationForestScore(historicalFeatureVectors, currentVector, 100, 256)

  // Map to severity
  const severity = mapSeverity(anomalyScore)

  // Generate explanation
  const { human_readable, top_reasons } = generateExplanation(features, severity)

  // Only store if not normal (to avoid noise)
  if (severity !== 'normal') {
    const { error } = await supabase.from('proph3t_anomalies').insert({
      tenant_id: ctx.tenant_id,
      company_id: ctx.company_id,
      cash_flow_id: input.cash_flow_id || null,
      payment_request_id: input.payment_request_id || null,
      anomaly_score: anomalyScore,
      severity,
      features: features as unknown as Record<string, number>,
      top_reasons,
      human_readable,
      status: 'open',
    })

    if (error) throw error
  }

  return {
    cash_flow_id: input.cash_flow_id,
    payment_request_id: input.payment_request_id,
    anomaly_score: anomalyScore,
    severity,
    human_readable,
    features,
  }
}

// ============================================================================
// SERVE
// ============================================================================

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return corsResponse()

  try {
    const supabase = createServiceClient()
    const body = await req.json().catch(() => ({})) as AnomalyScanInput

    // Handle batch scope (all active companies)
    if (body.scope === 'all_active_companies') {
      // Batch mode: scan recent unscanned cash flows
      const { data: companies } = await supabase
        .from('companies')
        .select('id, tenant_id')
        .eq('is_active', true)

      const results = []
      for (const company of companies ?? []) {
        try {
          const ctx: TenantContext = { tenant_id: company.tenant_id, company_id: company.id }

          // Get recent cash flows not yet scanned
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
              const result = await executeAnomalyScan(supabase, ctx, { cash_flow_id: flow.id })
              results.push(result)
            } catch (err) {
              results.push({ cash_flow_id: flow.id, error: (err as Error).message })
            }
          }
        } catch (err) {
          results.push({ company_id: company.id, error: (err as Error).message })
        }
      }

      return jsonResponse({ scope: 'all_active_companies', scanned: results.length, results })
    }

    // Single transaction scan
    const ctx = await extractContext(req, supabase, body)
    const result = await executeAnomalyScan(supabase, ctx, body)
    return jsonResponse(result)

  } catch (err) {
    console.error('proph3t-anomaly-scan error:', err)
    return errorResponse((err as Error).message)
  }
})
