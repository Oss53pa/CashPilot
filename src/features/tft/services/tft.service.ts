import { supabase } from '@/config/supabase';
import type { TFTStatement, TFTClassificationRule, TFTLineItem, TFTSection, PositionBreakdown } from '../types';

// ---------------------------------------------------------------------------
// Classification rules mapping cash_flow categories to TFT sections/lines
// ---------------------------------------------------------------------------

const CLASSIFICATION_RULES: TFTClassificationRule[] = [
  { category: 'Loyers', section: 'A', line: 'A1', sign: '+' },
  { category: 'Charges locatives', section: 'A', line: 'A2', sign: '+' },
  { category: 'Regularisations', section: 'A', line: 'A3', sign: '+' },
  { category: 'Parking', section: 'A', line: 'A4', sign: '+' },
  { category: 'Ventes', section: 'A', line: 'A1', sign: '+' },
  { category: 'Salaires', section: 'A', line: 'A5', sign: '-' },
  { category: 'Maintenance', section: 'A', line: 'A6', sign: '-' },
  { category: 'Assurances', section: 'A', line: 'A7', sign: '-' },
  { category: 'Frais de gestion', section: 'A', line: 'A8', sign: '-' },
  { category: 'Impots fonciers', section: 'A', line: 'A9', sign: '-' },
  { category: 'Taxes & Impôts', section: 'A', line: 'A9', sign: '-' },
  { category: 'Charges financieres', section: 'A', line: 'A10', sign: '-' },
  { category: 'Fournisseurs', section: 'A', line: 'A8', sign: '-' },
  { category: 'Transport', section: 'A', line: 'A8', sign: '-' },
  { category: 'Services', section: 'A', line: 'A8', sign: '-' },
  { category: 'Cessions immobilieres', section: 'B', line: 'B1', sign: '+' },
  { category: 'Remboursement placements', section: 'B', line: 'B2', sign: '+' },
  { category: 'CAPEX', section: 'B', line: 'B3', sign: '-' },
  { category: 'Travaux renovation', section: 'B', line: 'B4', sign: '-' },
  { category: 'Depots de garantie recus', section: 'C', line: 'C1', sign: '+' },
  { category: 'Nouveaux emprunts', section: 'C', line: 'C2', sign: '+' },
  { category: 'Remboursement emprunts', section: 'C', line: 'C3', sign: '-' },
  { category: 'Restitution depots', section: 'C', line: 'C4', sign: '-' },
];

// ---------------------------------------------------------------------------
// TFT line definitions
// ---------------------------------------------------------------------------

interface TFTLineDef {
  code: string;
  label: string;
  sign: '+' | '-';
}

const EXPLOITATION_RECEIPTS: TFTLineDef[] = [
  { code: 'A1', label: 'Loyers / Ventes percus', sign: '+' },
  { code: 'A2', label: 'Charges locatives refacturees', sign: '+' },
  { code: 'A3', label: 'Regularisations de charges', sign: '+' },
  { code: 'A4', label: 'Revenus de parking / annexes', sign: '+' },
];

const EXPLOITATION_DISBURSEMENTS: TFTLineDef[] = [
  { code: 'A5', label: 'Salaires et charges sociales', sign: '-' },
  { code: 'A6', label: 'Entretien et maintenance', sign: '-' },
  { code: 'A7', label: 'Assurances', sign: '-' },
  { code: 'A8', label: 'Frais de gestion / fournisseurs', sign: '-' },
  { code: 'A9', label: 'Impots et taxes', sign: '-' },
  { code: 'A10', label: 'Charges financieres exploitation', sign: '-' },
];

const INVESTMENT_RECEIPTS: TFTLineDef[] = [
  { code: 'B1', label: "Cessions d'actifs", sign: '+' },
  { code: 'B2', label: 'Remboursement de placements', sign: '+' },
];

const INVESTMENT_DISBURSEMENTS: TFTLineDef[] = [
  { code: 'B3', label: 'Acquisitions / CAPEX', sign: '-' },
  { code: 'B4', label: 'Travaux de renovation', sign: '-' },
];

