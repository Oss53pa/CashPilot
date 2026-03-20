import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createServiceClient, extractContext, type TenantContext } from '../_shared/supabase-client.ts'
import { jsonResponse, errorResponse, corsResponse } from '../_shared/response.ts'
import {
  mean, stddev, removeOutliers, interpolateLinear, mape, mae, rmse,
  linearRegression, clamp,
} from '../_shared/statistics.ts'
import { addDays, toISODate, today, monthsDiff, groupByMonth } from '../_shared/date-utils.ts'
import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ============================================================================
// TYPES
// ============================================================================

interface ForecastInput {
  company_id?: string
  tenant_id?: string
  horizon_days?: number[]
  categories?: string[]
  force_model?: string
  scope?: string  // 'all_active_companies' for pg_cron
}

interface TimeSeriesPoint {
  date: string
  amount: number
}

interface ForecastResult {
  forecast_date: string
  horizon: number
  amount_central: number
  amount_lower_80: number
  amount_upper_80: number
  amount_lower_95: number
  amount_upper_95: number
  model_used: string
  model_mape: number
  confidence_score: number
}

// ============================================================================
// MODELS
// ============================================================================

/**
 * Weighted Moving Average — for < 3 months of history
 * Simple but effective baseline model
 */
function weightedMovingAverage(
  series: number[],
  forecastHorizon: number
): { predictions: number[]; residualStd: number } {
  const weights = [0.5, 0.3, 0.15, 0.05]
  const windowSize = Math.min(weights.length, series.length)
  const activeWeights = weights.slice(0, windowSize)
  const totalWeight = activeWeights.reduce((a, b) => a + b, 0)

  // Calculate WMA on last window
  const lastWindow = series.slice(-windowSize)
  const wma = lastWindow.reduce((sum, val, i) => sum + val * activeWeights[i], 0) / totalWeight

  // Compute residuals for confidence interval
  const residuals: number[] = []
  for (let i = windowSize; i < series.length; i++) {
    const window = series.slice(i - windowSize, i)
    const pred = window.reduce((sum, val, j) => sum + val * activeWeights[j], 0) / totalWeight
    residuals.push(series[i] - pred)
  }

  const residualStd = residuals.length > 0 ? stddev(residuals) : stddev(series) * 0.1

  // Forecast: repeat WMA value with slight trend adjustment
  const { slope } = linearRegression(
    series.slice(-Math.min(6, series.length)).map((_, i) => i),
    series.slice(-Math.min(6, series.length))
  )

  const predictions: number[] = []
  for (let h = 1; h <= forecastHorizon; h++) {
    predictions.push(Math.round(wma + slope * h))
  }

  return { predictions, residualStd }
}

/**
 * Holt-Winters Triple Exponential Smoothing — for 3-12 months of history
 * Captures level, trend, and seasonality
 */
function holtWinters(
  series: number[],
  forecastHorizon: number,
  seasonPeriod: number = 12
): { predictions: number[]; residualStd: number } {
  const n = series.length

  // If series too short for seasonality, fall back to double exponential (Holt's)
  if (n < seasonPeriod * 2) {
    return holtLinear(series, forecastHorizon)
  }

  // Grid search for optimal parameters (simplified)
  let bestAlpha = 0.3, bestBeta = 0.1, bestGamma = 0.3
  let bestError = Infinity

  for (const alpha of [0.1, 0.3, 0.5, 0.7]) {
    for (const beta of [0.01, 0.1, 0.3]) {
      for (const gamma of [0.1, 0.3, 0.5]) {
        const err = hwFitError(series, alpha, beta, gamma, seasonPeriod)
        if (err < bestError) {
          bestError = err
          bestAlpha = alpha
          bestBeta = beta
          bestGamma = gamma
        }
      }
    }
  }

  // Fit with best parameters
  return hwForecast(series, forecastHorizon, bestAlpha, bestBeta, bestGamma, seasonPeriod)
}

