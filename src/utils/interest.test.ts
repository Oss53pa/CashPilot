import { describe, it, expect } from 'vitest';
import { computeSimpleInterest, computeInterestFromDate, DEFAULT_ANNUAL_RATE } from './interest';

describe('computeSimpleInterest', () => {
  it('returns zero interest for zero days late', () => {
    const result = computeSimpleInterest(1000000, 0);
    expect(result.interest).toBe(0);
    expect(result.totalDue).toBe(1000000);
    expect(result.daysLate).toBe(0);
  });

  it('returns zero interest for negative days late', () => {
    const result = computeSimpleInterest(1000000, -5);
    expect(result.interest).toBe(0);
    expect(result.totalDue).toBe(1000000);
  });

  it('calculates interest for 30 days late', () => {
    const principal = 10000_00; // 10,000 FCFA
    const result = computeSimpleInterest(principal, 30);
    const expected = Math.round(principal * (DEFAULT_ANNUAL_RATE / 365) * 30);
    expect(result.interest).toBe(expected);
    expect(result.totalDue).toBe(principal + expected);
  });

  it('calculates interest for 1 day late', () => {
    const principal = 1000000;
    const result = computeSimpleInterest(principal, 1);
    const expected = Math.round(principal * (DEFAULT_ANNUAL_RATE / 365) * 1);
    expect(result.interest).toBe(expected);
  });

  it('uses custom annual rate', () => {
    const principal = 1000000;
    const result = computeSimpleInterest(principal, 365, 0.12);
    // 1 year at 12% = 120,000 centimes
    const expected = Math.round(principal * (0.12 / 365) * 365);
    expect(result.interest).toBe(expected);
    expect(result.annualRate).toBe(0.12);
  });

  it('returns integer interest (no fractional centimes)', () => {
    const result = computeSimpleInterest(333, 17);
    expect(Number.isInteger(result.interest)).toBe(true);
  });

  it('totalDue = principal + interest always', () => {
    const result = computeSimpleInterest(5000000, 45);
    expect(result.totalDue).toBe(result.principal + result.interest);
  });

  it('preserves principal in result', () => {
    const result = computeSimpleInterest(999999, 10);
    expect(result.principal).toBe(999999);
  });

  it('handles zero principal', () => {
    const result = computeSimpleInterest(0, 30);
    expect(result.interest).toBe(0);
    expect(result.totalDue).toBe(0);
  });

  it('handles very large amounts', () => {
    const principal = 100_000_000_00; // 100M FCFA
    const result = computeSimpleInterest(principal, 365);
    expect(result.interest).toBeGreaterThan(0);
    expect(result.totalDue).toBeGreaterThan(principal);
  });
});

describe('computeInterestFromDate', () => {
  const refDate = new Date('2025-06-15T00:00:00.000Z');

  it('returns zero interest when not yet due', () => {
    const result = computeInterestFromDate(1000000, '2025-07-01', refDate);
    expect(result.interest).toBe(0);
    expect(result.daysLate).toBe(0);
  });

  it('calculates interest for overdue invoice', () => {
    const result = computeInterestFromDate(1000000, '2025-05-15', refDate);
    expect(result.daysLate).toBe(31);
    expect(result.interest).toBeGreaterThan(0);
  });

  it('returns zero interest on the due date itself', () => {
    const result = computeInterestFromDate(1000000, '2025-06-15', refDate);
    expect(result.daysLate).toBe(0);
    expect(result.interest).toBe(0);
  });

  it('calculates for 1 day overdue', () => {
    const result = computeInterestFromDate(1000000, '2025-06-14', refDate);
    expect(result.daysLate).toBe(1);
    expect(result.interest).toBeGreaterThan(0);
  });

  it('uses custom rate', () => {
    const resultDefault = computeInterestFromDate(1000000, '2025-05-15', refDate);
    const resultCustom = computeInterestFromDate(1000000, '2025-05-15', refDate, 0.20);
    expect(resultCustom.interest).toBeGreaterThan(resultDefault.interest);
  });
});
