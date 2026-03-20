import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createServiceClient, extractContext, type TenantContext } from '../_shared/supabase-client.ts'
import { jsonResponse, errorResponse, corsResponse } from '../_shared/response.ts'
import { mean, sum, mape } from '../_shared/statistics.ts'
import { toISODate, today, addDays } from '../_shared/date-utils.ts'
import { formatFCFA } from '../_shared/response.ts'
import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ============================================================================
// TYPES
// ============================================================================

interface NarrativeInput {
  company_id?: string
  tenant_id?: string
  language?: 'fr' | 'en'
  scope?: string
}

type Sentiment = 'positive' | 'neutral' | 'warning' | 'critical'

interface NarrativeSection {
  title: string
  content: string
  sentiment: Sentiment
  data_points: { label: string; value: string | number }[]
}

// ============================================================================
// DATA LOADING
// ============================================================================

async function loadNarrativeData(supabase: SupabaseClient, ctx: TenantContext) {
  const now = today()
  const weekAgo = toISODate(addDays(now, -7))
  const nowStr = toISODate(now)

  const [forecasts, alerts, scores, anomalies, cashFlows, accounts, perfLogs] = await Promise.all([
    supabase.from('proph3t_forecasts')
      .select('*')
      .eq('company_id', ctx.company_id)
      .eq('scenario', 'base')
      .gte('forecast_date', nowStr)
      .order('forecast_date')
      .limit(30)
      .then(r => r.data ?? []),

    supabase.from('proph3t_alerts')
      .select('*')
      .eq('company_id', ctx.company_id)
      .gte('created_at', weekAgo)
      .order('priority')
      .then(r => r.data ?? []),

    supabase.from('proph3t_tenant_scores')
      .select('*')
      .eq('company_id', ctx.company_id)
      .gte('scored_at', weekAgo)
      .then(r => r.data ?? []),

    supabase.from('proph3t_anomalies')
      .select('*')
      .eq('company_id', ctx.company_id)
      .gte('detected_at', weekAgo)
      .then(r => r.data ?? []),

    supabase.from('cash_flows')
      .select('*')
      .eq('company_id', ctx.company_id)
      .eq('is_forecast', false)
      .gte('flow_date', weekAgo)
      .then(r => r.data ?? []),

    supabase.from('bank_accounts')
      .select('*')
      .eq('company_id', ctx.company_id)
      .eq('is_active', true)
      .then(r => r.data ?? []),

    supabase.from('proph3t_performance_log')
      .select('*')
      .eq('company_id', ctx.company_id)
      .eq('is_realized', true)
      .gte('run_date', weekAgo)
      .then(r => r.data ?? []),
  ])

  return { forecasts, alerts, scores, anomalies, cashFlows, accounts, perfLogs }
}

// ============================================================================
// TEMPLATE-BASED GENERATION
// ============================================================================