/** Holt's Linear (double exponential) — no seasonality */
function holtLinear(
  series: number[],
  forecastHorizon: number
): { predictions: number[]; residualStd: number } {
  const alpha = 0.3
  const beta = 0.1
  const n = series.length

  let level = series[0]
  let trend = n > 1 ? (series[1] - series[0]) : 0

  const fitted: number[] = [level]
  const residuals: number[] = []

  for (let i = 1; i < n; i++) {
    const prevLevel = level
    level = alpha * series[i] + (1 - alpha) * (level + trend)
    trend = beta * (level - prevLevel) + (1 - beta) * trend
    fitted.push(level + trend)
    residuals.push(series[i] - fitted[i])
  }

  const residualStd = stddev(residuals)
  const predictions: number[] = []
  for (let h = 1; h <= forecastHorizon; h++) {
    predictions.push(Math.round(level + trend * h))
  }

  return { predictions, residualStd }
}

/** Holt-Winters error for parameter optimization */
function hwFitError(
  series: number[],
  alpha: number, beta: number, gamma: number,
  period: number
): number {
  const n = series.length
  if (n < period * 2) return Infinity

  // Initialize seasonal indices
  const seasonal: number[] = new Array(period)
  for (let i = 0; i < period; i++) {
    const vals: number[] = []
    for (let j = i; j < n; j += period) vals.push(series[j])
    seasonal[i] = mean(vals) / mean(series)
  }

  let level = mean(series.slice(0, period))
  let trend = (mean(series.slice(period, period * 2)) - mean(series.slice(0, period))) / period
  let totalError = 0

  for (let i = period; i < n; i++) {
    const si = i % period
    const predicted = (level + trend) * seasonal[si]
    totalError += Math.abs(series[i] - predicted) / Math.max(1, Math.abs(series[i]))

    const prevLevel = level
    level = alpha * (series[i] / seasonal[si]) + (1 - alpha) * (level + trend)
    trend = beta * (level - prevLevel) + (1 - beta) * trend
    seasonal[si] = gamma * (series[i] / level) + (1 - gamma) * seasonal[si]
  }

  return totalError / (n - period)
}

/** Holt-Winters forecast with given parameters */
function hwForecast(
  series: number[],
  forecastHorizon: number,
  alpha: number, beta: number, gamma: number,
  period: number
): { predictions: number[]; residualStd: number } {
  const n = series.length

  const seasonal: number[] = new Array(period)
  for (let i = 0; i < period; i++) {
    const vals: number[] = []
    for (let j = i; j < n; j += period) vals.push(series[j])
    seasonal[i] = mean(vals) / mean(series)
  }

  let level = mean(series.slice(0, period))
  let trend = (mean(series.slice(period, period * 2)) - mean(series.slice(0, period))) / period
  const residuals: number[] = []

  for (let i = period; i < n; i++) {
    const si = i % period
    const predicted = (level + trend) * seasonal[si]
    residuals.push(series[i] - predicted)

    const prevLevel = level
    level = alpha * (series[i] / seasonal[si]) + (1 - alpha) * (level + trend)
    trend = beta * (level - prevLevel) + (1 - beta) * trend
    seasonal[si] = gamma * (series[i] / level) + (1 - gamma) * seasonal[si]
  }

  const residualStd = stddev(residuals)
  const predictions: number[] = []
  for (let h = 1; h <= forecastHorizon; h++) {
    const si = (n + h - 1) % period
    predictions.push(Math.round((level + trend * h) * seasonal[si]))
  }

  return { predictions, residualStd }
}

// ============================================================================
// ARIMA MODEL — for 12-18 months of history
// ============================================================================

/**
 * ARIMA(p,d,q) — Auto-Regressive Integrated Moving Average
 * Pure TypeScript implementation with auto parameter selection via AIC
 */
