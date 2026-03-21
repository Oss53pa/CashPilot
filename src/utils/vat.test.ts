import { describe, it, expect } from 'vitest';
import {
  STANDARD_VAT_RATE,
  computeVATFromHT,
  extractVATFromTTC,
  sumVATBreakdowns,
} from './vat';

describe('computeVATFromHT', () => {
  it('computes VAT at standard rate', () => {
    const result = computeVATFromHT(100000); // 1000 FCFA
    expect(result.ht).toBe(100000);
    expect(result.vat).toBe(Math.round(100000 * STANDARD_VAT_RATE));
    expect(result.ttc).toBe(result.ht + result.vat);
    expect(result.rate).toBe(STANDARD_VAT_RATE);
  });

  it('computes VAT at zero rate', () => {
    const result = computeVATFromHT(100000, 0);
    expect(result.vat).toBe(0);
    expect(result.ttc).toBe(100000);
  });

  it('computes VAT at custom rate', () => {
    const result = computeVATFromHT(200000, 0.10);
    expect(result.vat).toBe(20000);
    expect(result.ttc).toBe(220000);
  });

  it('handles zero amount', () => {
    const result = computeVATFromHT(0);
    expect(result.ht).toBe(0);
    expect(result.vat).toBe(0);
    expect(result.ttc).toBe(0);
  });

  it('rounds VAT to nearest centime', () => {
    // 333 * 0.1925 = 64.1025 -> rounds to 64
    const result = computeVATFromHT(333);
    expect(result.vat).toBe(Math.round(333 * STANDARD_VAT_RATE));
    expect(Number.isInteger(result.vat)).toBe(true);
  });

  it('ensures ttc = ht + vat always', () => {
    const amounts = [1, 99, 12345, 9999999];
    amounts.forEach(amt => {
      const r = computeVATFromHT(amt);
      expect(r.ttc).toBe(r.ht + r.vat);
    });
  });
});

describe('extractVATFromTTC', () => {
  it('extracts VAT from TTC at standard rate', () => {
    const result = extractVATFromTTC(119250); // 1192.50 FCFA TTC
    expect(result.ttc).toBe(119250);
    expect(result.ht + result.vat).toBe(result.ttc);
    expect(result.rate).toBe(STANDARD_VAT_RATE);
  });

  it('extracts VAT at zero rate', () => {
    const result = extractVATFromTTC(100000, 0);
    expect(result.ht).toBe(100000);
    expect(result.vat).toBe(0);
  });

  it('extracts at custom rate', () => {
    const result = extractVATFromTTC(110000, 0.10);
    expect(result.ht).toBe(100000);
    expect(result.vat).toBe(10000);
  });

  it('handles zero amount', () => {
    const result = extractVATFromTTC(0);
    expect(result.ht).toBe(0);
    expect(result.vat).toBe(0);
  });

  it('ensures ht + vat = ttc always', () => {
    const amounts = [1, 50, 99999, 5000000];
    amounts.forEach(amt => {
      const r = extractVATFromTTC(amt);
      expect(r.ht + r.vat).toBe(r.ttc);
    });
  });

  it('round-trips with computeVATFromHT', () => {
    const original = computeVATFromHT(100000);
    const extracted = extractVATFromTTC(original.ttc);
    expect(extracted.ht).toBe(original.ht);
    expect(extracted.vat).toBe(original.vat);
  });
});

describe('sumVATBreakdowns', () => {
  it('sums multiple breakdowns', () => {
    const b1 = computeVATFromHT(100000);
    const b2 = computeVATFromHT(200000);
    const total = sumVATBreakdowns([b1, b2]);
    expect(total.totalHT).toBe(300000);
    expect(total.totalVAT).toBe(b1.vat + b2.vat);
    expect(total.totalTTC).toBe(b1.ttc + b2.ttc);
  });

  it('returns zeros for empty array', () => {
    const total = sumVATBreakdowns([]);
    expect(total.totalHT).toBe(0);
    expect(total.totalVAT).toBe(0);
    expect(total.totalTTC).toBe(0);
  });

  it('handles single item', () => {
    const b = computeVATFromHT(50000);
    const total = sumVATBreakdowns([b]);
    expect(total.totalHT).toBe(b.ht);
    expect(total.totalVAT).toBe(b.vat);
    expect(total.totalTTC).toBe(b.ttc);
  });

  it('sums breakdowns with different rates', () => {
    const b1 = computeVATFromHT(100000, 0.1925);
    const b2 = computeVATFromHT(100000, 0.10);
    const total = sumVATBreakdowns([b1, b2]);
    expect(total.totalHT).toBe(200000);
    expect(total.totalVAT).toBe(b1.vat + b2.vat);
  });
});
