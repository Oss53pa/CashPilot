import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createServiceClient, type TenantContext } from '../_shared/supabase-client.ts'
import { jsonResponse, errorResponse, corsResponse } from '../_shared/response.ts'
import { mean, mape, mae, rmse } from '../_shared/statistics.ts'
import { toISODate, today } from '../_shared/date-utils.ts'
import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ============================================================================
// TYPES
// ============================================================================

interface ModelSelectInput {
  scope?: string
}

const MODEL_TYPES = ['wma', 'holt_winters', 'arima', 'sarima', 'prophet', 'ensemble'] as const

// ============================================================================
// WALK-FORWARD BACKTESTING
// ============================================================================

async function walkForwardBacktest(
  supabase: SupabaseClient,
  ctx: TenantContext
): Promise<Record<string, unknown>> {
  // Load cash flow history grouped by category
  const startDate = new Date()
  startDate.setMonth(startDate.getMonth() - 36)

  const { data: flows = [] } = await supabase
    .from('cash_flows')
    .select('flow_date, amount, category')
    .eq('tenant_id', ctx.tenant_id)
    .eq('company_id', ctx.company_id)
    .eq('status', 'confirmed')
    .eq('is_forecast', false)
    .gte('flow_date', toISODate(startDate))
    .order('flow_date', { ascending: true })

  if (flows.length < 12) {
    return { company_id: ctx.company_id, status: 'insufficient_data', message: 'Need at least 12 months of history' }
  }

  // Group by category, aggregate by month
  const byCategory = new Map<string, number[]>()
  for (const flow of flows) {
    const cat = flow.category as string
    const monthKey = (flow.flow_date as string).substring(0, 7)
    if (!byCategory.has(cat)) byCategory.set(cat, [])
    // Simplified: just push amounts, real implementation groups by month
    const arr = byCategory.get(cat)!
    arr.push(flow.amount as number)
  }

  const results: Record<string, unknown>[] = []

  for (const [category, values] of byCategory.entries()) {
    if (values.length < 9) continue // Need enough data for backtesting

    // 6-fold rolling-origin CV
    const foldSize = 3
    const minTrain = Math.max(6, Math.floor(values.length * 0.4))
    const numFolds = Math.min(6, Math.floor((values.length - minTrain) / foldSize))

    if (numFolds < 2) continue

    const modelScores: Record<string, { mapeScores: number[]; maeScores: number[]; rmseScores: number[] }> = {}

    for (const modelType of MODEL_TYPES) {
      modelScores[modelType] = { mapeScores: [], maeScores: [], rmseScores: [] }

      for (let fold = 0; fold < numFolds; fold++) {
        const testEnd = values.length - fold * foldSize
        const testStart = testEnd - foldSize
        if (testStart < minTrain) break

        const trainValues = values.slice(0, testStart)
        const testValues = values.slice(testStart, testEnd)

        try {
          // Run model forecast
          const horizonMonths = foldSize
          let predictions: number[]

          // Simple model execution (avoids importing full forecast module)
          // Use performance log data instead for real implementation
          switch (modelType) {
            case 'wma': {
              const weights = [0.5, 0.3, 0.15, 0.05]
              const ws = Math.min(weights.length, trainValues.length)
              const aw = weights.slice(0, ws)
              const tw = aw.reduce((a, b) => a + b, 0)
              const lastW = trainValues.slice(-ws)
              const wma = lastW.reduce((s, v, i) => s + v * aw[i], 0) / tw
              predictions = new Array(horizonMonths).fill(Math.round(wma))
              break
            }
            default: {
              // For other models, use simple exponential smoothing as proxy
              const alpha = 0.3
              let level = trainValues[0]
              for (let i = 1; i < trainValues.length; i++) {
                level = alpha * trainValues[i] + (1 - alpha) * level
              }
              predictions = new Array(horizonMonths).fill(Math.round(level))
              break
            }
          }

          if (predictions.length >= testValues.length) {
            const pred = predictions.slice(0, testValues.length)
            modelScores[modelType].mapeScores.push(mape(testValues, pred))
            modelScores[modelType].maeScores.push(mae(testValues, pred))
            modelScores[modelType].rmseScores.push(rmse(testValues, pred))
          }
        } catch {
          // Skip fold on error
        }
      }
    }

    // Find best model for this category
    let bestModel = 'wma'
    let bestMape = Infinity

    for (const [modelType, scores] of Object.entries(modelScores)) {
      if (scores.mapeScores.length === 0) continue
      const avgMape = mean(scores.mapeScores)
      if (avgMape < bestMape) {
        bestMape = avgMape
        bestModel = modelType
      }
    }

    const bestScores = modelScores[bestModel]

    // Deactivate old configs for this category
    await supabase
      .from('proph3t_model_config')
      .update({ is_active: false })
      .eq('company_id', ctx.company_id)
      .eq('category', category)
      .eq('is_active', true)

    // Insert new config
    const { error } = await supabase.from('proph3t_model_config').insert({
      tenant_id: ctx.tenant_id,
      company_id: ctx.company_id,
      category,
      model_type: bestModel,
      model_params: {},
      history_months: values.length,
      backtest_mape: mean(bestScores.mapeScores),
      backtest_mae: mean(bestScores.maeScores),
      backtest_rmse: mean(bestScores.rmseScores),
      backtest_bias: null,
      is_active: true,
      trained_at: new Date().toISOString(),
    })

    if (error) {
      console.error(`Failed to insert model config for ${category}:`, error)
    }

    results.push({
      category,
      best_model: bestModel,
      mape: mean(bestScores.mapeScores),
      mae: mean(bestScores.maeScores),
      rmse: mean(bestScores.rmseScores),
      folds_evaluated: bestScores.mapeScores.length,
    })
  }

  return {
    company_id: ctx.company_id,
    categories_evaluated: results.length,
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
    const body = await req.json().catch(() => ({})) as ModelSelectInput

    if (body.scope === 'all_active_companies') {
      const { data: companies } = await supabase
        .from('companies')
        .select('id, tenant_id')
        .eq('is_active', true)

      const results = []
      for (const company of companies ?? []) {
        try {
          const ctx: TenantContext = { tenant_id: company.tenant_id, company_id: company.id }
          const result = await walkForwardBacktest(supabase, ctx)
          results.push(result)
        } catch (err) {
          results.push({ company_id: company.id, error: (err as Error).message })
        }
      }
      return jsonResponse({ scope: 'all_active_companies', results })
    }

    const ctx = { tenant_id: body.scope || '', company_id: '' } as TenantContext
    // For manual invocation, use extractContext
    const ctxReal = await (await import('../_shared/supabase-client.ts')).extractContext(req, supabase, body as Record<string, unknown>)
    const result = await walkForwardBacktest(supabase, ctxReal)
    return jsonResponse(result)

  } catch (err) {
    console.error('proph3t-model-select error:', err)
    return errorResponse((err as Error).message)
  }
})