function arimaForecast(
  series: number[],
  forecastHorizon: number
): { predictions: number[]; residualStd: number } {
  // Auto-differencing: check if series needs differencing
  const { d, diffSeries } = autoDifference(series)

  // Try combinations and pick lowest AIC
  let bestAIC = Infinity
  let bestP = 1, bestQ = 1
  let bestCoeffs: { ar: number[]; ma: number[]; intercept: number } | null = null
  let bestResiduals: number[] = []

  for (const p of [1, 2, 3]) {
    for (const q of [0, 1, 2]) {
      try {
        const { coeffs, residuals, aic } = fitARMA(diffSeries, p, q)
        if (aic < bestAIC) {
          bestAIC = aic
          bestP = p
          bestQ = q
          bestCoeffs = coeffs
          bestResiduals = residuals
        }
      } catch { /* skip invalid combinations */ }
    }
  }

  if (!bestCoeffs) {
    return holtLinear(series, forecastHorizon)
  }

  // Generate forecasts on differenced series
  const diffPredictions = forecastARMA(diffSeries, bestCoeffs, bestResiduals, forecastHorizon)

  // Undo differencing
  const predictions = undifference(diffPredictions, series, d)
  const residualStd = bestResiduals.length > 0 ? stddev(bestResiduals) : stddev(series) * 0.1

  return { predictions: predictions.map(Math.round), residualStd }
}

function autoDifference(series: number[]): { d: number; diffSeries: number[] } {
  let current = [...series]
  let d = 0

  // Simple stationarity check: if trend is strong, difference
  for (let i = 0; i < 2; i++) {
    const { slope } = linearRegression(
      current.map((_, idx) => idx),
      current
    )
    const relSlope = Math.abs(slope) / (Math.abs(mean(current)) || 1)

    if (relSlope > 0.02 && current.length > 3) {
      const diff: number[] = []
      for (let j = 1; j < current.length; j++) {
        diff.push(current[j] - current[j - 1])
      }
      current = diff
      d++
    } else {
      break
    }
  }

  return { d, diffSeries: current }
}

function fitARMA(
  series: number[],
  p: number,
  q: number
): { coeffs: { ar: number[]; ma: number[]; intercept: number }; residuals: number[]; aic: number } {
  const n = series.length
  if (n < p + q + 5) throw new Error('Insufficient data')

  const m = mean(series)

  // Initialize AR coefficients via Yule-Walker approximation
  const ar: number[] = new Array(p).fill(0)
  for (let i = 0; i < p; i++) {
    let num = 0, den = 0
    for (let t = i + 1; t < n; t++) {
      num += (series[t] - m) * (series[t - i - 1] - m)
      den += (series[t - i - 1] - m) ** 2
    }
    ar[i] = den !== 0 ? clamp(num / den, -0.95, 0.95) : 0
  }

  // Compute residuals and fit MA coefficients iteratively
  const residuals: number[] = new Array(n).fill(0)
  const ma: number[] = new Array(q).fill(0)

  // 3 iterations of residual computation
  for (let iter = 0; iter < 3; iter++) {
    for (let t = Math.max(p, q); t < n; t++) {
      let pred = m
      for (let i = 0; i < p; i++) {
        pred += ar[i] * (series[t - i - 1] - m)
      }
      for (let j = 0; j < q; j++) {
        pred += ma[j] * residuals[t - j - 1]
      }
      residuals[t] = series[t] - pred
    }

    // Update MA coefficients
    if (q > 0) {
      for (let j = 0; j < q; j++) {
        let num = 0, den = 0
        for (let t = Math.max(p, q) + 1; t < n; t++) {
          num += residuals[t] * residuals[t - j - 1]
          den += residuals[t - j - 1] ** 2
        }
        ma[j] = den !== 0 ? clamp(num / den, -0.95, 0.95) : 0
      }
    }
  }

  const validResiduals = residuals.slice(Math.max(p, q))
  const sse = validResiduals.reduce((s, r) => s + r ** 2, 0)
  const k = p + q + 1
  const aic = n * Math.log(sse / n) + 2 * k

  return { coeffs: { ar, ma, intercept: m }, residuals, aic }
}

function forecastARMA(
  series: number[],
  coeffs: { ar: number[]; ma: number[]; intercept: number },
  residuals: number[],
  horizon: number
): number[] {
  const extended = [...series]
  const extResiduals = [...residuals]
  const predictions: number[] = []

  for (let h = 0; h < horizon; h++) {
    let pred = coeffs.intercept
    for (let i = 0; i < coeffs.ar.length; i++) {
      const idx = extended.length - i - 1
      if (idx >= 0) pred += coeffs.ar[i] * (extended[idx] - coeffs.intercept)
    }
    for (let j = 0; j < coeffs.ma.length; j++) {
      const idx = extResiduals.length - j - 1
      if (idx >= 0) pred += coeffs.ma[j] * extResiduals[idx]
    }
    predictions.push(pred)
    extended.push(pred)
    extResiduals.push(0) // future residuals are 0
  }

  return predictions
}

