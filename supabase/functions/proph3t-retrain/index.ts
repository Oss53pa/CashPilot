import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createServiceClient, type TenantContext } from '../_shared/supabase-client.ts'
import { jsonResponse, errorResponse, corsResponse } from '../_shared/response.ts'
import { mean, stddev, linearRegression } from '../_shared/statistics.ts'
import { toISODate, today } from '../_shared/date-utils.ts'
import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ============================================================================
// TYPES
// ============================================================================

interface RetrainInput {
  scope?: string
}

// ============================================================================
// RETRAIN LOGIC
// ============================================================================

async function executeRetrain(
  supabase: SupabaseClient,
  ctx: TenantContext
): Promise<Record<string, unknown>> {
  // Load active model configs
  const { data: configs = [] } = await supabase
    .from('proph3t_model_config')
    .select('*')
    .eq('company_id', ctx.company_id)
    .eq('is_active', true)

  if (configs.length === 0) {
    return { company_id: ctx.company_id, status: 'no_active_models', message: 'No active model configs to retrain' }
  }

  // Load full history (36 months)
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

  // Group by category
  const byCategory = new Map<string, { date: string; amount: number }[]>()
  for (const flow of flows) {
    const cat = flow.category as string
    if (!byCategory.has(cat)) byCategory.set(cat, [])
    byCategory.get(cat)!.push({
      date: flow.flow_date as string,
      amount: flow.amount as number,
    })
  }

  const results: Record<string, unknown>[] = []

  for (const config of configs) {
    const category = config.category as string
    const modelType = config.model_type as string
    const data = byCategory.get(category) || []

    if (data.length < 12) {
      results.push({ category, status: 'skipped', reason: 'insufficient_history' })
      continue
    }

    // Aggregate by month
    const monthlyMap = new Map<string, number>()
    for (const d of data) {
      const key = d.date.substring(0, 7)
      monthlyMap.set(key, (monthlyMap.get(key) || 0) + d.amount)
    }
    const values = [...monthlyMap.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, v]) => v)

    // Re-estimate model parameters based on model type
    const params: Record<string, unknown> = {}

    switch (modelType) {
      case 'arima':
      case 'sarima': {
        // Re-estimate AR/MA parameters from full dataset
        const m = mean(values)
        const ar: number[] = []
        for (let lag = 1; lag <= 3; lag++) {
          let num = 0, den = 0
          for (let t = lag; t < values.length; t++) {
            num += (values[t] - m) * (values[t - lag] - m)
            den += (values[t - lag] - m) ** 2
          }
          ar.push(den !== 0 ? num / den : 0)
        }
        params.ar_coefficients = ar
        params.mean = m
        params.stddev = stddev(values)

        if (modelType === 'sarima') {
          // Estimate seasonal pattern
          const period = 12
          const seasonal: number[] = new Array(period).fill(0)
          const counts: number[] = new Array(period).fill(0)
          for (let i = 0; i < values.length; i++) {
            seasonal[i % period] += values[i] - m
            counts[i % period]++
          }
          params.seasonal = seasonal.map((s, i) => counts[i] > 0 ? s / counts[i] : 0)
        }
        break
      }

      case 'prophet': {
        // Re-estimate trend and seasonal components
        const x = values.map((_, i) => i)
        const { slope, intercept } = linearRegression(x, values)
        params.trend_slope = slope
        params.trend_intercept = intercept

        const period = 12
        const detrended = values.map((v, i) => v - (intercept + slope * i))
        const seasonal: number[] = new Array(period).fill(0)
        const counts: number[] = new Array(period).fill(0)
        for (let i = 0; i < detrended.length; i++) {
          seasonal[i % period] += detrended[i]
          counts[i % period]++
        }
        params.seasonal = seasonal.map((s, i) => counts[i] > 0 ? s / counts[i] : 0)
        break
      }

      case 'lstm': {
        // For LSTM, store weight dimensions and training metadata
        // Full weight storage would go to Supabase Storage
        params.lookback = 12
        params.hidden_size = 8
        params.epochs = 100
        params.last_values = values.slice(-12) // for initialization
        break
      }

      default: {
        // WMA/Holt-Winters: simple parameter estimation
        if (values.length >= 4) {
          params.last_4_values = values.slice(-4)
          params.mean = mean(values)
        }
        break
      }
    }

    // Update model config with new params
    const { error } = await supabase
      .from('proph3t_model_config')
      .update({
        model_params: params,
        history_months: values.length,
        trained_at: new Date().toISOString(),
      })
      .eq('id', config.id)

    if (error) {
      console.error(`Failed to update config for ${category}:`, error)
      results.push({ category, modelType, status: 'error', error: error.message })
    } else {
      results.push({
        category,
        model_type: modelType,
        status: 'retrained',
        history_months: values.length,
        params_keys: Object.keys(params),
      })
    }
  }

  return {
    company_id: ctx.company_id,
    retrained_count: results.filter(r => (r as Record<string, unknown>).status === 'retrained').length,
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
    const body = await req.json().catch(() => ({})) as RetrainInput

    if (body.scope === 'all_active_companies') {
      const { data: companies } = await supabase
        .from('companies')
        .select('id, tenant_id')
        .eq('is_active', true)

      const results = []
      for (const company of companies ?? []) {
        try {
          const ctx: TenantContext = { tenant_id: company.tenant_id, company_id: company.id }
          const result = await executeRetrain(supabase, ctx)
          results.push(result)
        } catch (err) {
          results.push({ company_id: company.id, error: (err as Error).message })
        }
      }
      return jsonResponse({ scope: 'all_active_companies', results })
    }

    const { extractContext } = await import('../_shared/supabase-client.ts')
    const ctx = await extractContext(req, supabase, body as Record<string, unknown>)
    const result = await executeRetrain(supabase, ctx)
    return jsonResponse(result)

  } catch (err) {
    console.error('proph3t-retrain error:', err)
    return errorResponse((err as Error).message)
  }
})
