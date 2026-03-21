import { describe, it, expect } from 'vitest';
import { computeReconciliation, isBalanced } from './tft';

describe('computeReconciliation', () => {
  it('reconciles when flows match balance change', () => {
    // Opening 1000, Closing 1500, Inflows 600, Outflows 100
    // calculated_variation = 600 - 100 = 500
    // actual_variation = 1500 - 1000 = 500
    // variance = 0
    const result = computeReconciliation(100000, 150000, 60000, 10000);
    expect(result.variance).toBe(0);
    expect(result.is_reconciled).toBe(true);
  });

  it('detects non-zero variance when flows do not match', () => {
    // Opening 1000, Closing 1500, Inflows 400, Outflows 100
    // calculated_variation = 400 - 100 = 300
    // actual_variation = 1500 - 1000 = 500
    // variance = 300 - 500 = -200 (NOT zero!)
    const result = computeReconciliation(100000, 150000, 40000, 10000);
    expect(result.variance).toBe(-20000);
    expect(result.variance).not.toBe(0);
    expect(result.is_reconciled).toBe(false);
  });

  it('has positive variance when calculated exceeds actual', () => {
    // Opening 1000, Closing 1200, Inflows 500, Outflows 100
    // calculated = 400, actual = 200, variance = 200
    const result = computeReconciliation(100000, 120000, 50000, 10000);
    expect(result.variance).toBe(20000);
    expect(result.is_reconciled).toBe(false);
  });

  it('handles zero flows', () => {
    const result = computeReconciliation(100000, 100000, 0, 0);
    expect(result.variance).toBe(0);
    expect(result.is_reconciled).toBe(true);
  });

  it('handles zero opening and closing', () => {
    const result = computeReconciliation(0, 0, 5000, 5000);
    expect(result.variance).toBe(0);
    expect(result.is_reconciled).toBe(true);
  });

  it('handles negative closing (overdraft)', () => {
    // Opening 1000, Closing -500, Inflows 0, Outflows 1500
    // calculated = -1500, actual = -1500, variance = 0
    const result = computeReconciliation(100000, -50000, 0, 150000);
    expect(result.variance).toBe(0);
    expect(result.is_reconciled).toBe(true);
  });

  it('returns correct opening and closing in result', () => {
    const result = computeReconciliation(12345, 67890, 100000, 44455);
    expect(result.opening).toBe(12345);
    expect(result.closing).toBe(67890);
  });

  it('calculates calculated_variation correctly', () => {
    const result = computeReconciliation(0, 0, 50000, 30000);
    expect(result.calculated_variation).toBe(20000);
  });

  it('calculates actual_variation correctly', () => {
    const result = computeReconciliation(10000, 25000, 0, 0);
    expect(result.actual_variation).toBe(15000);
  });

  it('reconciles within tolerance (< 100 centimes = 1 FCFA)', () => {
    // variance of 99 centimes should be reconciled
    // Opening 0, Closing 99, Inflows 0, Outflows 0
    // calculated = 0, actual = 99, variance = -99
    const result = computeReconciliation(0, 99, 0, 0);
    expect(result.variance).toBe(-99);
    expect(result.is_reconciled).toBe(true);
  });

  it('does NOT reconcile at exactly 100 centimes variance', () => {
    // variance of exactly 100 centimes should NOT reconcile (< not <=)
    const result = computeReconciliation(0, 100, 0, 0);
    expect(result.variance).toBe(-100);
    expect(result.is_reconciled).toBe(false);
  });

  it('handles large amounts', () => {
    const opening = 1_000_000_000_00; // 1 billion FCFA
    const closing = 1_500_000_000_00;
    const inflows = 600_000_000_00;
    const outflows = 100_000_000_00;
    const result = computeReconciliation(opening, closing, inflows, outflows);
    expect(result.calculated_variation).toBe(500_000_000_00);
    expect(result.actual_variation).toBe(500_000_000_00);
    expect(result.variance).toBe(0);
  });

  it('NEVER hardcodes variance to zero', () => {
    // This test explicitly verifies variance is computed, not hardcoded
    const mismatched = computeReconciliation(0, 50000, 30000, 0);
    // calculated = 30000, actual = 50000, variance = -20000
    expect(mismatched.variance).toBe(-20000);

    const matched = computeReconciliation(0, 50000, 50000, 0);
    expect(matched.variance).toBe(0);

    // Different mismatches should give different variances
    const mismatch2 = computeReconciliation(0, 50000, 40000, 0);
    expect(mismatch2.variance).toBe(-10000);
    expect(mismatch2.variance).not.toBe(mismatched.variance);
  });

  it('handles only outflows scenario', () => {
    // Opening 10000, Closing 3000, Inflows 0, Outflows 7000
    const result = computeReconciliation(10000, 3000, 0, 7000);
    expect(result.calculated_variation).toBe(-7000);
    expect(result.actual_variation).toBe(-7000);
    expect(result.variance).toBe(0);
    expect(result.is_reconciled).toBe(true);
  });

  it('handles only inflows scenario', () => {
    const result = computeReconciliation(5000, 15000, 10000, 0);
    expect(result.calculated_variation).toBe(10000);
    expect(result.actual_variation).toBe(10000);
    expect(result.variance).toBe(0);
  });
});

describe('isBalanced', () => {
  it('returns true when balanced', () => {
    expect(isBalanced(100000, 150000, 60000, 10000)).toBe(true);
  });

  it('returns false when unbalanced', () => {
    expect(isBalanced(100000, 150000, 40000, 10000)).toBe(false);
  });

  it('respects custom tolerance', () => {
    // variance of -200 with tolerance of 300 -> balanced
    const result = computeReconciliation(0, 200, 0, 0);
    expect(result.variance).toBe(-200);
    expect(isBalanced(0, 200, 0, 0, 300)).toBe(true);
    expect(isBalanced(0, 200, 0, 0, 100)).toBe(false);
  });
});
