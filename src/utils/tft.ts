/**
 * TFT (Tableau de Flux de Trésorerie) reconciliation utilities.
 * All monetary amounts are in centimes.
 */

export interface ReconciliationResult {
  opening: number;
  closing: number;
  calculated_variation: number;
  actual_variation: number;
  variance: number;
  is_reconciled: boolean;
}

/**
 * Compute TFT reconciliation.
 * Variance MUST be computed, never hardcoded to 0.
 *
 * @param opening - Opening balance in centimes
 * @param closing - Closing balance in centimes
 * @param totalInflows - Sum of all inflows in centimes
 * @param totalOutflows - Sum of all outflows in centimes
 * @returns Reconciliation result with variance
 */
export function computeReconciliation(
  opening: number,
  closing: number,
  totalInflows: number,
  totalOutflows: number
): ReconciliationResult {
  const calculated_variation = totalInflows - totalOutflows;
  const actual_variation = closing - opening;
  const variance = calculated_variation - actual_variation;
  return {
    opening,
    closing,
    calculated_variation,
    actual_variation,
    variance,
    is_reconciled: Math.abs(variance) < 100, // 1 FCFA tolerance (100 centimes)
  };
}

/**
 * Check if a set of flows is balanced (inflows - outflows = closing - opening).
 */
export function isBalanced(
  opening: number,
  closing: number,
  totalInflows: number,
  totalOutflows: number,
  toleranceCentimes: number = 100
): boolean {
  const result = computeReconciliation(opening, closing, totalInflows, totalOutflows);
  return Math.abs(result.variance) < toleranceCentimes;
}