function generateSections(
  data: Awaited<ReturnType<typeof loadNarrativeData>>,
  lang: 'fr' | 'en'
): NarrativeSection[] {
  const sections: NarrativeSection[] = []
  const isFr = lang === 'fr'

  const totalBalance = sum(data.accounts.map(a => (a.current_balance as number) || 0))
  const totalReceipts = sum(data.cashFlows.filter(f => (f.flow_type as string) === 'receipt').map(f => (f.amount as number) || 0))
  const totalDisbursements = sum(data.cashFlows.filter(f => (f.flow_type as string) === 'disbursement').map(f => Math.abs((f.amount as number) || 0)))

  // 1. Situation Générale
  const balanceSentiment: Sentiment = totalBalance > 0 ? 'positive' : 'critical'
  sections.push({
    title: isFr ? 'Situation Générale' : 'General Situation',
    content: isFr
      ? `La position de trésorerie globale s'établit à ${formatFCFA(totalBalance)}. Sur la semaine écoulée, les encaissements ont totalisé ${formatFCFA(totalReceipts)} et les décaissements ${formatFCFA(totalDisbursements)}, soit un flux net de ${formatFCFA(totalReceipts - totalDisbursements)}.`
      : `Overall treasury position stands at ${formatFCFA(totalBalance)}. Over the past week, receipts totaled ${formatFCFA(totalReceipts)} and disbursements ${formatFCFA(totalDisbursements)}, yielding a net flow of ${formatFCFA(totalReceipts - totalDisbursements)}.`,
    sentiment: balanceSentiment,
    data_points: [
      { label: isFr ? 'Position globale' : 'Global position', value: formatFCFA(totalBalance) },
      { label: isFr ? 'Encaissements' : 'Receipts', value: formatFCFA(totalReceipts) },
      { label: isFr ? 'Décaissements' : 'Disbursements', value: formatFCFA(totalDisbursements) },
    ],
  })

  // 2. Points d'Attention
  const criticalAlerts = data.alerts.filter(a => (a.priority as string) === 'critical')
  const highAlerts = data.alerts.filter(a => (a.priority as string) === 'high')
  const criticalAnomalies = data.anomalies.filter(a => (a.severity as string) === 'critical')

  const attentionSentiment: Sentiment = criticalAlerts.length > 0 ? 'critical' : highAlerts.length > 0 ? 'warning' : 'neutral'
  const alertSummary = isFr
    ? `${criticalAlerts.length} alerte(s) critique(s) et ${highAlerts.length} alerte(s) haute(s) cette semaine. ${criticalAnomalies.length} anomalie(s) critique(s) détectée(s).`
    : `${criticalAlerts.length} critical and ${highAlerts.length} high alert(s) this week. ${criticalAnomalies.length} critical anomaly(ies) detected.`

  const alertDetails = data.alerts.slice(0, 3).map(a =>
    `- ${a.title}: ${a.summary}`
  ).join('\n')

  sections.push({
    title: isFr ? 'Points d\'Attention' : 'Key Concerns',
    content: `${alertSummary}${alertDetails ? '\n\n' + alertDetails : ''}`,
    sentiment: attentionSentiment,
    data_points: [
      { label: isFr ? 'Alertes critiques' : 'Critical alerts', value: criticalAlerts.length },
      { label: isFr ? 'Alertes hautes' : 'High alerts', value: highAlerts.length },
      { label: isFr ? 'Anomalies critiques' : 'Critical anomalies', value: criticalAnomalies.length },
    ],
  })

  // 3. Prévision Semaine
  const weekForecasts = data.forecasts.filter(f => (f.horizon as number) <= 30)
  const forecastTotal = sum(weekForecasts.map(f => (f.amount_central as number) || 0))
  const forecastSentiment: Sentiment = forecastTotal >= 0 ? 'positive' : forecastTotal > -totalBalance ? 'warning' : 'critical'

  sections.push({
    title: isFr ? 'Prévision Semaine' : 'Week Forecast',
    content: isFr
      ? `Les prévisions à 30 jours anticipent un flux net de ${formatFCFA(forecastTotal)}. ${forecastTotal >= 0 ? 'La situation devrait rester confortable.' : 'Attention : les prévisions indiquent une pression sur la trésorerie.'}`
      : `30-day forecasts anticipate a net flow of ${formatFCFA(forecastTotal)}. ${forecastTotal >= 0 ? 'The situation should remain comfortable.' : 'Warning: forecasts indicate treasury pressure.'}`,
    sentiment: forecastSentiment,
    data_points: [
      { label: isFr ? 'Flux net prévu (30j)' : 'Expected net flow (30d)', value: formatFCFA(forecastTotal) },
      { label: isFr ? 'Catégories' : 'Categories', value: new Set(weekForecasts.map(f => f.category)).size },
    ],
  })

  // 4. Bonnes Nouvelles
  const goodScores = data.scores.filter(s => (s.classification as string) === 'excellent' || (s.classification as string) === 'good')
  const improvingScores = data.scores.filter(s => (s.trend as string) === 'improving')

  sections.push({
    title: isFr ? 'Bonnes Nouvelles' : 'Good News',
    content: isFr
      ? `${goodScores.length} locataire(s) avec un score excellent ou bon. ${improvingScores.length} locataire(s) en amélioration. ${totalReceipts > totalDisbursements ? 'Les encaissements dépassent les décaissements cette semaine.' : ''}`
      : `${goodScores.length} tenant(s) with excellent or good scores. ${improvingScores.length} tenant(s) improving. ${totalReceipts > totalDisbursements ? 'Receipts exceeded disbursements this week.' : ''}`,
    sentiment: goodScores.length > data.scores.length * 0.5 ? 'positive' : 'neutral',
    data_points: [
      { label: isFr ? 'Scores excellents/bons' : 'Excellent/good scores', value: goodScores.length },
      { label: isFr ? 'En amélioration' : 'Improving', value: improvingScores.length },
    ],
  })

  // 5. Vigilance CAPEX
  const capexFlows = data.cashFlows.filter(f => (f.category as string) === 'capex' || (f.category as string) === 'investment')
  const totalCapex = sum(capexFlows.map(f => Math.abs((f.amount as number) || 0)))
  const capexRatio = totalBalance > 0 ? totalCapex / totalBalance : 0

  sections.push({
    title: isFr ? 'Vigilance CAPEX' : 'CAPEX Watch',
    content: isFr
      ? `CAPEX de la semaine : ${formatFCFA(totalCapex)} (${Math.round(capexRatio * 100)}% de la trésorerie). ${capexRatio > 0.5 ? 'La part CAPEX est élevée — surveiller les engagements à venir.' : 'Les investissements restent dans les limites prudentielles.'}`
      : `Weekly CAPEX: ${formatFCFA(totalCapex)} (${Math.round(capexRatio * 100)}% of treasury). ${capexRatio > 0.5 ? 'CAPEX share is high — monitor upcoming commitments.' : 'Investments remain within prudent limits.'}`,
    sentiment: capexRatio > 0.5 ? 'warning' : 'neutral',
    data_points: [
      { label: 'CAPEX', value: formatFCFA(totalCapex) },
      { label: isFr ? 'Ratio CAPEX/Trésorerie' : 'CAPEX/Treasury ratio', value: `${Math.round(capexRatio * 100)}%` },
    ],
  })

  // 6. Performance Modèle
  const realizedLogs = data.perfLogs.filter(l => l.is_realized && l.actual_amount != null)
  let modelMape = 0
  if (realizedLogs.length > 0) {
    const actuals = realizedLogs.map(l => l.actual_amount as number)
    const predicted = realizedLogs.map(l => l.predicted_amount as number)
    modelMape = mape(actuals, predicted)
  }

  sections.push({
    title: isFr ? 'Performance Modèle' : 'Model Performance',
    content: isFr
      ? `${realizedLogs.length} prévision(s) vérifiée(s) cette semaine avec un MAPE de ${(modelMape * 100).toFixed(1)}%. ${modelMape < 0.10 ? 'Les modèles fonctionnent avec une excellente précision.' : modelMape < 0.20 ? 'Précision acceptable, mais un recalibrage pourrait être bénéfique.' : 'La précision est dégradée — un réentraînement est recommandé.'}`
      : `${realizedLogs.length} prediction(s) verified this week with MAPE of ${(modelMape * 100).toFixed(1)}%. ${modelMape < 0.10 ? 'Models are performing with excellent accuracy.' : modelMape < 0.20 ? 'Acceptable accuracy, but recalibration may help.' : 'Accuracy is degraded — retraining recommended.'}`,
    sentiment: modelMape < 0.10 ? 'positive' : modelMape < 0.20 ? 'neutral' : 'warning',
    data_points: [
      { label: 'MAPE', value: `${(modelMape * 100).toFixed(1)}%` },
      { label: isFr ? 'Prévisions vérifiées' : 'Verified predictions', value: realizedLogs.length },
    ],
  })

  return sections
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function executeNarrative(
  supabase: SupabaseClient,
  ctx: TenantContext,
  language: 'fr' | 'en'
): Promise<Record<string, unknown>> {
  const data = await loadNarrativeData(supabase, ctx)
  const sections = generateSections(data, language)

  // Overall sentiment = worst section sentiment
  const sentimentOrder: Sentiment[] = ['positive', 'neutral', 'warning', 'critical']
  const overallSentiment = sections.reduce<Sentiment>((worst, section) => {
    return sentimentOrder.indexOf(section.sentiment) > sentimentOrder.indexOf(worst)
      ? section.sentiment
      : worst
  }, 'positive')

  const fullText = sections.map(s => `## ${s.title}\n\n${s.content}`).join('\n\n---\n\n')

  const now = today()
  const weekAgo = addDays(now, -7)

  const narrative = {
    tenant_id: ctx.tenant_id,
    company_id: ctx.company_id,
    period_start: toISODate(weekAgo),
    period_end: toISODate(now),
    scope: 'company',
    sections,
    full_text: fullText,
    sentiment: overallSentiment,
    key_metrics: {
      total_balance: sum(data.accounts.map(a => (a.current_balance as number) || 0)),
      alerts_count: data.alerts.length,
      anomalies_count: data.anomalies.length,
      scores_count: data.scores.length,
    },
    language,
  }

  const { error } = await supabase.from('proph3t_narratives').insert(narrative)
  if (error) throw error

  return { ...narrative, status: 'generated' }
}

// ============================================================================
// SERVE
// ============================================================================

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return corsResponse()

  try {
    const supabase = createServiceClient()
    const body = await req.json().catch(() => ({})) as NarrativeInput
    const language = body.language || 'fr'

    if (body.scope === 'all_active_companies') {
      const { data: companies } = await supabase
        .from('companies')
        .select('id, tenant_id')
        .eq('is_active', true)

      const results = []
      for (const company of companies ?? []) {
        try {
          const ctx: TenantContext = { tenant_id: company.tenant_id, company_id: company.id }
          const result = await executeNarrative(supabase, ctx, language)
          results.push(result)
        } catch (err) {
          results.push({ company_id: company.id, error: (err as Error).message })
        }
      }
      return jsonResponse({ scope: 'all_active_companies', results })
    }

    const ctx = await extractContext(req, supabase, body)
    const result = await executeNarrative(supabase, ctx, language)
    return jsonResponse(result)

  } catch (err) {
    console.error('proph3t-narrative error:', err)
    return errorResponse((err as Error).message)
  }
})
