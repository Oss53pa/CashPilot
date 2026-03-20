/**
 * Reusable feature engineering utilities for Proph3t Edge Functions.
 * Used by anomaly-scan, fraud-check, and behavior-score.
 */

import { mean, stddev, zScore, sum } from './statistics.ts'
import { daysDiff } from './date-utils.ts'

// ============================================================================
// COUNTERPARTY PROFILING
// ============================================================================

export interface CounterpartyProfile {
  transaction_count: number
  avg_amount: number
  stddev_amount: number
  last_transaction_date: string | null
  days_since_last: number
  is_known: boolean
  first_seen_days_ago: number
}

export function buildCounterpartyProfile(
  transactions: { amount: number; flow_date: string; counterparty_id: string | null }[],
  counterpartyId: string | null,
  referenceDate: string
): CounterpartyProfile {
  const matched = transactions.filter(t => t.counterparty_id === counterpartyId)

  if (matched.length === 0) {
    return {
      transaction_count: 0,
      avg_amount: 0,
      stddev_amount: 0,
      last_transaction_date: null,
      days_since_last: 999,
      is_known: false,
      first_seen_days_ago: 0,
    }
  }

  const amounts = matched.map(t => t.amount)
  const dates = matched.map(t => t.flow_date).sort()

  return {
    transaction_count: matched.length,
    avg_amount: mean(amounts),
    stddev_amount: stddev(amounts),
    last_transaction_date: dates[dates.length - 1],
    days_since_last: daysDiff(dates[dates.length - 1], referenceDate),
    is_known: true,
    first_seen_days_ago: daysDiff(dates[0], referenceDate),
  }
}

// ============================================================================
// VELOCITY CALCULATION
// ============================================================================

export interface VelocityMetrics {
  count_24h: number
  count_48h: number
  count_7d: number
  total_amount_24h: number
  total_amount_48h: number
  total_amount_7d: number
  avg_interval_days: number
}

export function computeVelocity(
  transactions: { amount: number; flow_date: string }[],
  referenceDate: string
): VelocityMetrics {
  const sorted = [...transactions].sort((a, b) => a.flow_date.localeCompare(b.flow_date))

  let count24h = 0, count48h = 0, count7d = 0
  let total24h = 0, total48h = 0, total7d = 0

  for (const t of sorted) {
    const diff = daysDiff(t.flow_date, referenceDate)
    if (diff <= 1) { count24h++; total24h += t.amount }
    if (diff <= 2) { count48h++; total48h += t.amount }
    if (diff <= 7) { count7d++; total7d += t.amount }
  }

  // Average interval between consecutive transactions
  let avgInterval = 0
  if (sorted.length >= 2) {
    const intervals: number[] = []
    for (let i = 1; i < sorted.length; i++) {
      intervals.push(daysDiff(sorted[i - 1].flow_date, sorted[i].flow_date))
    }
    avgInterval = mean(intervals)
  }

  return {
    count_24h: count24h,
    count_48h: count48h,
    count_7d: count7d,
    total_amount_24h: total24h,
    total_amount_48h: total48h,
    total_amount_7d: total7d,
    avg_interval_days: avgInterval,
  }
}

// ============================================================================
// Z-SCORE AGAINST HISTORICAL SET
// ============================================================================

export function computeZScoreFeatures(
  value: number,
  historicalValues: number[]
): { z_score: number; percentile: number; is_outlier: boolean } {
  if (historicalValues.length < 3) {
    return { z_score: 0, percentile: 0.5, is_outlier: false }
  }

  const z = zScore(value, historicalValues)
  const sorted = [...historicalValues].sort((a, b) => a - b)
  const belowCount = sorted.filter(v => v <= value).length
  const percentile = belowCount / sorted.length

  return {
    z_score: z,
    percentile,
    is_outlier: Math.abs(z) > 2.5,
  }
}

// ============================================================================
// HOUR NORMALITY
// ============================================================================

export function hourNormality(hour: number): number {
  // Business hours 8-18 are normal (score near 0), off-hours score higher
  if (hour >= 8 && hour <= 18) return 0
  if (hour >= 6 && hour <= 20) return 0.3
  return 1.0 // Late night / early morning
}

// ============================================================================
// SEQUENTIAL COUNT DETECTION
// ============================================================================

export function sequentialCount(
  amounts: number[],
  targetAmount: number,
  tolerance: number = 0.05
): number {
  let count = 0
  for (const a of amounts) {
    if (Math.abs(a - targetAmount) / Math.max(1, Math.abs(targetAmount)) <= tolerance) {
      count++
    }
  }
  return count
}
