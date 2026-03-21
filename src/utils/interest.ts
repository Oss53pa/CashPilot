import { differenceInDays, parseISO } from 'date-fns';

/**
 * Late payment interest calculation utilities.
 * All monetary amounts are in centimes.
 */

/** Default annual late interest rate (e.g., BEAC rate + margin) */
export const DEFAULT_ANNUAL_RATE = 0.1050; // 10.50%

export interface InterestResult {
  /** Principal amount in centimes */
  principal: number;
  /** Number of days late */
  daysLate: number;
  /** Annual interest rate applied */
  annualRate: number;
  /** Calculated interest amount in centimes */
  interest: number;
  /** Total due (principal + interest) in centimes */
  totalDue: number;
}

/**
 * Calculate simple late payment interest.
 * Interest = Principal * (annualRate / 365) * daysLate
 */
export function computeSimpleInterest(
  principalCentimes: number,
  daysLate: number,
  annualRate: number = DEFAULT_ANNUAL_RATE
): InterestResult {
  if (daysLate <= 0) {
    return {
      principal: principalCentimes,
      daysLate: 0,
      annualRate,
      interest: 0,
      totalDue: principalCentimes,
    };
  }

  const interest = Math.round(principalCentimes * (annualRate / 365) * daysLate);
  return {
    principal: principalCentimes,
    daysLate,
    annualRate,
    interest,
    totalDue: principalCentimes + interest,
  };
}

/**
 * Calculate late interest from a due date ISO string.
 */
export function computeInterestFromDate(
  principalCentimes: number,
  dueDateISO: string,
  refDate: Date = new Date(),
  annualRate: number = DEFAULT_ANNUAL_RATE
): InterestResult {
  const dueDate = parseISO(dueDateISO);
  const daysLate = Math.max(0, differenceInDays(refDate, dueDate));
  return computeSimpleInterest(principalCentimes, daysLate, annualRate);
}