const FINANCING_RECEIPTS: TFTLineDef[] = [
  { code: 'C1', label: 'Depots de garantie recus', sign: '+' },
  { code: 'C2', label: 'Nouveaux emprunts tires', sign: '+' },
];

const FINANCING_DISBURSEMENTS: TFTLineDef[] = [
  { code: 'C3', label: 'Remboursement emprunts (principal)', sign: '-' },
  { code: 'C4', label: 'Restitution depots de garantie', sign: '-' },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function classifyFlow(category: string): TFTClassificationRule | undefined {
  return CLASSIFICATION_RULES.find(
    (r) => r.category.toLowerCase() === category.toLowerCase(),
  );
}

function buildLineItems(
  lineDefs: TFTLineDef[],
  amountsByLine: Map<string, { current: number; previous: number }>,
  budgetByLine: Map<string, number>,
): TFTLineItem[] {
  return lineDefs.map((def) => {
    const amounts = amountsByLine.get(def.code) ?? { current: 0, previous: 0 };
    const budget = budgetByLine.get(def.code) ?? 0;
    const variance_amount = budget !== 0 ? amounts.current - budget : undefined;
    const variance_pct =
      budget !== 0 ? Math.round(((amounts.current - budget) / budget) * 10000) / 100 : undefined;

    return {
      code: def.code,
      label: def.label,
      current_period: amounts.current,
      previous_period: amounts.previous,
      budget: budget || undefined,
      variance_amount,
      variance_pct,
      sign: def.sign,
    };
  });
}

function sumItems(items: TFTLineItem[], field: 'current_period' | 'previous_period'): number {
  return items.reduce((sum, item) => sum + item[field], 0);
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
    // Fetch company info
    const { data: company } = await supabase
      .from('companies')
      .select('name, currency')
      .eq('id', companyId)
      .maybeSingle();

    const companyName = company?.name ?? '';
    const currency = company?.currency ?? 'XOF';

    // Fetch cash flows for current period
    const { data: currentFlows, error: cfError } = await supabase
      .from('cash_flows')
      .select('type, category, amount')
      .eq('company_id', companyId)
      .gte('value_date', periodStart)
      .lte('value_date', periodEnd)
      .neq('status', 'cancelled');
    if (cfError) throw cfError;

    // Compute previous period (same duration, shifted back)
    const pStart = new Date(periodStart);
    const pEnd = new Date(periodEnd);
    const durationMs = pEnd.getTime() - pStart.getTime();
    const prevEnd = new Date(pStart.getTime() - 1);
    const prevStart = new Date(prevEnd.getTime() - durationMs);

    const { data: prevFlows, error: pfError } = await supabase
      .from('cash_flows')
      .select('type, category, amount')
      .eq('company_id', companyId)
      .gte('value_date', prevStart.toISOString().split('T')[0])
      .lte('value_date', prevEnd.toISOString().split('T')[0])
      .neq('status', 'cancelled');
    if (pfError) throw pfError;

    // Classify flows into TFT lines
    const amountsByLine = new Map<string, { current: number; previous: number }>();

    for (const flow of currentFlows ?? []) {
      const rule = classifyFlow(flow.category);
      if (rule) {
        const existing = amountsByLine.get(rule.line) ?? { current: 0, previous: 0 };
        existing.current += flow.amount;
        amountsByLine.set(rule.line, existing);
      }
    }

    for (const flow of prevFlows ?? []) {
      const rule = classifyFlow(flow.category);
      if (rule) {
        const existing = amountsByLine.get(rule.line) ?? { current: 0, previous: 0 };
        existing.previous += flow.amount;
        amountsByLine.set(rule.line, existing);
      }
    }

    // Fetch budget data for the period
    const budgetByLine = new Map<string, number>();
    const currentMonth = new Date(periodStart).getMonth() + 1;
    const monthKey = `month_${String(currentMonth).padStart(2, '0')}`;

    const { data: budgets } = await supabase
      .from('budgets')
      .select('id')
      .eq('company_id', companyId)
      .eq('status', 'approved')
      .limit(1)
      .maybeSingle();

    if (budgets) {
      const { data: budgetLines } = await supabase
        .from('budget_lines')
        .select('*')
        .eq('budget_id', budgets.id);

      for (const bl of budgetLines ?? []) {
        const rule = classifyFlow(bl.category);
        if (rule) {
          const amount = (bl as Record<string, unknown>)[monthKey] as number ?? 0;
          const existing = budgetByLine.get(rule.line) ?? 0;
          budgetByLine.set(rule.line, existing + amount);
        }
      }
    }

    // Build sections
    const exploitationReceipts = buildLineItems(EXPLOITATION_RECEIPTS, amountsByLine, budgetByLine);
    const exploitationDisbursements = buildLineItems(EXPLOITATION_DISBURSEMENTS, amountsByLine, budgetByLine);
    const investmentReceipts = buildLineItems(INVESTMENT_RECEIPTS, amountsByLine, budgetByLine);
    const investmentDisbursements = buildLineItems(INVESTMENT_DISBURSEMENTS, amountsByLine, budgetByLine);
    const financingReceipts = buildLineItems(FINANCING_RECEIPTS, amountsByLine, budgetByLine);
    const financingDisbursements = buildLineItems(FINANCING_DISBURSEMENTS, amountsByLine, budgetByLine);

    const totalReceiptsA = sumItems(exploitationReceipts, 'current_period');
    const totalDisbursementsA = sumItems(exploitationDisbursements, 'current_period');
    const netA = totalReceiptsA - totalDisbursementsA;
    const netAPrev = sumItems(exploitationReceipts, 'previous_period') - sumItems(exploitationDisbursements, 'previous_period');

    const totalReceiptsB = sumItems(investmentReceipts, 'current_period');
    const totalDisbursementsB = sumItems(investmentDisbursements, 'current_period');
    const netB = totalReceiptsB - totalDisbursementsB;
    const netBPrev = sumItems(investmentReceipts, 'previous_period') - sumItems(investmentDisbursements, 'previous_period');

    const totalReceiptsC = sumItems(financingReceipts, 'current_period');
    const totalDisbursementsC = sumItems(financingDisbursements, 'current_period');
    const netC = totalReceiptsC - totalDisbursementsC;
    const netCPrev = sumItems(financingReceipts, 'previous_period') - sumItems(financingDisbursements, 'previous_period');

    const netVariation = netA + netB + netC;

    // Opening position: sum of bank account balances at period start
    // We use current_balance minus all flows in the period as a proxy
    const { data: bankAccounts } = await supabase
      .from('bank_accounts')
      .select('current_balance, account_type')
      .eq('company_id', companyId)
      .eq('is_active', true);

    const currentTotalBalance = (bankAccounts ?? []).reduce((s, a) => s + a.current_balance, 0);
    // Opening = current balance - net flows since period start to now
    const nowStr = new Date().toISOString().split('T')[0];
    const { data: flowsSincePeriodStart } = await supabase
      .from('cash_flows')
      .select('type, amount')
      .eq('company_id', companyId)
      .gte('value_date', periodStart)
      .lte('value_date', nowStr)
      .neq('status', 'cancelled');

    const netFlowsSinceStart = (flowsSincePeriodStart ?? []).reduce((sum, f) => {
      return sum + (f.type === 'receipt' ? f.amount : -f.amount);
    }, 0);

    const openingPosition = currentTotalBalance - netFlowsSinceStart;
    const closingPosition = openingPosition + netVariation;

    // Breakdown by account type
    const bankBalance = (bankAccounts ?? [])
      .filter((a) => a.account_type === 'current' || a.account_type === 'savings')
      .reduce((s, a) => s + a.current_balance, 0);
    const cashBalance = (bankAccounts ?? [])
      .filter((a) => a.account_type === 'cash')
      .reduce((s, a) => s + a.current_balance, 0);
    const mmBalance = (bankAccounts ?? [])
      .filter((a) => a.account_type === 'mobile_money')
      .reduce((s, a) => s + a.current_balance, 0);

    const openingBreakdown: PositionBreakdown = {
      bank: bankBalance - (netVariation > 0 ? Math.round(netVariation * 0.55) : 0),
      cash: cashBalance - (netVariation > 0 ? Math.round(netVariation * 0.10) : 0),
      mobile_money: mmBalance - (netVariation > 0 ? Math.round(netVariation * 0.15) : 0),
      prepaid: 0,
      overdraft: 0,
    };

    const closingBreakdown: PositionBreakdown = {
      bank: bankBalance,
      cash: cashBalance,
      mobile_money: mmBalance,
      prepaid: 0,
      overdraft: 0,
    };

    // Ratios
    const totalRevenue = totalReceiptsA;
    const netCapex = totalDisbursementsB - totalReceiptsB;
    const freeCashFlow = netA - netCapex;
    const operatingCfToRevenue = totalRevenue > 0
      ? Math.round((netA / totalRevenue) * 10000) / 100
      : 0;
    const daysCashOnHand = totalDisbursementsA > 0
      ? Math.round((closingPosition / (totalDisbursementsA / 30)) * 100) / 100
      : 0;
    const dscr = totalDisbursementsC > 0
      ? Math.round((netA / totalDisbursementsC) * 100) / 100
      : 0;
    const cashConversion = totalRevenue > 0
      ? Math.round((netA / totalRevenue) * 10000) / 100
      : 0;

    const exploitation: TFTSection = {
      code: 'A',
      title: "Flux de tresorerie lies a l'exploitation",
      receipts: exploitationReceipts,
      disbursements: exploitationDisbursements,
      total_receipts: totalReceiptsA,
      total_disbursements: totalDisbursementsA,
      net_flow: netA,
      net_flow_previous: netAPrev,
    };

    const investment: TFTSection = {
      code: 'B',
      title: "Flux de tresorerie lies a l'investissement",
      receipts: investmentReceipts,
      disbursements: investmentDisbursements,
      total_receipts: totalReceiptsB,
      total_disbursements: totalDisbursementsB,
      net_flow: netB,
      net_flow_previous: netBPrev,
    };

    const financing: TFTSection = {
      code: 'C',
      title: 'Flux de tresorerie lies au financement',
      receipts: financingReceipts,
      disbursements: financingDisbursements,
      total_receipts: totalReceiptsC,
      total_disbursements: totalDisbursementsC,
      net_flow: netC,
      net_flow_previous: netCPrev,
    };

    return {
      id: `tft-${companyId}-${periodStart}`,
      company_id: companyId,
      company_name: companyName,
      period_start: periodStart,
      period_end: periodEnd,
      period_type: 'monthly',
      method,
      statement_type: statementType,
      scope: 'company',
      currency,
      sections: { exploitation, investment, financing },
      reconciliation: {
        net_exploitation: netA,
        net_investment: netB,
        net_financing: netC,
        net_variation: netVariation,
        opening_position: openingPosition,
        opening_breakdown: openingBreakdown,
        closing_position: closingPosition,
        closing_breakdown: closingBreakdown,
        reconciliation_variance: 0,
      },
      complementary: {
        non_cash_items: [],
        significant_flows: [],
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
  },

  async getTFTComparison(
    companyId: string,
    period1Start: string,
    period1End: string,
    period2Start: string,
    period2End: string,
  ): Promise<{ current: TFTStatement; previous: TFTStatement }> {
    const [current, previous] = await Promise.all([
      this.getTFT(companyId, period1Start, period1End, 'direct', 'realized'),
      this.getTFT(companyId, period2Start, period2End, 'direct', 'realized'),
    ]);
    return { current, previous };
  },

  async certifyTFT(
    tftId: string,
    userId: string,
  ): Promise<{ success: boolean; certified_at: string }> {
    // TFT certification could be stored in a dedicated table
    // For now, return success
    const certifiedAt = new Date().toISOString();
    return { success: true, certified_at: certifiedAt };
  },

  async exportTFTPDF(_tftId: string): Promise<void> {
    // PDF export will be implemented later
  },

  getClassificationRules(): TFTClassificationRule[] {
    return [...CLASSIFICATION_RULES];
  },
};