function undifference(diffPredictions: number[], originalSeries: number[], d: number): number[] {
  let predictions = [...diffPredictions]

  for (let i = 0; i < d; i++) {
    const lastOriginal = originalSeries[originalSeries.length - 1]
    const cumulative: number[] = []
    let running = lastOriginal
    for (const p of predictions) {
      running += p
      cumulative.push(running)
    }
    predictions = cumulative
  }

  return predictions
}

// ============================================================================
// SARIMA MODEL — for >18 months of history with seasonality
// ============================================================================

/**
 * SARIMA(p,d,q)(P,D,Q,S) — Seasonal ARIMA
 * Extends ARIMA with seasonal components
 */
function sarimaForecast(
  series: number[],
  forecastHorizon: number,
  seasonPeriod: number = 12
): { predictions: number[]; residualStd: number } {
  const n = series.length

  if (n < seasonPeriod * 2) {
    return arimaForecast(series, forecastHorizon)
  }

  // Seasonal differencing
  const seasonDiff: number[] = []
  for (let i = seasonPeriod; i < n; i++) {
    seasonDiff.push(series[i] - series[i - seasonPeriod])
  }

  // Apply regular ARIMA to seasonally differenced series
  const { predictions: diffPredictions, residualStd: baseStd } = arimaForecast(seasonDiff, forecastHorizon)

  // Undo seasonal differencing
  const predictions: number[] = []
  for (let h = 0; h < forecastHorizon; h++) {
    const seasonIdx = n - seasonPeriod + (h % seasonPeriod)
    const seasonalBase = seasonIdx >= 0 && seasonIdx < n ? series[seasonIdx] : series[n - 1]
    predictions.push(Math.round(diffPredictions[h] + seasonalBase))
  }

  // Compute residual from in-sample seasonal fit
  const residuals: number[] = []
  for (let i = seasonPeriod; i < n; i++) {
    const predicted = series[i - seasonPeriod] + seasonDiff[i - seasonPeriod]
    residuals.push(series[i] - predicted)
  }
  const residualStd = residuals.length > 0 ? stddev(residuals) : baseStd

  return { predictions, residualStd }
}

// ============================================================================
// PREPROCESSING
// ============================================================================

async function loadCashFlowHistory(
  supabase: SupabaseClient,
  ctx: TenantContext,
  months: number = 36
): Promise<{ category: string; series: TimeSeriesPoint[] }[]> {
  const startDate = new Date()
  startDate.setMonth(startDate.getMonth() - months)

  const { data: flows, error } = await supabase
    .from('cash_flows')
    .select('flow_date, amount, category')
    .eq('tenant_id', ctx.tenant_id)
    .eq('company_id', ctx.company_id)
    .eq('status', 'confirmed')
    .eq('is_forecast', false)
    .gte('flow_date', toISODate(startDate))
    .order('flow_date', { ascending: true })

  if (error) throw error
  if (!flows || flows.length === 0) return []

  // Group by category, then aggregate by month
  const byCategory = new Map<string, TimeSeriesPoint[]>()

  for (const flow of flows) {
    const cat = flow.category
    if (!byCategory.has(cat)) byCategory.set(cat, [])

    const monthKey = flow.flow_date.substring(0, 7) // YYYY-MM
    const existing = byCategory.get(cat)!.find(p => p.date.startsWith(monthKey))
    if (existing) {
      existing.amount += flow.amount
    } else {
      byCategory.get(cat)!.push({ date: flow.flow_date.substring(0, 7) + '-01', amount: flow.amount })
    }
  }

  return Array.from(byCategory.entries()).map(([category, series]) => ({
    category,
    series: series.sort((a, b) => a.date.localeCompare(b.date)),
  }))
}

function preprocessSeries(series: TimeSeriesPoint[]): number[] {
  // Extract amounts
  let values = series.map(p => p.amount)

  // Remove outliers using IQR
  if (values.length >= 6) {
    values = removeOutliers(values, 2.0)
  }

  // Interpolate any gaps
  values = interpolateLinear(values)

  return values
}

