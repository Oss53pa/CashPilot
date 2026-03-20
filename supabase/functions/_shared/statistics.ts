/**
 * Statistical utility functions for Proph3t Edge Functions.
 * Pure TypeScript — no external dependencies.
 */

/** Arithmetic mean */
export function mean(values: number[]): number {
  if (values.length === 0) return 0
  return values.reduce((sum, v) => sum + v, 0) / values.length
}

/** Population standard deviation */
export function stddev(values: number[]): number {
  if (values.length < 2) return 0
  const m = mean(values)
  const squaredDiffs = values.map(v => (v - m) ** 2)
  return Math.sqrt(squaredDiffs.reduce((sum, v) => sum + v, 0) / values.length)
}

/** Sample standard deviation */
export function sampleStddev(values: number[]): number {
  if (values.length < 2) return 0
  const m = mean(values)
  const squaredDiffs = values.map(v => (v - m) ** 2)
  return Math.sqrt(squaredDiffs.reduce((sum, v) => sum + v, 0) / (values.length - 1))
}

/** Z-score of a value against a dataset */
export function zScore(value: number, values: number[]): number {
  const s = stddev(values)
  if (s === 0) return 0
  return (value - mean(values)) / s
}

/** Median */
export function median(values: number[]): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid]
}

/** Interquartile Range */
export function iqr(values: number[]): { q1: number; q3: number; iqr: number } {
  const sorted = [...values].sort((a, b) => a - b)
  const n = sorted.length
  const q1 = sorted[Math.floor(n * 0.25)]
  const q3 = sorted[Math.floor(n * 0.75)]
  return { q1, q3, iqr: q3 - q1 }
}

/** Remove outliers using IQR method */
export function removeOutliers(values: number[], factor = 1.5): number[] {
  if (values.length < 4) return values
  const { q1, q3, iqr: iqrVal } = iqr(values)
  const lower = q1 - factor * iqrVal
  const upper = q3 + factor * iqrVal
  return values.filter(v => v >= lower && v <= upper)
}

/** Linear interpolation to fill missing values (NaN or undefined) */
export function interpolateLinear(values: (number | null)[]): number[] {
  const result = [...values] as number[]

  for (let i = 0; i < result.length; i++) {
    if (result[i] == null || isNaN(result[i])) {
      // Find previous and next valid values
      let prevIdx = i - 1
      while (prevIdx >= 0 && (result[prevIdx] == null || isNaN(result[prevIdx]))) prevIdx--
      let nextIdx = i + 1
      while (nextIdx < result.length && (result[nextIdx] == null || isNaN(result[nextIdx]))) nextIdx++

      if (prevIdx >= 0 && nextIdx < result.length) {
        // Interpolate between prev and next
        const ratio = (i - prevIdx) / (nextIdx - prevIdx)
        result[i] = result[prevIdx] + ratio * (result[nextIdx] - result[prevIdx])
      } else if (prevIdx >= 0) {
        result[i] = result[prevIdx]
      } else if (nextIdx < result.length) {
        result[i] = result[nextIdx]
      } else {
        result[i] = 0
      }
    }
  }
  return result
}

/** Linear regression: returns slope and intercept */
export function linearRegression(x: number[], y: number[]): { slope: number; intercept: number } {
  const n = x.length
  if (n < 2) return { slope: 0, intercept: y[0] ?? 0 }

  const mx = mean(x)
  const my = mean(y)
  let num = 0
  let den = 0
  for (let i = 0; i < n; i++) {
    num += (x[i] - mx) * (y[i] - my)
    den += (x[i] - mx) ** 2
  }

  const slope = den === 0 ? 0 : num / den
  const intercept = my - slope * mx
  return { slope, intercept }
}

/** Mean Absolute Percentage Error */
export function mape(actual: number[], predicted: number[]): number {
  if (actual.length === 0) return 0
  let sum = 0
  let count = 0
  for (let i = 0; i < actual.length; i++) {
    if (actual[i] !== 0) {
      sum += Math.abs((actual[i] - predicted[i]) / actual[i])
      count++
    }
  }
  return count === 0 ? 0 : sum / count
}

/** Mean Absolute Error */
export function mae(actual: number[], predicted: number[]): number {
  if (actual.length === 0) return 0
  return actual.reduce((sum, a, i) => sum + Math.abs(a - predicted[i]), 0) / actual.length
}

/** Root Mean Squared Error */
export function rmse(actual: number[], predicted: number[]): number {
  if (actual.length === 0) return 0
  const mse = actual.reduce((sum, a, i) => sum + (a - predicted[i]) ** 2, 0) / actual.length
  return Math.sqrt(mse)
}

/** Clamp a value between min and max */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

/** Sum of an array */
export function sum(values: number[]): number {
  return values.reduce((s, v) => s + v, 0)
}

/** Min of an array */
export function min(values: number[]): number {
  return Math.min(...values)
}

/** Max of an array */
export function max(values: number[]): number {
  return Math.max(...values)
}
