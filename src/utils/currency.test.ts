import { describe, it, expect } from 'vitest';
import { formatFCFA, toCentimes, toFCFA, addAmounts } from './currency';

describe('formatFCFA', () => {
  it('formats zero correctly', () => {
    expect(formatFCFA(0)).toBe('0 FCFA');
  });

  it('formats positive amount in centimes', () => {
    expect(formatFCFA(150000)).toContain('FCFA');
    expect(formatFCFA(150000)).toContain('1');
  });

  it('formats negative amount with minus sign', () => {
    const result = formatFCFA(-150000);
    expect(result).toMatch(/^-/);
    expect(result).toContain('FCFA');
  });

  it('formats small amount (less than 1 FCFA)', () => {
    expect(formatFCFA(50)).toContain('0,5');
  });

  it('formats with showSign for positive', () => {
    const result = formatFCFA(100000, { showSign: true });
    expect(result).toMatch(/^\+/);
  });

  it('does not show + sign when showSign is false', () => {
    const result = formatFCFA(100000);
    expect(result).not.toMatch(/^\+/);
  });

  it('shows - sign regardless of showSign option', () => {
    const result = formatFCFA(-100000, { showSign: true });
    expect(result).toMatch(/^-/);
  });

  it('compact format for thousands', () => {
    const result = formatFCFA(500000_00, { compact: true });
    expect(result).toBe('5000 K FCFA');
  });

  it('compact format for millions', () => {
    const result = formatFCFA(250000000_00, { compact: true });
    expect(result).toBe('2500.0 M FCFA');
  });

  it('compact format for billions', () => {
    const result = formatFCFA(500000000000_00, { compact: true });
    expect(result).toBe('5000.0 Mrd FCFA');
  });

  it('compact format for small amounts falls through to normal', () => {
    const result = formatFCFA(50000, { compact: true });
    expect(result).toContain('500');
    expect(result).toContain('FCFA');
  });

  it('formats exactly 1 FCFA', () => {
    expect(formatFCFA(100)).toContain('1');
    expect(formatFCFA(100)).toContain('FCFA');
  });

  it('formats large amount without compact', () => {
    const result = formatFCFA(1234567800);
    expect(result).toContain('FCFA');
  });

  it('showSign on zero does not add +', () => {
    const result = formatFCFA(0, { showSign: true });
    expect(result).not.toMatch(/^\+/);
  });

  it('negative with compact for millions', () => {
    const result = formatFCFA(-150000000_00, { compact: true });
    expect(result).toBe('-1500.0 M FCFA');
  });
});

describe('toCentimes', () => {
  it('converts FCFA to centimes', () => {
    expect(toCentimes(1500)).toBe(150000);
  });

  it('rounds fractional centimes', () => {
    expect(toCentimes(15.555)).toBe(1556);
  });

  it('converts zero', () => {
    expect(toCentimes(0)).toBe(0);
  });

  it('converts negative values', () => {
    expect(toCentimes(-100)).toBe(-10000);
  });
});

describe('toFCFA', () => {
  it('converts centimes to FCFA', () => {
    expect(toFCFA(150000)).toBe(1500);
  });

  it('converts zero', () => {
    expect(toFCFA(0)).toBe(0);
  });

  it('handles fractional result', () => {
    expect(toFCFA(150)).toBe(1.5);
  });

  it('converts negative centimes', () => {
    expect(toFCFA(-10000)).toBe(-100);
  });
});

describe('addAmounts', () => {
  it('adds multiple amounts', () => {
    expect(addAmounts(100, 200, 300)).toBe(600);
  });

  it('returns 0 for no arguments', () => {
    expect(addAmounts()).toBe(0);
  });

  it('returns the value for single argument', () => {
    expect(addAmounts(500)).toBe(500);
  });

  it('rounds each amount before adding', () => {
    expect(addAmounts(1.4, 2.6)).toBe(4);
  });

  it('handles negative amounts', () => {
    expect(addAmounts(1000, -500, 200)).toBe(700);
  });
});