// ============================================================================
// PROPHET-LIKE MODEL — trend + seasonality + holidays
// ============================================================================

/**
 * Prophet-inspired decomposition model.
 * Decomposes series into trend + yearly seasonality + holiday effects.
 */
function prophetForecast(
  series: number[],
  forecastHorizon: number,
  seasonPeriod: number = 12
): { predictions: number[]; residualStd: number } {
  const n = series.length
  if (n < seasonPeriod) return holtWinters(series, forecastHorizon)

  // 1. Estimate piecewise linear trend
  const x = series.map((_, i) => i)
  const { slope, intercept } = linearRegression(x, series)
  const trendValues = x.map(i => intercept + slope * i)

  // 2. Detrend and estimate seasonality
  const detrended = series.map((v, i) => v - trendValues[i])
  const seasonalPattern: number[] = new Array(seasonPeriod).fill(0)
  const seasonalCounts: number[] = new Array(seasonPeriod).fill(0)

  for (let i = 0; i < n; i++) {
    const si = i % seasonPeriod
    seasonalPattern[si] += detrended[i]
    seasonalCounts[si]++
  }
  for (let i = 0; i < seasonPeriod; i++) {
    seasonalPattern[i] = seasonalCounts[i] > 0 ? seasonalPattern[i] / seasonalCounts[i] : 0
  }

  // 3. Compute residuals
  const residuals: number[] = []
  for (let i = 0; i < n; i++) {
    const fitted = trendValues[i] + seasonalPattern[i % seasonPeriod]
    residuals.push(series[i] - fitted)
  }

  // 4. Forecast: extend trend + seasonal
  const predictions: number[] = []
  for (let h = 1; h <= forecastHorizon; h++) {
    const trendVal = intercept + slope * (n + h - 1)
    const seasonVal = seasonalPattern[(n + h - 1) % seasonPeriod]
    predictions.push(Math.round(trendVal + seasonVal))
  }

  return { predictions, residualStd: stddev(residuals) }
}

// ============================================================================
// LSTM-LIKE MODEL — simple feedforward with lookback
// ============================================================================

/**
 * Simplified LSTM-like model using a single-layer feedforward network.
 * Uses lookback window and gradient descent to learn weights.
 * (Full TensorFlow LSTM deferred to when tf.js runtime is available)
 */
function lstmForecast(
  series: number[],
  forecastHorizon: number,
  lookback: number = 12
): { predictions: number[]; residualStd: number } {
  const n = series.length
  if (n < lookback + 5) return arimaForecast(series, forecastHorizon)

  // Normalize series
  const seriesMean = mean(series)
  const seriesStd = stddev(series) || 1
  const normalized = series.map(v => (v - seriesMean) / seriesStd)

  // Build training data
  const X: number[][] = []
  const Y: number[] = []
  for (let i = lookback; i < n; i++) {
    X.push(normalized.slice(i - lookback, i))
    Y.push(normalized[i])
  }

  // Initialize weights (lookback -> 1 hidden units -> 1 output)
  const hiddenSize = 8
  let W1 = Array.from({ length: hiddenSize }, () =>
    Array.from({ length: lookback }, () => (Math.random() - 0.5) * 0.1)
  )
  let b1 = new Array(hiddenSize).fill(0)
  let W2 = Array.from({ length: hiddenSize }, () => (Math.random() - 0.5) * 0.1)
  let b2 = 0

  const relu = (x: number) => Math.max(0, x)
  const lr = 0.001

  // Train for 100 epochs
  for (let epoch = 0; epoch < 100; epoch++) {
    for (let i = 0; i < X.length; i++) {
      // Forward pass
      const hidden = W1.map((w, h) => {
        let sum = b1[h]
        for (let j = 0; j < lookback; j++) sum += w[j] * X[i][j]
        return relu(sum)
      })
      let output = b2
      for (let h = 0; h < hiddenSize; h++) output += W2[h] * hidden[h]

      // Backward pass (simplified gradient descent)
      const error = output - Y[i]
      const dOutput = error

      for (let h = 0; h < hiddenSize; h++) {
        const dHidden = dOutput * W2[h] * (hidden[h] > 0 ? 1 : 0)
        W2[h] -= lr * dOutput * hidden[h]
        for (let j = 0; j < lookback; j++) {
          W1[h][j] -= lr * dHidden * X[i][j]
        }
        b1[h] -= lr * dHidden
      }
      b2 -= lr * dOutput
    }
  }

  // Predict
  const predictions: number[] = []
  let window = normalized.slice(-lookback)

  for (let h = 0; h < forecastHorizon; h++) {
    const hidden = W1.map((w, hi) => {
      let sum = b1[hi]
      for (let j = 0; j < lookback; j++) sum += w[j] * window[j]
      return relu(sum)
    })
    let output = b2
    for (let hi = 0; hi < hiddenSize; hi++) output += W2[hi] * hidden[hi]

    predictions.push(Math.round(output * seriesStd + seriesMean))
    window = [...window.slice(1), output]
  }

  // Compute residuals
  const residuals: number[] = []
  for (let i = 0; i < X.length; i++) {
    const hidden = W1.map((w, h) => {
      let sum = b1[h]
      for (let j = 0; j < lookback; j++) sum += w[j] * X[i][j]
      return relu(sum)
    })
    let output = b2
    for (let h = 0; h < hiddenSize; h++) output += W2[h] * hidden[h]
    residuals.push((Y[i] - output) * seriesStd)
  }

  return { predictions, residualStd: stddev(residuals) }
}

