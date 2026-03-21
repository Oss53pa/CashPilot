/**
 * VAT calculation utilities for CashPilot.
 * All monetary amounts are in centimes (1 FCFA = 100 centimes).
 */

/** Standard VAT rate in Cameroon / CEMAC zone */
export const STANDARD_VAT_RATE = 0.1925; // 19.25%

/** Reduced VAT rate */
export const REDUCED_VAT_RATE = 0.0;

export interface VATBreakdown {
  /** Amount before tax in centimes */
  ht: number;
  /** VAT amount in centimes */
  vat: number;
  /** Total amount including tax in centimes */
  ttc: number;
  /** Applied VAT rate (0-1) */
  rate: number;
}

/**
 * Calculate VAT from a HT (hors-taxe / before tax) amount.
 */
export function computeVATFromHT(htCentimes: number, rate: number = STANDARD_VAT_RATE): VATBreakdown {
  const vat = Math.round(htCentimes * rate);
  return {
    ht: htCentimes,
    vat,
    ttc: htCentimes + vat,
    rate,
  };
}

/**
 * Extract VAT from a TTC (toutes taxes comprises / tax-inclusive) amount.
 */
export function extractVATFromTTC(ttcCentimes: number, rate: number = STANDARD_VAT_RATE): VATBreakdown {
  const ht = Math.round(ttcCentimes / (1 + rate));
  const vat = ttcCentimes - ht;
  return {
    ht,
    vat,
    ttc: ttcCentimes,
    rate,
  };
}

/**
 * Sum multiple VAT breakdowns.
 */
export function sumVATBreakdowns(breakdowns: VATBreakdown[]): { totalHT: number; totalVAT: number; totalTTC: number } {
  return breakdowns.reduce(
    (acc, b) => ({
      totalHT: acc.totalHT + b.ht,
      totalVAT: acc.totalVAT + b.vat,
      totalTTC: acc.totalTTC + b.ttc,
    }),
    { totalHT: 0, totalVAT: 0, totalTTC: 0 }
  );
}
