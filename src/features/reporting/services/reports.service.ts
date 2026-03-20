import { supabase } from '@/config/supabase';

export interface CashPositionReportData {
  accounts: {
    bank_name: string;
    account_name: string;
    currency: string;
    balance: number;
  }[];
  total_by_currency: { currency: string; total: number }[];
  report_date: string;
}

export interface CashFlowReportData {
  receipts: { category: string; amount: number }[];
  disbursements: { category: string; amount: number }[];
  total_receipts: number;
  total_disbursements: number;
  net_cash_flow: number;
  start_date: string;
  end_date: string;
}

export interface BudgetVarianceReportData {
  items: {
    category: string;
    budget: number;
    actual: number;
    variance: number;
    variance_pct: number;
  }[];
  total_budget: number;
  total_actual: number;
  total_variance: number;
}

export interface ForecastAccuracyReportData {
  periods: {
    period: string;
    forecasted: number;
    actual: number;
    accuracy_pct: number;
  }[];
  overall_accuracy: number;
}

export interface AgingReportData {
  buckets: {
    range: string;
    receivables: number;
    payables: number;
  }[];
  total_receivables: number;
  total_payables: number;
}

export interface BankReconciliationReportData {
  bank_balance: number;
  book_balance: number;
  unmatched_bank_items: { date: string; description: string; amount: number }[];
  unmatched_book_items: { date: string; description: string; amount: number }[];
  reconciled: boolean;
}

export interface CollectionReportData {
  counterparties: {
    name: string;
    amount_due: number;
    amount_collected: number;
    recovery_rate: number;
    dso: number;
  }[];
  global_recovery_rate: number;
  average_dso: number;
}

export interface DisputeReportData {
  disputes: {
    reference: string;
    debtor: string;
    amount: number;
    provision: number;
    status: string;
    next_hearing: string | null;
  }[];
  total_litigated: number;
  total_provisions: number;
  active_count: number;
}

export interface MultiBankReportData {
  accounts: {
    account: string;
    bank: string;
    opening: number;
    receipts: number;
    disbursements: number;
    closing: number;
    fees: number;
  }[];
  total_fees: number;
}

export interface CapexReportData {
  operations: {
    code: string;
    name: string;
    budget: number;
    committed: number;
    invoiced: number;
    disbursed: number;
    remaining: number;
  }[];
}

export interface FiscalReportData {
  obligations: {
    type: string;
    period: string;
    amount: number;
    due_date: string;
    status: string;
    paid_date: string | null;
  }[];
}

export interface TreasuryWeeklyReportData {
  weeks: {
    week: string;
    opening: number;
    receipts: number;
    disbursements: number;
    net_flow: number;
    closing: number;
  }[];
  threshold: number;
}