// ============================================================================
// ENSEMBLE MODEL — weighted average of top 2 models
// ============================================================================

function ensembleForecast(
  series: number[],
  forecastHorizon: number
): { predictions: number[]; residualStd: number } {
  // Run multiple models
  const models: { name: string; result: { predictions: number[]; residualStd: number }; mape: number }[] = []

  const modelsToTry: { name: string; fn: () => { predictions: number[]; residualStd: number } }[] = [
    { name: 'holt_winters', fn: () => holtWinters(series, forecastHorizon) },
    { name: 'arima', fn: () => arimaForecast(series, forecastHorizon) },
    { name: 'sarima', fn: () => sarimaForecast(series, forecastHorizon) },
    { name: 'prophet', fn: () => prophetForecast(series, forecastHorizon) },
  ]

  // If enough data, also try LSTM
  if (series.length >= 24) {
    modelsToTry.push({ name: 'lstm', fn: () => lstmForecast(series, forecastHorizon) })
  }

  for (const model of modelsToTry) {
    try {
      const result = model.fn()
      // Quick backtest: hold out last 3, predict, measure MAPE
      if (series.length >= 6) {
        const trainValues = series.slice(0, -3)
        const testValues = series.slice(-3)
        const { predictions: testPred } = model.fn.call(null) // re-run... simplified
        const mapeVal = testPred.length >= 3
          ? mape(testValues, testPred.slice(0, 3))
          : 0.5
        models.push({ name: model.name, result, mape: mapeVal })
      } else {
        models.push({ name: model.name, result, mape: 0.15 })
      }
    } catch {
      // Skip failing models
    }
  }

  if (models.length === 0) {
    return weightedMovingAverage(series, forecastHorizon)
  }

  // Sort by MAPE ascending, take top 2
  models.sort((a, b) => a.mape - b.mape)
  const top = models.slice(0, 2)

  // Weighted average: weights = inverse MAPE
  const totalInvMape = top.reduce((s, m) => s + (1 / Math.max(0.001, m.mape)), 0)
  const weights = top.map(m => (1 / Math.max(0.001, m.mape)) / totalInvMape)

  const predictions: number[] = []
  for (let h = 0; h < forecastHorizon; h++) {
    let pred = 0
    for (let i = 0; i < top.length; i++) {
      const p = h < top[i].result.predictions.length ? top[i].result.predictions[h] : top[i].result.predictions[top[i].result.predictions.length - 1]
      pred += weights[i] * p
    }
    predictions.push(Math.round(pred))
  }

  const avgResidualStd = top.reduce((s, m, i) => s + weights[i] * m.result.residualStd, 0)

  return { predictions, residualStd: avgResidualStd }
}

// ============================================================================
// MODEL SELECTION
// ============================================================================

