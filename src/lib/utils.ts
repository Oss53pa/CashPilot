import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge class names with Tailwind CSS conflict resolution.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Format a numeric value as a currency string.
 *
 * @param amount  - The numeric amount to format.
 * @param currency - ISO 4217 currency code (default "USD").
 * @param locale  - BCP 47 locale string (default "en-US").
 */
export function formatCurrency(
  amount: number,
  currency: string = "USD",
  locale: string = "en-US",
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format a Date (or ISO string) into a human-readable string.
 *
 * @param date   - Date object or ISO date string.
 * @param format - Intl.DateTimeFormat preset: "short", "medium" (default), or "long".
 * @param locale - BCP 47 locale string (default "en-US").
 */
export function formatDate(
  date: Date | string,
  format: "short" | "medium" | "long" = "medium",
  locale: string = "en-US",
): string {
  const d = typeof date === "string" ? new Date(date) : date;

  const options: Record<string, Intl.DateTimeFormatOptions> = {
    short: { year: "numeric", month: "2-digit", day: "2-digit" },
    medium: { year: "numeric", month: "short", day: "numeric" },
    long: {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "long",
    },
  };

  return new Intl.DateTimeFormat(locale, options[format]).format(d);
}
