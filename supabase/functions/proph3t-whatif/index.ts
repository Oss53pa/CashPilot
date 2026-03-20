import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createServiceClient, extractContext, type TenantContext } from '../_shared/supabase-client.ts'
import { jsonResponse, errorResponse, corsResponse } from '../_shared/response.ts'
import { mean, sum, min } from '../_shared/statistics.ts'
import { toISODate, today, addDays, daysDiff } from '../_shared/date-utils.ts'
import { formatFCFA } from '../_shared/response.ts'
import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ============================================================================
// TYPES
// ============================================================================

interface WhatIfInput {
  company_id?: string
  tenant_id?: string
  query: string
  language?: 'fr' | 'en'
}

type WhatIfIntent =
  | 'position_if_no_payment'
  | 'position_if_investment'
  | 'max_capex_budget'
  | 'credit_line_impact'
  | 'scenario_comparison'
  | 'days_of_cash'
  | 'break_even_date'
  | 'stress_test'

interface ParsedQuery {
  intent: WhatIfIntent
  confidence: number
  entities: {
    counterparty?: string
    amount?: number
    date?: string
    percentage?: number
  }
}

// ============================================================================
// NLP PARSER
// ============================================================================

function parseQuery(query: string, lang: 'fr' | 'en'): ParsedQuery {
  const normalized = query.toLowerCase().trim()
  let intent: WhatIfIntent = 'days_of_cash'
  let confidence = 0.5
  const entities: ParsedQuery['entities'] = {}

  // Intent patterns (FR + EN)
  const patterns: { intent: WhatIfIntent; patterns: RegExp[]; confidence: number }[] = [
    {
      intent: 'position_if_no_payment',
      patterns: [
        /si\s+(?:le\s+)?(?:locataire|client|tenant)\s+(.+?)\s+ne\s+pai/i,
        /if\s+(?:tenant|client)\s+(.+?)\s+(?:doesn't|does not|don't)\s+pay/i,
        /sans\s+(?:le\s+)?paiement\s+(?:de|du)\s+(.+)/i,
        /impayé\s+(?:de|du)\s+(.+)/i,
      ],
      confidence: 0.85,
    },
    {
      intent: 'position_if_investment',
      patterns: [
        /si\s+(?:je|on|nous)\s+(?:place|investis|place)\s+([\d\s.,]+)/i,
        /if\s+(?:I|we)\s+invest\s+([\d\s.,]+)/i,
        /placement\s+(?:de\s+)?([\d\s.,]+)/i,
        /(?:dat|dépôt à terme|term deposit)\s+([\d\s.,]+)/i,
      ],
      confidence: 0.85,
    },
    {
      intent: 'max_capex_budget',
      patterns: [
        /(?:budget|max|maximum)\s+(?:capex|investissement|dépense)/i,
        /(?:combien|how much)\s+.*(?:capex|invest|spend)/i,
        /capex\s+(?:max|disponible|available)/i,
      ],
      confidence: 0.80,
    },
    {
      intent: 'credit_line_impact',
      patterns: [
        /ligne\s+de\s+crédit/i,
        /credit\s+line/i,
        /tirage|drawdown/i,
      ],
      confidence: 0.75,
    },
    {
      intent: 'scenario_comparison',
      patterns: [
        /compar(?:er|aison|e)\s+.*scénario/i,
        /compare\s+.*scenario/i,
      ],
      confidence: 0.70,
    },
    {
      intent: 'days_of_cash',
      patterns: [
        /(?:combien|how many)\s+(?:de\s+)?jours?\s+(?:de\s+)?(?:trésorerie|cash)/i,
        /days?\s+of\s+cash/i,
        /autonomie\s+(?:de\s+)?trésorerie/i,
        /runway/i,
      ],
      confidence: 0.90,
    },
    {
      intent: 'break_even_date',
      patterns: [
        /(?:quand|when)\s+.*(?:équilibre|break\s*even|zéro)/i,
        /date\s+.*(?:équilibre|break\s*even)/i,
        /point\s+mort/i,
      ],
      confidence: 0.80,
    },
    {
      intent: 'stress_test',
      patterns: [
        /stress\s*test/i,
        /([\d]+)\s*%\s+(?:d')?(?:impayé|non[- ]?paiement|non[- ]?payment|default)/i,
        /si\s+([\d]+)\s*%\s+(?:des?\s+)?(?:locataires?|tenants?)\s+ne\s+pai/i,
      ],
      confidence: 0.85,
    },
  ]

  for (const p of patterns) {
    for (const regex of p.patterns) {
      const match = normalized.match(regex)
      if (match) {
        intent = p.intent
        confidence = p.confidence

        // Extract entities from capture groups
        if (match[1]) {
          const captured = match[1].trim()
          // Check if it's a number
          const numMatch = captured.replace(/\s/g, '').replace(',', '.').match(/([\d.]+)\s*([mk])?/i)
          if (numMatch) {
            let amount = parseFloat(numMatch[1])
            const suffix = (numMatch[2] || '').toLowerCase()
            if (suffix === 'm') amount *= 1_000_000
            if (suffix === 'k') amount *= 1_000
            entities.amount = amount * 100 // convert to centimes
          } else {
            entities.counterparty = captured
          }
        }

        // Extract percentage
        const pctMatch = normalized.match(/([\d]+)\s*%/)
        if (pctMatch) entities.percentage = parseInt(pctMatch[1])

        break
      }
    }
    if (confidence > 0.5) break
  }

  return { intent, confidence, entities }
}

// ============================================================================
// SIMULATION ENGINE
// ============================================================================

async function runSimulation(
  supabase: SupabaseClient,
  ctx: TenantContext,
  parsed: ParsedQuery,
  lang: 'fr' | 'en'
): Promise<{ result: Record<string, unknown>; narrative: string }> {
  const isFr = lang === 'fr'

  // Load base data
  const [accounts, forecasts] = await Promise.all([
    supabase.from('bank_accounts').select('*')
      .eq('company_id', ctx.company_id).eq('is_active', true)
      .then(r => r.data ?? []),
    supabase.from('proph3t_forecasts').select('*')
      .eq('company_id', ctx.company_id).eq('scenario', 'base')
      .gte('forecast_date', toISODate(today()))
      .order('forecast_date').limit(60)
      .then(r => r.data ?? []),
  ])

  const totalBalance = sum(accounts.map(a => (a.current_balance as number) || 0))
  const forecastByDate = new Map<string, number>()
  for (const f of forecasts) {
    const date = f.forecast_date as string
    forecastByDate.set(date, (forecastByDate.get(date) || 0) + (f.amount_central as number))
  }

  switch (parsed.intent) {
    case 'position_if_no_payment': {
      // Remove counterparty's expected payments from forecast
      const counterpartyName = parsed.entities.counterparty || 'inconnu'
      const cpForecasts = forecasts.filter(f =>
        ((f.category as string) || '').toLowerCase().includes('receipt')
      )
      const removedAmount = sum(cpForecasts.map(f => (f.amount_central as number) || 0)) * 0.3 // estimate 30%
      const newPosition = totalBalance - removedAmount

      return {
        result: {
          current_position: totalBalance,
          impact_amount: removedAmount,
          new_position: newPosition,
          counterparty: counterpartyName,
        },
        narrative: isFr
          ? `Si ${counterpartyName} ne paie pas, l'impact estimé serait de ${formatFCFA(removedAmount)} sur votre trésorerie. Votre position passerait de ${formatFCFA(totalBalance)} à ${formatFCFA(newPosition)}.${newPosition < 0 ? ' ATTENTION : votre position deviendrait négative.' : ''}`
          : `If ${counterpartyName} doesn't pay, the estimated impact would be ${formatFCFA(removedAmount)} on your treasury. Your position would go from ${formatFCFA(totalBalance)} to ${formatFCFA(newPosition)}.${newPosition < 0 ? ' WARNING: your position would become negative.' : ''}`,
      }
    }

    case 'position_if_investment': {
      const investAmount = parsed.entities.amount || 0
      const newPosition = totalBalance - investAmount

      return {
        result: {
          current_position: totalBalance,
          investment_amount: investAmount,
          new_position: newPosition,
          is_safe: newPosition > 0,
        },
        narrative: isFr
          ? `En plaçant ${formatFCFA(investAmount)}, votre position de trésorerie passerait à ${formatFCFA(newPosition)}. ${newPosition > 0 ? 'Le placement est envisageable.' : 'ATTENTION : votre trésorerie serait insuffisante.'}`
          : `By investing ${formatFCFA(investAmount)}, your treasury position would become ${formatFCFA(newPosition)}. ${newPosition > 0 ? 'The investment is feasible.' : 'WARNING: your treasury would be insufficient.'}`,
      }
    }

    case 'max_capex_budget': {
      // Min forecasted position over next 90 days - safety margin
      let runningPosition = totalBalance
      let minPosition = totalBalance
      for (const [, netFlow] of [...forecastByDate.entries()].sort()) {
        runningPosition += netFlow
        if (runningPosition < minPosition) minPosition = runningPosition
      }
      const safetyMargin = totalBalance * 0.10
      const maxCapex = Math.max(0, minPosition - safetyMargin)

      return {
        result: {
          max_capex: maxCapex,
          current_position: totalBalance,
          min_forecast_position: minPosition,
          safety_margin: safetyMargin,
        },
        narrative: isFr
          ? `Le budget CAPEX maximum disponible est de ${formatFCFA(maxCapex)}, en tenant compte d'une marge de sécurité de 10%. La position minimale prévisionnelle est de ${formatFCFA(minPosition)}.`
          : `Maximum available CAPEX budget is ${formatFCFA(maxCapex)}, considering a 10% safety margin. Minimum forecasted position is ${formatFCFA(minPosition)}.`,
      }
    }

    case 'days_of_cash': {
      // Current position / avg daily disbursement
      const { data: disbursements = [] } = await supabase
        .from('cash_flows')
        .select('amount, flow_date')
        .eq('company_id', ctx.company_id)
        .eq('flow_type', 'disbursement')
        .eq('is_forecast', false)
        .gte('flow_date', toISODate(addDays(today(), -30)))

      const totalDisb = sum(disbursements.map(d => Math.abs((d.amount as number) || 0)))
      const avgDaily = totalDisb / 30
      const daysOfCash = avgDaily > 0 ? Math.round(totalBalance / avgDaily) : 999

      return {
        result: {
          days_of_cash: daysOfCash,
          current_position: totalBalance,
          avg_daily_disbursement: Math.round(avgDaily),
        },
        narrative: isFr
          ? `Avec la position actuelle de ${formatFCFA(totalBalance)} et un décaissement moyen journalier de ${formatFCFA(Math.round(avgDaily))}, vous disposez d'environ ${daysOfCash} jours de trésorerie.`
          : `With the current position of ${formatFCFA(totalBalance)} and an average daily disbursement of ${formatFCFA(Math.round(avgDaily))}, you have approximately ${daysOfCash} days of cash on hand.`,
      }
    }

    case 'stress_test': {
      const haircut = (parsed.entities.percentage || 30) / 100
      // Apply haircut to all receivable forecasts
      const receivableForecasts = forecasts.filter(f =>
        ((f.category as string) || '').includes('receipt')
      )
      const totalExpected = sum(receivableForecasts.map(f => (f.amount_central as number) || 0))
      const lostAmount = Math.round(totalExpected * haircut)
      const stressedPosition = totalBalance - lostAmount

      return {
        result: {
          haircut_pct: haircut * 100,
          expected_receipts: totalExpected,
          lost_amount: lostAmount,
          stressed_position: stressedPosition,
          current_position: totalBalance,
        },
        narrative: isFr
          ? `Stress test avec ${haircut * 100}% d'impayés : sur ${formatFCFA(totalExpected)} de créances attendues, ${formatFCFA(lostAmount)} ne seraient pas recouvrées. Votre position passerait à ${formatFCFA(stressedPosition)}.${stressedPosition < 0 ? ' CRITIQUE : trésorerie négative dans ce scénario.' : ''}`
          : `Stress test with ${haircut * 100}% non-payment: out of ${formatFCFA(totalExpected)} expected receivables, ${formatFCFA(lostAmount)} would not be collected. Position would become ${formatFCFA(stressedPosition)}.${stressedPosition < 0 ? ' CRITICAL: negative treasury in this scenario.' : ''}`,
      }
    }

    case 'break_even_date': {
      let runningPosition = totalBalance
      let breakEvenDate: string | null = null

      for (const [date, netFlow] of [...forecastByDate.entries()].sort()) {
        runningPosition += netFlow
        if (runningPosition <= 0 && !breakEvenDate) {
          breakEvenDate = date
        }
      }

      return {
        result: {
          break_even_date: breakEvenDate,
          current_position: totalBalance,
        },
        narrative: breakEvenDate
          ? (isFr
            ? `Au rythme actuel, la trésorerie atteindrait zéro le ${new Date(breakEvenDate).toLocaleDateString('fr-FR')}. Des actions correctives sont recommandées.`
            : `At the current rate, treasury would reach zero on ${new Date(breakEvenDate).toLocaleDateString('en-US')}. Corrective actions are recommended.`)
          : (isFr
            ? `Aucun point zéro n'est prévu dans l'horizon de prévision. La trésorerie devrait rester positive.`
            : `No break-even point is forecasted within the prediction horizon. Treasury should remain positive.`),
      }
    }

    case 'credit_line_impact': {
      const { data: creditLines = [] } = await supabase
        .from('credit_lines')
        .select('*')
        .eq('company_id', ctx.company_id)
        .eq('is_active', true)

      const totalAvailable = sum(creditLines.map(cl => {
        const limit = (cl.credit_limit as number) || 0
        const used = (cl.used_amount as number) || 0
        return limit - used
      }))

      return {
        result: {
          available_credit: totalAvailable,
          boosted_position: totalBalance + totalAvailable,
          credit_lines: creditLines.length,
        },
        narrative: isFr
          ? `${creditLines.length} ligne(s) de crédit disponible(s) pour un total de ${formatFCFA(totalAvailable)}. L'activation porterait votre position à ${formatFCFA(totalBalance + totalAvailable)}.`
          : `${creditLines.length} credit line(s) available for a total of ${formatFCFA(totalAvailable)}. Activation would bring your position to ${formatFCFA(totalBalance + totalAvailable)}.`,
      }
    }

    default: {
      return {
        result: { current_position: totalBalance },
        narrative: isFr
          ? `Position de trésorerie actuelle : ${formatFCFA(totalBalance)}. Reformulez votre question pour une simulation plus précise.`
          : `Current treasury position: ${formatFCFA(totalBalance)}. Rephrase your question for a more precise simulation.`,
      }
    }
  }
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function executeWhatIf(
  supabase: SupabaseClient,
  ctx: TenantContext,
  queryText: string,
  language: 'fr' | 'en'
): Promise<Record<string, unknown>> {
  const startTime = Date.now()

  // Parse query
  const parsed = parseQuery(queryText, language)

  // Run simulation
  const { result, narrative } = await runSimulation(supabase, ctx, parsed, language)

  const executionMs = Date.now() - startTime

  // Store session
  const session = {
    tenant_id: ctx.tenant_id,
    company_id: ctx.company_id,
    user_id: ctx.user_id || null,
    query_text: queryText,
    intent_detected: parsed.intent,
    confidence: parsed.confidence,
    result,
    narrative,
    execution_ms: executionMs,
  }

  const { data: inserted, error } = await supabase
    .from('proph3t_whatif_sessions')
    .insert(session)
    .select('id')
    .single()

  if (error) {
    console.error('Failed to store what-if session:', error)
  }

  return {
    id: inserted?.id,
    ...session,
  }
}

// ============================================================================
// SERVE
// ============================================================================

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return corsResponse()

  try {
    const supabase = createServiceClient()
    const body = await req.json() as WhatIfInput

    if (!body.query) {
      return errorResponse('Missing required field: query', 400)
    }

    const ctx = await extractContext(req, supabase, body)
    const language = body.language || 'fr'
    const result = await executeWhatIf(supabase, ctx, body.query, language)
    return jsonResponse(result)

  } catch (err) {
    console.error('proph3t-whatif error:', err)
    return errorResponse((err as Error).message)
  }
})