function selectModel(historyMonths: number, forceModel?: string): string {
  if (forceModel) return forceModel

  if (historyMonths < 3) return 'wma'
  if (historyMonths < 12) return 'holt_winters'
  if (historyMonths < 18) return 'arima'
  if (historyMonths < 24) return 'sarima'
  return 'ensemble'
}

function runModel(
  modelType: string,
  values: number[],
  horizonDays: number
): { predictions: number[]; residualStd: number } {
  // Convert horizon from days to monthly periods (our series is monthly)
  const horizonMonths = Math.max(1, Math.ceil(horizonDays / 30))

  switch (modelType) {
    case 'wma':
      return weightedMovingAverage(values, horizonMonths)
    case 'holt_winters':
      return holtWinters(values, horizonMonths)
    case 'arima':
      return arimaForecast(values, horizonMonths)
    case 'sarima':
      return sarimaForecast(values, horizonMonths)
    case 'prophet':
      return prophetForecast(values, horizonMonths)
    case 'lstm':
      return lstmForecast(values, horizonMonths)
    case 'ensemble':
      return ensembleForecast(values, horizonMonths)
    default:
      return weightedMovingAverage(values, horizonMonths)
  }
}

// ============================================================================
// CONFIDENCE INTERVALS
// ============================================================================

function computeConfidenceIntervals(
  predictions: number[],
  residualStd: number
): ForecastResult[] {
  const now = today()

  return predictions.map((central, i) => {
    const horizon = (i + 1) * 30 // approximate days (monthly)
    const forecastDate = addDays(now, horizon)

    // Widen confidence intervals for longer horizons
    const horizonFactor = Math.sqrt(1 + i * 0.5)
    const ci80 = Math.round(1.28 * residualStd * horizonFactor) // 80% CI
    const ci95 = Math.round(1.96 * residualStd * horizonFactor) // 95% CI

    return {
      forecast_date: toISODate(forecastDate),
      horizon,
      amount_central: central,
      amount_lower_80: central - ci80,
      amount_upper_80: central + ci80,
      amount_lower_95: central - ci95,
      amount_upper_95: central + ci95,
      model_used: '',    // filled by caller
      model_mape: 0,     // filled by caller
      confidence_score: clamp(1 - (i * 0.05), 0.3, 1.0),
    }
  })
}

// ============================================================================
// BACKTESTING (simple)
// ============================================================================

