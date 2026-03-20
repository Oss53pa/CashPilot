/**
 * Format a numeric value as a currency amount.
 *
 * @param value    - The number to format.
 * @param currency - ISO 4217 currency code (default "USD").
 * @param locale   - BCP 47 locale string (default "en-US").
 */
export function formatAmount(
  value: number,
  currency: string = "USD",
  locale: string = "en-US",
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Format a number as a percentage string (e.g. 0.1234 -> "12.34%").
 *
 * @param value - A decimal ratio (e.g. 0.05 for 5%).
 */
export function formatPercent(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "percent",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Format a number in compact notation (e.g. 1200 -> "1.2K", 2500000 -> "2.5M").
 *
 * @param value - The number to format.
 */
export function formatCompactNumber(value: number): string {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    compactDisplay: "short",
    maximumFractionDigits: 1,
  }).format(value);
}

/**
 * Mask the middle digits of an account number for display.
 *
 * Example: "1234567890" -> "1234****90"
 *
 * @param value - The raw account number string.
 */
export function formatAccountNumber(value: string): string {
  const cleaned = value.replace(/\s/g, "");

  if (cleaned.length <= 4) {
    return cleaned;
  }

  const visibleStart = 4;
  const visibleEnd = 2;
  const maskedLength = cleaned.length - visibleStart - visibleEnd;

  if (maskedLength <= 0) {
    return cleaned;
  }

  return (
    cleaned.slice(0, visibleStart) +
    "*".repeat(maskedLength) +
    cleaned.slice(-visibleEnd)
  );
}
