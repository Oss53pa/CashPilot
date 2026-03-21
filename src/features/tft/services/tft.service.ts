import type { TFTStatement, TFTClassificationRule } from '../types';

// ---------------------------------------------------------------------------
// Mock data — Cosmos Yopougon (commercial real estate, FCFA)
// ---------------------------------------------------------------------------

function buildMockTFT(
  companyId: string,
  periodStart: string,
  periodEnd: string,
  method: 'direct' | 'indirect',
  statementType: 'realized' | 'forecast' | 'hybrid',
): TFTStatement {
  // Section A — Exploitation
  const exploitationReceipts = [
    { code: 'A1', label: 'Loyers percus', current_period: 52_400_000, previous_period: 48_200_000, budget: 55_000_000, sign: '+' as const },
    { code: 'A2', label: 'Charges locatives refacturees', current_period: 18_600_000, previous_period: 16_800_000, budget: 19_000_000, sign: '+' as const },
    { code: 'A3', label: 'Regularisations de charges', current_period: 5_200_000, previous_period: 4_100_000, budget: 5_500_000, sign: '+' as const },
    { code: 'A4', label: 'Revenus de parking', current_period: 3_800_000, previous_period: 3_500_000, budget: 4_000_000, sign: '+' as const },
  ];

  const exploitationDisbursements = [
    { code: 'A5', label: 'Salaires et charges sociales', current_period: 12_500_000, previous_period: 11_800_000, budget: 12_000_000, sign: '-' as const },
    { code: 'A6', label: 'Entretien et maintenance', current_period: 6_800_000, previous_period: 5_900_000, budget: 7_000_000, sign: '-' as const },
    { code: 'A7', label: 'Assurances immobilieres', current_period: 3_200_000, previous_period: 3_000_000, budget: 3_500_000, sign: '-' as const },
    { code: 'A8', label: 'Frais de gestion', current_period: 4_500_000, previous_period: 4_200_000, budget: 4_500_000, sign: '-' as const },
    { code: 'A9', label: 'Impots et taxes (foncier, patente)', current_period: 8_200_000, previous_period: 7_600_000, budget: 8_500_000, sign: '-' as const },
    { code: 'A10', label: 'Charges financieres exploitation', current_period: 5_100_000, previous_period: 4_800_000, budget: 5_000_000, sign: '-' as const },
  ];

  const totalReceiptsA = exploitationReceipts.reduce((s, r) => s + r.current_period, 0);
  const totalReceiptsAPrev = exploitationReceipts.reduce((s, r) => s + r.previous_period, 0);
  const totalDisbursementsA = exploitationDisbursements.reduce((s, r) => s + r.current_period, 0);
  const totalDisbursementsAPrev = exploitationDisbursements.reduce((s, r) => s + r.previous_period, 0);

  // Section B — Investissement
  const investmentReceipts = [
    { code: 'B1', label: 'Cessions d\'actifs immobiliers', current_period: 0, previous_period: 12_000_000, budget: 0, sign: '+' as const },
    { code: 'B2', label: 'Remboursement de placements', current_period: 15_000_000, previous_period: 10_000_000, budget: 15_000_000, sign: '+' as const },
  ];

  const investmentDisbursements = [
    { code: 'B3', label: 'Acquisitions immobilieres / CAPEX', current_period: 22_000_000, previous_period: 18_000_000, budget: 25_000_000, sign: '-' as const },
    { code: 'B4', label: 'Travaux de renovation', current_period: 3_500_000, previous_period: 8_500_000, budget: 5_000_000, sign: '-' as const },
  ];

  const totalReceiptsB = investmentReceipts.reduce((s, r) => s + r.current_period, 0);
  const totalReceiptsBPrev = investmentReceipts.reduce((s, r) => s + r.previous_period, 0);
  const totalDisbursementsB = investmentDisbursements.reduce((s, r) => s + r.current_period, 0);
  const totalDisbursementsBPrev = investmentDisbursements.reduce((s, r) => s + r.previous_period, 0);

  // Section C — Financement
  const financingReceipts = [
    { code: 'C1', label: 'Depots de garantie recus', current_period: 3_200_000, previous_period: 2_800_000, budget: 3_000_000, sign: '+' as const },
    { code: 'C2', label: 'Nouveaux emprunts tires', current_period: 0, previous_period: 25_000_000, budget: 0, sign: '+' as const },
  ];

  const financingDisbursements = [
    { code: 'C3', label: 'Remboursement emprunts (principal)', current_period: 8_500_000, previous_period: 7_200_000, budget: 8_500_000, sign: '-' as const },
    { code: 'C4', label: 'Restitution depots de garantie', current_period: 1_800_000, previous_period: 1_500_000, budget: 2_000_000, sign: '-' as const },
  ];

  const totalReceiptsC = financingReceipts.reduce((s, r) => s + r.current_period, 0);
  const totalReceiptsCPrev = financingReceipts.reduce((s, r) => s + r.previous_period, 0);
  const totalDisbursementsC = financingDisbursements.reduce((s, r) => s + r.current_period, 0);
  const totalDisbursementsCPrev = financingDisbursements.reduce((s, r) => s + r.previous_period, 0);

  // Compute variance on each line
  function addVariance<T extends { current_period: number; budget?: number }>(items: T[]): T[] {
    return items.map((item) => ({
      ...item,
      variance_amount: item.budget != null ? item.current_period - item.budget : undefined,
      variance_pct: item.budget != null && item.budget !== 0
        ? Math.round(((item.current_period - item.budget) / item.budget) * 10000) / 100
        : undefined,
    }));
  }

  const netA = totalReceiptsA - totalDisbursementsA;
  const netAPrev = totalReceiptsAPrev - totalDisbursementsAPrev;
  const netB = totalReceiptsB - totalDisbursementsB;
  const netBPrev = totalReceiptsBPrev - totalDisbursementsBPrev;
  const netC = totalReceiptsC - totalDisbursementsC;
  const netCPrev = totalReceiptsCPrev - totalDisbursementsCPrev;

  const netVariation = netA + netB + netC;
  const openingPosition = 130_000_000;
  const closingPosition = openingPosition + netVariation;

  // Ratios
  const totalRevenue = totalReceiptsA; // simplified: exploitation receipts as revenue proxy
  const freeCashFlow = netA - (totalDisbursementsB - totalReceiptsB); // Operating CF - net CAPEX
  const operatingCfToRevenue = totalRevenue > 0 ? Math.round((netA / totalRevenue) * 10000) / 100 : 0;
  const daysCashOnHand = totalDisbursementsA > 0 ? Math.round((closingPosition / (totalDisbursementsA / 30)) * 100) / 100 : 0;
  const dscr = (totalDisbursementsC > 0) ? Math.round((netA / totalDisbursementsC) * 100) / 100 : 0;
  const cashConversion = totalRevenue > 0 ? Math.round((netA / totalRevenue) * 10000) / 100 : 0;

  return {
    id: `tft-${companyId}-${periodStart}`,
    company_id: companyId,
    company_name: 'Cosmos Yopougon',
    period_start: periodStart,
    period_end: periodEnd,
    period_type: 'monthly',
    method,
    statement_type: statementType,
    scope: 'company',
    currency: 'XOF',
    sections: {
      exploitation: {
        code: 'A',
        title: 'Flux de tresorerie lies a l\'exploitation',
        receipts: addVariance(exploitationReceipts),
        disbursements: addVariance(exploitationDisbursements),
        total_receipts: totalReceiptsA,
        total_disbursements: totalDisbursementsA,
        net_flow: netA,
        net_flow_previous: netAPrev,
      },
      investment: {
        code: 'B',
        title: 'Flux de tresorerie lies a l\'investissement',
        receipts: addVariance(investmentReceipts),
        disbursements: addVariance(investmentDisbursements),
        total_receipts: totalReceiptsB,
        total_disbursements: totalDisbursementsB,
        net_flow: netB,
        net_flow_previous: netBPrev,
      },
      financing: {
        code: 'C',
        title: 'Flux de tresorerie lies au financement',
        receipts: addVariance(financingReceipts),
        disbursements: addVariance(financingDisbursements),
        total_receipts: totalReceiptsC,
        total_disbursements: totalDisbursementsC,
        net_flow: netC,
        net_flow_previous: netCPrev,
      },
    },
    reconciliation: {
      net_exploitation: netA,
      net_investment: netB,
      net_financing: netC,
      net_variation: netVariation,
      opening_position: openingPosition,
      opening_breakdown: {
        bank: 98_000_000,
        cash: 8_500_000,
        mobile_money: 12_000_000,
        prepaid: 5_500_000,
        overdraft: -6_000_000 + 12_000_000, // net 6M to reach 130M total (98+8.5+12+5.5+6=130)
      },
      closing_position: closingPosition,
      closing_breakdown: {
        bank: 98_000_000 + Math.round(netVariation * 0.55),
        cash: 8_500_000 + Math.round(netVariation * 0.10),
        mobile_money: 12_000_000 + Math.round(netVariation * 0.15),
        prepaid: 5_500_000 + Math.round(netVariation * 0.10),
        overdraft: 6_000_000 + Math.round(netVariation * 0.10),
      },
      reconciliation_variance: 0,
    },
    complementary: {
      non_cash_items: [
        { label: 'Dotation aux amortissements', amount: 14_500_000 },
        { label: 'Provisions pour depreciation', amount: 3_200_000 },
        { label: 'Ecarts de conversion', amount: -450_000 },
      ],
      significant_flows: [
        { label: 'Acquisition terrain Cocody', amount: 85_000_000, nature: 'Investissement strategique' },
        { label: 'Remboursement anticipe pret BOA', amount: 35_000_000, nature: 'Desendettement' },
      ],
      ratios: {
        operating_cf_to_revenue: operatingCfToRevenue,
        free_cash_flow: freeCashFlow,
        days_cash_on_hand: daysCashOnHand,
        dscr,
        cash_conversion: cashConversion,
        burn_rate: undefined,
      },
    },
    is_certified: false,
    certified_by: undefined,
    certified_at: undefined,
  };
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export const tftService = {
  async getTFT(
    companyId: string,
    periodStart: string,
    periodEnd: string,
    method: 'direct' | 'indirect' = 'direct',
    statementType: 'realized' | 'forecast' | 'hybrid' = 'realized',
  ): Promise<TFTStatement> {
    // Simulate network delay
    await new Promise((r) => setTimeout(r, 400));
    return buildMockTFT(companyId, periodStart, periodEnd, method, statementType);
  },

  async getTFTComparison(
    companyId: string,
    period1Start: string,
    period1End: string,
    period2Start: string,
    period2End: string,
  ): Promise<{ current: TFTStatement; previous: TFTStatement }> {
    await new Promise((r) => setTimeout(r, 500));
    return {
      current: buildMockTFT(companyId, period1Start, period1End, 'direct', 'realized'),
      previous: buildMockTFT(companyId, period2Start, period2End, 'direct', 'realized'),
    };
  },

  async certifyTFT(
    tftId: string,
    userId: string,
  ): Promise<{ success: boolean; certified_at: string }> {
    await new Promise((r) => setTimeout(r, 300));
    return { success: true, certified_at: new Date().toISOString() };
  },

  async exportTFTPDF(_tftId: string): Promise<void> {
    // Placeholder — PDF export will be implemented later
    await new Promise((r) => setTimeout(r, 200));
  },

  getClassificationRules(): TFTClassificationRule[] {
    return [
      { category: 'Loyers', section: 'A', line: 'A1', sign: '+' },
      { category: 'Charges locatives', section: 'A', line: 'A2', sign: '+' },
      { category: 'Regularisations', section: 'A', line: 'A3', sign: '+' },
      { category: 'Parking', section: 'A', line: 'A4', sign: '+' },
      { category: 'Salaires', section: 'A', line: 'A5', sign: '-' },
      { category: 'Maintenance', section: 'A', line: 'A6', sign: '-' },
      { category: 'Assurances', section: 'A', line: 'A7', sign: '-' },
      { category: 'Frais de gestion', section: 'A', line: 'A8', sign: '-' },
      { category: 'Impots fonciers', section: 'A', line: 'A9', sign: '-' },
      { category: 'Charges financieres', section: 'A', line: 'A10', sign: '-' },
      { category: 'Cessions immobilieres', section: 'B', line: 'B1', sign: '+' },
      { category: 'Remboursement placements', section: 'B', line: 'B2', sign: '+' },
      { category: 'CAPEX', section: 'B', line: 'B3', sign: '-' },
      { category: 'Travaux renovation', section: 'B', line: 'B4', sign: '-' },
      { category: 'Depots de garantie recus', section: 'C', line: 'C1', sign: '+' },
      { category: 'Nouveaux emprunts', section: 'C', line: 'C2', sign: '+' },
      { category: 'Remboursement emprunts', section: 'C', line: 'C3', sign: '-' },
      { category: 'Restitution depots', section: 'C', line: 'C4', sign: '-' },
    ];
  },
};
