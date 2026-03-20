/**
 * Date utility functions for Proph3t Edge Functions.
 */

/** Add days to a date */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

/** Difference in days between two dates */
export function daysDiff(date1: Date | string, date2: Date | string): number {
  const d1 = typeof date1 === 'string' ? new Date(date1) : date1
  const d2 = typeof date2 === 'string' ? new Date(date2) : date2
  return Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24))
}

/** Format date as ISO string (YYYY-MM-DD) */
export function toISODate(date: Date): string {
  return date.toISOString().split('T')[0]
}

/** Get the start of today (UTC) */
export function today(): Date {
  const d = new Date()
  d.setUTCHours(0, 0, 0, 0)
  return d
}

/** Months between two dates */
export function monthsDiff(date1: Date | string, date2: Date | string): number {
  const d1 = typeof date1 === 'string' ? new Date(date1) : date1
  const d2 = typeof date2 === 'string' ? new Date(date2) : date2
  return (d2.getFullYear() - d1.getFullYear()) * 12 + (d2.getMonth() - d1.getMonth())
}

/** Check if a date is a Côte d'Ivoire public holiday */
export function isCIHoliday(date: Date): boolean {
  const month = date.getMonth() + 1
  const day = date.getDate()

  // Fixed holidays
  const fixedHolidays: [number, number][] = [
    [1, 1],   // Jour de l'An
    [5, 1],   // Fête du Travail
    [8, 7],   // Fête Nationale (Indépendance)
    [8, 15],  // Assomption
    [11, 1],  // Toussaint
    [11, 15], // Journée Nationale de la Paix
    [12, 25], // Noël
  ]

  for (const [m, d] of fixedHolidays) {
    if (month === m && day === d) return true
  }

  // Easter-based holidays (approximate — computed per year)
  const year = date.getFullYear()
  const easter = computeEaster(year)
  const easterBased = [
    addDays(easter, 1),   // Lundi de Pâques
    addDays(easter, 39),  // Ascension
    addDays(easter, 50),  // Lundi de Pentecôte
  ]

  for (const hd of easterBased) {
    if (month === hd.getMonth() + 1 && day === hd.getDate()) return true
  }

  return false
}

/** Compute Easter date for a given year (Meeus/Jones/Butcher algorithm) */
function computeEaster(year: number): Date {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31)
  const day = ((h + l - 7 * m + 114) % 31) + 1
  return new Date(year, month - 1, day)
}

/** Sin/cos cyclical encoding for time features (month, day of week, etc.) */
export function cyclicalEncode(value: number, period: number): { sin: number; cos: number } {
  const angle = (2 * Math.PI * value) / period
  return { sin: Math.sin(angle), cos: Math.cos(angle) }
}

/** Group dates by month: returns Map<'YYYY-MM', values[]> */
export function groupByMonth<T>(
  items: T[],
  getDate: (item: T) => string | Date
): Map<string, T[]> {
  const map = new Map<string, T[]>()
  for (const item of items) {
    const d = typeof getDate(item) === 'string'
      ? new Date(getDate(item) as string)
      : getDate(item) as Date
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(item)
  }
  return map
}
