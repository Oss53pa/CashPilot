import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createServiceClient, type TenantContext } from '../_shared/supabase-client.ts'
import { jsonResponse, errorResponse, corsResponse } from '../_shared/response.ts'
import { sum } from '../_shared/statistics.ts'
import { toISODate, today } from '../_shared/date-utils.ts'
import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ============================================================================
// TYPES
// ============================================================================

interface RecommendationInput {
  tenant_id: string
  company_id: string
  alert_id: string
  alert_rule_id: string
  alert_details: Record<string, unknown>
}

interface RemediationOption {
  action: string
  description: string
  amount: number
  cost: number
  delay_days: number
  impact: string
  probability_of_success: number
  warning?: string
  steps: string[]
  composite_score: number
}

// ============================================================================
// REMEDIATION CATALOG
// ============================================================================

function generateInternalTransfer(
  details: Record<string, unknown>,
  accounts: Record<string, unknown>[]
): RemediationOption | null {
  if (accounts.length < 2) return null

  const sorted = [...accounts].sort((a, b) =>
    ((b.current_balance as number) || 0) - ((a.current_balance as number) || 0)
  )
  const richest = sorted[0]
  const poorest = sorted[sorted.length - 1]

  const richBalance = (richest.current_balance as number) || 0
  const poorBalance = (poorest.current_balance as number) || 0

  if (richBalance <= 0) return null

  const transferAmount = Math.min(
    richBalance * 0.5,
    Math.abs(poorBalance) + richBalance * 0.2
  )

  return {
    action: 'internal_transfer',
    description: `Transférer ${transferAmount} centimes de ${richest.bank_name} vers ${poorest.bank_name}`,
    amount: Math.round(transferAmount),
    cost: 0,
    delay_days: 1,
    impact: 'Rééquilibrage immédiat des positions inter-comptes',
    probability_of_success: 0.95,
    steps: [
      `Initier un virement interne de ${richest.bank_name} - ${richest.account_name}`,
      `Montant: ${transferAmount} centimes`,
      `Destinataire: ${poorest.bank_name} - ${poorest.account_name}`,
      'Valider le virement par double signature',
    ],
    composite_score: 0,
  }
}

function generateCreditLineActivation(
  details: Record<string, unknown>,
  creditLines: Record<string, unknown>[]
): RemediationOption | null {
  const available = creditLines.filter(cl => {
    const limit = (cl.credit_limit as number) || 0
    const used = (cl.used_amount as number) || 0
    return limit - used > 0
  })

  if (available.length === 0) return null

  const bestLine = available.reduce((best, cl) => {
    const bestAvail = ((best.credit_limit as number) || 0) - ((best.used_amount as number) || 0)
    const clAvail = ((cl.credit_limit as number) || 0) - ((cl.used_amount as number) || 0)
    return clAvail > bestAvail ? cl : best
  })

  const availAmount = ((bestLine.credit_limit as number) || 0) - ((bestLine.used_amount as number) || 0)
  const interestRate = (bestLine.interest_rate as number) || 0.05
  const dailyCost = Math.round(availAmount * interestRate / 365)

  return {
    action: 'credit_line_activation',
    description: `Activer la ligne de crédit ${bestLine.bank_name || 'disponible'} (${availAmount} centimes disponibles)`,
    amount: availAmount,
    cost: dailyCost * 30,
    delay_days: 2,
    impact: `Injection de ${availAmount} centimes en trésorerie sous 48h`,
    probability_of_success: 0.90,
    warning: `Coût estimé: ${dailyCost * 30} centimes/mois en intérêts`,
    steps: [
      `Contacter ${bestLine.bank_name || 'la banque'} pour activation`,
      `Fournir les documents requis (derniers états financiers)`,
      `Tirage de ${availAmount} centimes`,
      'Suivi du remboursement dans le plan de trésorerie',
    ],
    composite_score: 0,
  }
}

function generateCapexDeferral(
  details: Record<string, unknown>
): RemediationOption | null {
  const capexRatio = (details.capex_ratio as number) || 0
  if (capexRatio < 0.3) return null

  const forecastedCapex = (details.forecasted_capex as number) || 0
  const deferralAmount = Math.round(forecastedCapex * 0.5)

  return {
    action: 'capex_deferral',
    description: `Reporter 50% des CAPEX prévisionnels (${deferralAmount} centimes)`,
    amount: deferralAmount,
    cost: 0,
    delay_days: 0,
    impact: 'Réduction immédiate de la pression sur la trésorerie',
    probability_of_success: 0.70,
    warning: 'Impact potentiel sur les délais de projet',
    steps: [
      'Identifier les CAPEX reportables (non critiques)',
      'Obtenir validation du comité de direction',
      'Informer les fournisseurs du nouveau calendrier',
      'Mettre à jour le plan de trésorerie',
    ],
    composite_score: 0,
  }
}