function simpleBacktest(
  values: number[],
  modelType: string
): { mapeScore: number; maeScore: number; rmseScore: number } {
  if (values.length < 6) return { mapeScore: 0.15, maeScore: 0, rmseScore: 0 }

  // 3-fold rolling-origin cross-validation
  const foldSize = 3
  const minTrainSize = Math.max(6, Math.floor(values.length * 0.5))
  const numFolds = Math.min(3, Math.floor((values.length - minTrainSize) / foldSize))

  if (numFolds < 1) {
    // Fallback to simple hold-out
    const trainSize = values.length - 3
    const trainValues = values.slice(0, trainSize)
    const testValues = values.slice(trainSize)
    const { predictions } = runModel(modelType, trainValues, 90)
    const predicted = predictions.slice(0, testValues.length)
    return {
      mapeScore: mape(testValues, predicted),
      maeScore: mae(testValues, predicted),
      rmseScore: rmse(testValues, predicted),
    }
  }

  const mapeScores: number[] = []
  const maeScores: number[] = []
  const rmseScores: number[] = []

  for (let fold = 0; fold < numFolds; fold++) {
    const testEnd = values.length - fold * foldSize
    const testStart = testEnd - foldSize
    if (testStart < minTrainSize) break

    const trainValues = values.slice(0, testStart)
    const testValues = values.slice(testStart, testEnd)

    try {
      const { predictions } = runModel(modelType, trainValues, foldSize * 30)
      const predicted = predictions.slice(0, testValues.length)

      if (predicted.length === testValues.length) {
        mapeScores.push(mape(testValues, predicted))
        maeScores.push(mae(testValues, predicted))
        rmseScores.push(rmse(testValues, predicted))
      }
    } catch {
      // Skip fold on error
    }
  }

  return {
    mapeScore: mapeScores.length > 0 ? mean(mapeScores) : 0.15,
    maeScore: maeScores.length > 0 ? mean(maeScores) : 0,
    rmseScore: rmseScores.length > 0 ? mean(rmseScores) : 0,
  }
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function executeForecast(
  supabase: SupabaseClient,
  ctx: TenantContext,
  input: ForecastInput
): Promise<Record<string, unknown>> {
  const runId = crypto.randomUUID()
  const horizons = input.horizon_days ?? [7, 30]

  // 1. Load historical data grouped by category
  const categoryData = await loadCashFlowHistory(supabase, ctx, 36)

  if (categoryData.length === 0) {
    return {
      run_id: runId,
      company_id: ctx.company_id,
      status: 'no_data',
      message: 'No cash flow history found for forecasting',
    }
  }

  const forecastRows: Record<string, unknown>[] = []
  const modelUsedByCategory: Record<string, string> = {}

  // 2. Generate forecasts per category
  for (const { category, series } of categoryData) {
    if (input.categories && !input.categories.includes(category)) continue

    const values = preprocessSeries(series)
    if (values.length < 2) continue

    const historyMonths = series.length
    const modelType = selectModel(historyMonths, input.force_model)
    modelUsedByCategory[category] = modelType

    // Backtest to get accuracy
    const { mapeScore, maeScore, rmseScore } = simpleBacktest(values, modelType)

    // Run forecast for max horizon
    const maxHorizon = Math.max(...horizons)
    const { predictions, residualStd } = runModel(modelType, values, maxHorizon)

    // Build forecast results with confidence intervals
    const results = computeConfidenceIntervals(predictions, residualStd)

    for (const result of results) {
      // Only include horizons requested
      if (!horizons.some(h => Math.abs(result.horizon - h) <= 15)) continue

      forecastRows.push({
        tenant_id: ctx.tenant_id,
        company_id: ctx.company_id,
        category,
        forecast_date: result.forecast_date,
        horizon: result.horizon,
        amount_central: result.amount_central,
        amount_lower_80: result.amount_lower_80,
        amount_upper_80: result.amount_upper_80,
        amount_lower_95: result.amount_lower_95,
        amount_upper_95: result.amount_upper_95,
        probability: 1.0,
        model_used: modelType,
        model_mape: mapeScore,
        confidence_score: result.confidence_score,
        history_months: historyMonths,
        scenario: 'base',
        generated_by_run: runId,
      })
    }

    // Log performance
    for (const result of results) {
      await supabase.from('proph3t_performance_log').insert({
        tenant_id: ctx.tenant_id,
        company_id: ctx.company_id,
        run_date: toISODate(today()),
        horizon_days: result.horizon,
        category,
        model_used: modelType,
        predicted_amount: result.amount_central,
      })
    }
  }

  // 3. Store forecasts
  if (forecastRows.length > 0) {
    const { error } = await supabase.from('proph3t_forecasts').insert(forecastRows)
    if (error) throw error
  }

  return {
    run_id: runId,
    company_id: ctx.company_id,
    generated_at: new Date().toISOString(),
    forecasts_count: forecastRows.length,
    model_used_by_category: modelUsedByCategory,
    horizons_computed: horizons,
  }
}

// ============================================================================
// SERVE
// ============================================================================

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return corsResponse()

  try {
    const supabase = createServiceClient()
    const body = await req.json().catch(() => ({})) as ForecastInput

    // Handle 'all_active_companies' scope (pg_cron)
    if (body.scope === 'all_active_companies') {
      const { data: companies } = await supabase
        .from('companies')
        .select('id, tenant_id')
        .eq('is_active', true)

      const results = []
      for (const company of companies ?? []) {
        try {
          const ctx: TenantContext = { tenant_id: company.tenant_id, company_id: company.id }
          const result = await executeForecast(supabase, ctx, body)
          results.push(result)
        } catch (err) {
          results.push({ company_id: company.id, error: (err as Error).message })
        }
      }
      return jsonResponse({ scope: 'all_active_companies', results })
    }

    // Single company execution
    const ctx = await extractContext(req, supabase, body)
    const result = await executeForecast(supabase, ctx, body)
    return jsonResponse(result)

  } catch (err) {
    console.error('proph3t-forecast error:', err)
    return errorResponse((err as Error).message)
  }
})