export const reportsService = {
  async cashPositionReport(companyId: string, date: string): Promise<CashPositionReportData> {
    const { data, error } = await supabase
      .from('bank_accounts')
      .select('bank_name, account_name, currency, current_balance')
      .eq('company_id', companyId)
      .eq('is_active', true);

    if (error) throw error;

    const accounts = (data ?? []).map((a) => ({
      bank_name: a.bank_name,
      account_name: a.account_name,
      currency: a.currency,
      balance: a.current_balance,
    }));

    const totalMap = new Map<string, number>();
    accounts.forEach((a) => {
      totalMap.set(a.currency, (totalMap.get(a.currency) ?? 0) + a.balance);
    });

    return {
      accounts,
      total_by_currency: Array.from(totalMap.entries()).map(([currency, total]) => ({
        currency,
        total,
      })),
      report_date: date,
    };
  },

  async cashFlowReport(
    companyId: string,
    startDate: string,
    endDate: string,
  ): Promise<CashFlowReportData> {
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('type, category, amount')
      .eq('company_id', companyId)
      .gte('date', startDate)
      .lte('date', endDate);

    if (error) throw error;

    const receiptsMap = new Map<string, number>();
    const disbursementsMap = new Map<string, number>();

    (transactions ?? []).forEach((t) => {
      const map = t.type === 'receipt' ? receiptsMap : disbursementsMap;
      const cat = t.category ?? 'Uncategorized';
      map.set(cat, (map.get(cat) ?? 0) + Math.abs(t.amount));
    });

    const receipts = Array.from(receiptsMap.entries()).map(([category, amount]) => ({
      category,
      amount,
    }));
    const disbursements = Array.from(disbursementsMap.entries()).map(([category, amount]) => ({
      category,
      amount,
    }));

    const totalReceipts = receipts.reduce((s, r) => s + r.amount, 0);
    const totalDisbursements = disbursements.reduce((s, d) => s + d.amount, 0);

    return {
      receipts,
      disbursements,
      total_receipts: totalReceipts,
      total_disbursements: totalDisbursements,
      net_cash_flow: totalReceipts - totalDisbursements,
      start_date: startDate,
      end_date: endDate,
    };
  },

  async budgetVarianceReport(
    companyId: string,
    budgetId: string,
  ): Promise<BudgetVarianceReportData> {
    const { data: budgetItems, error: budgetError } = await supabase
      .from('budget_items')
      .select('category, amount')
      .eq('budget_id', budgetId);

    if (budgetError) throw budgetError;

    const { data: actuals, error: actualsError } = await supabase
      .from('transactions')
      .select('category, amount')
      .eq('company_id', companyId);

    if (actualsError) throw actualsError;

    const actualMap = new Map<string, number>();
    (actuals ?? []).forEach((a) => {
      const cat = a.category ?? 'Uncategorized';
      actualMap.set(cat, (actualMap.get(cat) ?? 0) + Math.abs(a.amount));
    });

    const items = (budgetItems ?? []).map((b) => {
      const actual = actualMap.get(b.category) ?? 0;
      const variance = actual - b.amount;
      const variancePct = b.amount !== 0 ? (variance / b.amount) * 100 : 0;
      return {
        category: b.category,
        budget: b.amount,
        actual,
        variance,
        variance_pct: Math.round(variancePct * 100) / 100,
      };
    });

    const totalBudget = items.reduce((s, i) => s + i.budget, 0);
    const totalActual = items.reduce((s, i) => s + i.actual, 0);

    return {
      items,
      total_budget: totalBudget,
      total_actual: totalActual,
      total_variance: totalActual - totalBudget,
    };
  },

  async forecastAccuracyReport(
    companyId: string,
    _period: string,
  ): Promise<ForecastAccuracyReportData> {
    const { data: forecasts, error } = await supabase
      .from('forecasts')
      .select('period, forecasted_amount, actual_amount')
      .eq('company_id', companyId)
      .order('period');

    if (error) throw error;

    const periods = (forecasts ?? []).map((f) => {
      const accuracy =
        f.forecasted_amount !== 0
          ? (1 - Math.abs(f.actual_amount - f.forecasted_amount) / f.forecasted_amount) * 100
          : 0;
      return {
        period: f.period,
        forecasted: f.forecasted_amount,
        actual: f.actual_amount,
        accuracy_pct: Math.round(Math.max(0, accuracy) * 100) / 100,
      };
    });

    const overallAccuracy =
      periods.length > 0
        ? periods.reduce((s, p) => s + p.accuracy_pct, 0) / periods.length
        : 0;

    return {
      periods,
      overall_accuracy: Math.round(overallAccuracy * 100) / 100,
    };
  },

  async agingReport(companyId: string): Promise<AgingReportData> {
    const { data: receivables, error: recError } = await supabase
      .from('receivables')
      .select('due_date, amount')
      .eq('company_id', companyId);

    if (recError) throw recError;

    const { data: payables, error: payError } = await supabase
      .from('payables')
      .select('due_date, amount')
      .eq('company_id', companyId);

    if (payError) throw payError;

    const now = new Date();
    const ranges = [
      { range: 'Current', min: -Infinity, max: 0 },
      { range: '1-30 days', min: 1, max: 30 },
      { range: '31-60 days', min: 31, max: 60 },
      { range: '61-90 days', min: 61, max: 90 },
      { range: '90+ days', min: 91, max: Infinity },
    ];

    function getDaysOverdue(dueDate: string): number {
      return Math.ceil((now.getTime() - new Date(dueDate).getTime()) / (1000 * 60 * 60 * 24));
    }

    const buckets = ranges.map((r) => {
      const recTotal = (receivables ?? [])
        .filter((item) => {
          const days = getDaysOverdue(item.due_date);
          return days >= r.min && days <= r.max;
        })
        .reduce((s, item) => s + item.amount, 0);

      const payTotal = (payables ?? [])
        .filter((item) => {
          const days = getDaysOverdue(item.due_date);
          return days >= r.min && days <= r.max;
        })
        .reduce((s, item) => s + item.amount, 0);

      return { range: r.range, receivables: recTotal, payables: payTotal };
    });

    return {
      buckets,
      total_receivables: buckets.reduce((s, b) => s + b.receivables, 0),
      total_payables: buckets.reduce((s, b) => s + b.payables, 0),
    };
  },

  async bankReconciliationReport(
    companyId: string,
    accountId: string,
  ): Promise<BankReconciliationReportData> {
    const { data: account, error: accError } = await supabase
      .from('bank_accounts')
      .select('current_balance')
      .eq('id', accountId)
      .eq('company_id', companyId)
      .single();

    if (accError) throw accError;

    return {
      bank_balance: account.current_balance,
      book_balance: account.current_balance,
      unmatched_bank_items: [],
      unmatched_book_items: [],
      reconciled: true,
    };
  },

  async collectionReport(_companyId: string): Promise<CollectionReportData> {
    // Mock data in FCFA
    const counterparties = [
      { name: 'SONATEL SA', amount_due: 23_800_000, amount_collected: 21_500_000, recovery_rate: 90.3, dso: 28 },
      { name: 'Orange CI', amount_due: 27_800_000, amount_collected: 22_200_000, recovery_rate: 79.9, dso: 42 },
      { name: 'Ecobank Togo', amount_due: 12_900_000, amount_collected: 10_400_000, recovery_rate: 80.6, dso: 35 },
      { name: 'BCEAO', amount_due: 45_000_000, amount_collected: 45_000_000, recovery_rate: 100.0, dso: 15 },
      { name: 'CFAO Motors', amount_due: 28_200_000, amount_collected: 16_800_000, recovery_rate: 59.6, dso: 68 },
      { name: 'Bolloré Transport', amount_due: 15_400_000, amount_collected: 14_200_000, recovery_rate: 92.2, dso: 22 },
    ];
    const totalDue = counterparties.reduce((s, c) => s + c.amount_due, 0);
    const totalCollected = counterparties.reduce((s, c) => s + c.amount_collected, 0);
    return {
      counterparties,
      global_recovery_rate: totalDue > 0 ? Math.round((totalCollected / totalDue) * 1000) / 10 : 0,
      average_dso: Math.round(counterparties.reduce((s, c) => s + c.dso, 0) / counterparties.length),
    };
  },

  async disputeReport(_companyId: string): Promise<DisputeReportData> {
    const disputes = [
      { reference: 'LIT-2025-001', debtor: 'CFAO Motors', amount: 28_200_000, provision: 14_100_000, status: 'in_progress', next_hearing: '2026-04-15' },
      { reference: 'LIT-2025-002', debtor: 'Société Générale CI', amount: 15_600_000, provision: 7_800_000, status: 'open', next_hearing: '2026-05-22' },
      { reference: 'LIT-2024-008', debtor: 'Transport Abidjan', amount: 8_400_000, provision: 8_400_000, status: 'in_progress', next_hearing: '2026-04-03' },
      { reference: 'LIT-2025-003', debtor: 'Maersk Dakar', amount: 42_000_000, provision: 21_000_000, status: 'open', next_hearing: null },
      { reference: 'LIT-2024-012', debtor: 'BTP Construction', amount: 6_750_000, provision: 3_375_000, status: 'settled', next_hearing: null },
    ];
    const active = disputes.filter((d) => d.status !== 'settled' && d.status !== 'closed');
    return {
      disputes,
      total_litigated: active.reduce((s, d) => s + d.amount, 0),
      total_provisions: active.reduce((s, d) => s + d.provision, 0),
      active_count: active.length,
    };
  },

  async multiBankReport(_companyId: string): Promise<MultiBankReportData> {
    const accounts = [
      { account: 'Compte courant XOF', bank: 'SGBCI', opening: 85_000_000, receipts: 62_500_000, disbursements: 48_200_000, closing: 99_300_000, fees: 185_000 },
      { account: 'Compte courant XOF', bank: 'Ecobank', opening: 42_000_000, receipts: 38_700_000, disbursements: 35_100_000, closing: 45_600_000, fees: 142_000 },
      { account: 'Compte épargne', bank: 'BOA', opening: 120_000_000, receipts: 15_000_000, disbursements: 0, closing: 135_000_000, fees: 0 },
      { account: 'Mobile Money Orange', bank: 'Orange Money', opening: 8_500_000, receipts: 12_300_000, disbursements: 11_800_000, closing: 9_000_000, fees: 245_000 },
      { account: 'Caisse principale', bank: 'Cash', opening: 3_200_000, receipts: 6_800_000, disbursements: 5_400_000, closing: 4_600_000, fees: 0 },
      { account: 'Compte USD', bank: 'SGBCI', opening: 15_000_000, receipts: 8_200_000, disbursements: 6_100_000, closing: 17_100_000, fees: 95_000 },
    ];
    return {
      accounts,
      total_fees: accounts.reduce((s, a) => s + a.fees, 0),
    };
  },

  async capexReport(_companyId: string): Promise<CapexReportData> {
    return {
      operations: [
        { code: 'CAPEX-001', name: 'Fleet renewal — delivery trucks', budget: 180_000_000, committed: 135_000_000, invoiced: 120_000_000, disbursed: 90_000_000, remaining: 90_000_000 },
        { code: 'CAPEX-002', name: 'IT infrastructure upgrade', budget: 45_000_000, committed: 42_000_000, invoiced: 38_500_000, disbursed: 38_500_000, remaining: 6_500_000 },
        { code: 'CAPEX-003', name: 'Warehouse extension Dakar', budget: 320_000_000, committed: 185_000_000, invoiced: 160_000_000, disbursed: 145_000_000, remaining: 175_000_000 },
        { code: 'CAPEX-004', name: 'Solar panel installation', budget: 75_000_000, committed: 75_000_000, invoiced: 72_000_000, disbursed: 72_000_000, remaining: 3_000_000 },
        { code: 'CAPEX-005', name: 'Office renovation Abidjan', budget: 28_000_000, committed: 12_000_000, invoiced: 8_500_000, disbursed: 8_500_000, remaining: 19_500_000 },
      ],
    };
  },

  async fiscalReport(_companyId: string): Promise<FiscalReportData> {
    return {
      obligations: [
        { type: 'TVA (VAT)', period: 'Jan 2026', amount: 18_500_000, due_date: '2026-02-20', status: 'paid', paid_date: '2026-02-18' },
        { type: 'TVA (VAT)', period: 'Feb 2026', amount: 21_200_000, due_date: '2026-03-20', status: 'paid', paid_date: '2026-03-17' },
        { type: 'TVA (VAT)', period: 'Mar 2026', amount: 19_800_000, due_date: '2026-04-20', status: 'upcoming', paid_date: null },
        { type: 'Impôt sur les sociétés', period: 'Q4 2025', amount: 45_000_000, due_date: '2026-03-31', status: 'upcoming', paid_date: null },
        { type: 'Retenue à la source', period: 'Feb 2026', amount: 8_700_000, due_date: '2026-03-15', status: 'paid', paid_date: '2026-03-14' },
        { type: 'Retenue à la source', period: 'Mar 2026', amount: 9_100_000, due_date: '2026-04-15', status: 'upcoming', paid_date: null },
        { type: 'Charges sociales', period: 'Feb 2026', amount: 14_300_000, due_date: '2026-03-10', status: 'paid', paid_date: '2026-03-09' },
        { type: 'Charges sociales', period: 'Mar 2026', amount: 14_800_000, due_date: '2026-04-10', status: 'upcoming', paid_date: null },
        { type: 'Patente', period: 'Annual 2026', amount: 6_500_000, due_date: '2026-03-31', status: 'overdue', paid_date: null },
        { type: 'Droits de douane', period: 'Feb 2026', amount: 12_400_000, due_date: '2026-03-05', status: 'paid', paid_date: '2026-03-04' },
      ],
    };
  },

  async treasuryWeeklyReport(_companyId: string): Promise<TreasuryWeeklyReportData> {
    const weeks = [];
    let balance = 285_000_000;
    const baseDate = new Date('2026-03-23');

    for (let i = 0; i < 13; i++) {
      const weekStart = new Date(baseDate);
      weekStart.setDate(baseDate.getDate() + i * 7);
      const label = `W${i + 1}`;
      const opening = balance;
      const receipts = 28_000_000 + Math.round(Math.random() * 18_000_000);
      const disbursements = 22_000_000 + Math.round(Math.random() * 15_000_000);
      const net_flow = receipts - disbursements;
      const closing = opening + net_flow;
      balance = closing;
      weeks.push({ week: label, opening, receipts, disbursements, net_flow, closing });
    }

    return { weeks, threshold: 200_000_000 };
  },
};