function generatePriorityTenantFollowup(
  details: Record<string, unknown>
): RemediationOption | null {
  const counterparties = (details.counterparties as Record<string, unknown>[]) || []
  const critical = counterparties.filter(c => (c.classification as string) === 'critical')

  if (critical.length === 0) return null

  return {
    action: 'priority_tenant_followup',
    description: `Relance prioritaire sur ${critical.length} locataire(s) critique(s)`,
    amount: 0,
    cost: 0,
    delay_days: 3,
    impact: `Amélioration du taux de recouvrement des ${critical.length} locataires les plus risqués`,
    probability_of_success: 0.55,
    steps: [
      `Préparer les dossiers de relance pour ${critical.length} locataires`,
      'Envoyer les mises en demeure par voie recommandée',
      'Planifier les appels de relance téléphonique sous 48h',
      'Évaluer la nécessité de procédures contentieuses sous 15 jours',
    ],
    composite_score: 0,
  }
}

// ============================================================================
// SCORING
// ============================================================================

function scoreRemediation(option: RemediationOption): number {
  const weights = {
    probability: 0.35,
    cost: 0.25,
    speed: 0.20,
    coverage: 0.20,
  }

  const probabilityScore = option.probability_of_success
  const costScore = option.cost === 0 ? 1.0 : Math.max(0, 1 - option.cost / Math.max(1, option.amount))
  const speedScore = Math.max(0, 1 - option.delay_days / 30)
  const coverageScore = option.amount > 0 ? Math.min(1, option.amount / 10_000_000_00) : 0.3 // normalize to 10M

  return (
    weights.probability * probabilityScore +
    weights.cost * costScore +
    weights.speed * speedScore +
    weights.coverage * coverageScore
  )
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function executeRecommendation(
  supabase: SupabaseClient,
  input: RecommendationInput
): Promise<Record<string, unknown>> {
  const ctx: TenantContext = {
    tenant_id: input.tenant_id,
    company_id: input.company_id,
  }

  // Load accounts and credit lines for remediation generation
  const [accounts, creditLines] = await Promise.all([
    supabase
      .from('bank_accounts')
      .select('*')
      .eq('company_id', ctx.company_id)
      .eq('is_active', true)
      .then(r => r.data ?? []),
    supabase
      .from('credit_lines')
      .select('*')
      .eq('company_id', ctx.company_id)
      .eq('is_active', true)
      .then(r => r.data ?? []),
  ])

  // Generate all applicable remediations
  const allOptions: RemediationOption[] = []

  const transfer = generateInternalTransfer(input.alert_details, accounts)
  if (transfer) allOptions.push(transfer)

  const creditLine = generateCreditLineActivation(input.alert_details, creditLines)
  if (creditLine) allOptions.push(creditLine)

  const deferral = generateCapexDeferral(input.alert_details)
  if (deferral) allOptions.push(deferral)

  const followup = generatePriorityTenantFollowup(input.alert_details)
  if (followup) allOptions.push(followup)

  // Score and rank
  for (const option of allOptions) {
    option.composite_score = scoreRemediation(option)
  }

  allOptions.sort((a, b) => b.composite_score - a.composite_score)

  // Take top 3
  const top3 = allOptions.slice(0, 3)

  if (top3.length > 0) {
    const { error } = await supabase.from('proph3t_recommendations').insert({
      tenant_id: ctx.tenant_id,
      company_id: ctx.company_id,
      alert_id: input.alert_id,
      options: top3,
    })

    if (error) {
      console.error('Failed to insert recommendations:', error)
    }
  }

  return {
    alert_id: input.alert_id,
    recommendations_count: top3.length,
    options: top3,
  }
}

// ============================================================================
// SERVE
// ============================================================================

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return corsResponse()

  try {
    const supabase = createServiceClient()
    const body = await req.json() as RecommendationInput

    if (!body.alert_id || !body.tenant_id || !body.company_id) {
      return errorResponse('Missing required fields: alert_id, tenant_id, company_id', 400)
    }

    const result = await executeRecommendation(supabase, body)
    return jsonResponse(result)

  } catch (err) {
    console.error('proph3t-recommendation error:', err)
    return errorResponse((err as Error).message)
  }
})
