export interface FormatFCFAOptions {
  /** Show "+" sign for positive amounts */
  showSign?: boolean;
  /** Use compact notation (K / M / Mrd) */
  compact?: boolean;
  /** Append " FCFA" suffix (default true) */
  suffix?: boolean;
}

/**
 * Format an amount **in centimes** as FCFA.
 *
 * Examples:
 *   formatFCFA(150000)                       => "1 500 FCFA"
 *   formatFCFA(150000, { compact: true })    => "2 K FCFA"
 *   formatFCFA(-150000, { showSign: true })  => "-1 500 FCFA"
 */
export function formatFCFA(
  amountInCentimes: number,
  options?: FormatFCFAOptions,
): string {
  return _format(amountInCentimes / 100, options);
}

/**
 * Format an amount **already in francs** as FCFA.
 *
 * Use this when the value is NOT stored in centimes (e.g. mock data, API
 * responses that return franc values, or display-only amounts).
 */
export function formatFrancs(
  amount: number,
  options?: FormatFCFAOptions,
): string {
  return _format(amount, options);
}

function _format(amount: number, options?: FormatFCFAOptions): string {
  const abs = Math.abs(amount);
  let formatted: string;

  if (options?.compact && abs >= 1_000_000_000) {
    formatted = `${(abs / 1_000_000_000).toFixed(1)} Mrd`;
  } else if (options?.compact && abs >= 1_000_000) {
    formatted = `${(abs / 1_000_000).toFixed(1)} M`;
  } else if (options?.compact && abs >= 1_000) {
    formatted = `${(abs / 1_000).toFixed(0)} K`;
  } else {
    formatted = abs.toLocaleString("fr-FR");
  }

  const sign = amount < 0 ? "-" : options?.showSign && amount > 0 ? "+" : "";
  const suffix = options?.suffix === false ? "" : " FCFA";
  return `${sign}${formatted}${suffix}`;
}

export function toCentimes(fcfa: number): number {
  return Math.round(fcfa * 100);
}

export function toFCFA(centimes: number): number {
  return centimes / 100;
}

export function addAmounts(...amounts: number[]): number {
  return amounts.reduce((sum, a) => sum + Math.round(a), 0);
}
