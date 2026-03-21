import { supabase } from '@/config/supabase';
import type {
  Granularity,
  ForecastColumn,
  ForecastRow,
  ForecastCell,
  PositionBlock,
  RiskSummary,
  RollingForecast,
  SimulationParams,
} from '../types';

// ---------------------------------------------------------------------------
// Date helpers
// ---------------------------------------------------------------------------

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

function formatDateShort(d: Date): string {
  return d.toISOString().split('T')[0];
}

function formatWeekLabel(start: Date, end: Date): string {
  const months = [
    'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun',
    'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc',
  ];
  return `${start.getDate()}-${end.getDate()} ${months[start.getMonth()]}`;
}

function formatMonthLabel(d: Date): string {
  const months = [
    'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun',
    'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc',
  ];
  return `${months[d.getMonth()]} ${d.getFullYear()}`;
}

function cell(forecast: number): ForecastCell {
  return {
    forecast,
    low_80: Math.round(forecast * 0.85),
    high_80: Math.round(forecast * 1.12),
  };
}

function computeTotal(cells: Record<string, ForecastCell>): ForecastCell {
  let total = 0;
  for (const c of Object.values(cells)) {
    total += c.forecast;
  }
  return cell(total);
}

// ---------------------------------------------------------------------------
// Column generators
// ---------------------------------------------------------------------------

function generateWeeklyMonthlyColumns(refDate: Date): ForecastColumn[] {
  const cols: ForecastColumn[] = [];
  const today = refDate;

  for (let i = 0; i < 13; i++) {
    const start = addDays(today, i * 7);
    const end = addDays(start, 6);
    const confidence = Math.round(98 - i * 1.5);
    cols.push({
      key: `S${i + 1}`,
      label: formatWeekLabel(start, end),
      type: 'week',
      start_date: formatDateShort(start),
      end_date: formatDateShort(end),
      is_past: false,
      is_current: i === 0,
      confidence_pct: Math.max(confidence, 80),
    });
  }

  const monthStart = addDays(today, 13 * 7);
  for (let i = 0; i < 9; i++) {
    const start = addMonths(monthStart, i);
    const end = addMonths(start, 1);
    end.setDate(end.getDate() - 1);
    const confidence = Math.round(80 - i * 1);
    cols.push({
      key: `M${i + 4}`,
      label: formatMonthLabel(start),
      type: 'month',
      start_date: formatDateShort(start),
      end_date: formatDateShort(end),
      is_past: false,
      is_current: false,
      confidence_pct: Math.max(confidence, 71),
    });
  }

  return cols;
}

function generate13WeekColumns(refDate: Date): ForecastColumn[] {
  const cols: ForecastColumn[] = [];
  for (let i = 0; i < 13; i++) {
    const start = addDays(refDate, i * 7);
    const end = addDays(start, 6);
    const confidence = Math.round(98 - i * 1.5);
    cols.push({
      key: `S${i + 1}`,
      label: formatWeekLabel(start, end),
      type: 'week',
      start_date: formatDateShort(start),
      end_date: formatDateShort(end),
      is_past: false,
      is_current: i === 0,
      confidence_pct: Math.max(confidence, 80),
    });
  }
  return cols;
}

function generateMonthlyColumns(refDate: Date): ForecastColumn[] {
  const cols: ForecastColumn[] = [];
  for (let i = 0; i < 12; i++) {
    const start = addMonths(refDate, i);
    const end = addMonths(start, 1);
    end.setDate(end.getDate() - 1);
    const confidence = Math.round(98 - i * 2.25);
    cols.push({
      key: `M${i + 1}`,
      label: formatMonthLabel(start),
      type: 'month',
      start_date: formatDateShort(start),
      end_date: formatDateShort(end),
      is_past: false,
      is_current: i === 0,
      confidence_pct: Math.max(confidence, 71),
    });
  }
  return cols;
}

function generateQuarterlyColumns(refDate: Date): ForecastColumn[] {
  const cols: ForecastColumn[] = [];
  const qLabels = ['T1', 'T2', 'T3', 'T4'];
  for (let i = 0; i < 4; i++) {
    const start = addMonths(refDate, i * 3);
    const end = addMonths(start, 3);
    end.setDate(end.getDate() - 1);
    const confidence = Math.round(95 - i * 6);
    cols.push({
      key: `Q${i + 1}`,
      label: `${qLabels[i]} ${start.getFullYear()}`,
      type: 'quarter',
      start_date: formatDateShort(start),
      end_date: formatDateShort(end),
      is_past: false,
      is_current: i === 0,
      confidence_pct: Math.max(confidence, 71),
    });
  }
  return cols;
}

function getColumnsForGranularity(granularity: Granularity, refDate: Date): ForecastColumn[] {
  switch (granularity) {
    case 'weekly_monthly':
      return generateWeeklyMonthlyColumns(refDate);
    case 'monthly':
      return generateMonthlyColumns(refDate);
    case 'quarterly':
      return generateQuarterlyColumns(refDate);
    case 'plan_13_weeks':
      return generate13WeekColumns(refDate);
    default:
      return generateWeeklyMonthlyColumns(refDate);
  }
}

// ---------------------------------------------------------------------------
// Build forecast rows from real data
// ---------------------------------------------------------------------------

interface FlowRecord {
  type: string;
  category: string;
  amount: number;
  forecast_date?: string;
  value_date?: string;
}

function groupByCategory(
  flows: FlowRecord[],
  columns: ForecastColumn[],
  dateField: 'forecast_date' | 'value_date',
): Map<string, Record<string, number>> {
  const result = new Map<string, Record<string, number>>();

  for (const flow of flows) {
    const flowDate = flow[dateField];
    if (!flowDate) continue;

    // Find which column this date falls into
    for (const col of columns) {
      if (flowDate >= col.start_date && flowDate <= col.end_date) {
        const catMap = result.get(flow.category) ?? {};
        catMap[col.key] = (catMap[col.key] ?? 0) + flow.amount;
        result.set(flow.category, catMap);
        break;
      }
    }
  }

  return result;
}

function buildRows(
  categoryData: Map<string, Record<string, number>>,
  columns: ForecastColumn[],
  sign: '+' | '-',
  type: 'receipt' | 'disbursement',
): ForecastRow[] {
  const rows: ForecastRow[] = [];

  for (const [category, amounts] of categoryData.entries()) {
    const cells: Record<string, ForecastCell> = {};
    for (const col of columns) {
      cells[col.key] = cell(amounts[col.key] ?? 0);
    }

    rows.push({
      code: `${type === 'receipt' ? 'R' : 'D'}-${category.replace(/\s+/g, '-').toUpperCase()}`,
      label: category,
      level: 0,
      is_expandable: false,
      is_total: false,
      sign,
      cells,
      total: computeTotal(cells),
    });
  }

  // Add total row
  if (rows.length > 0) {
    const totalCells: Record<string, ForecastCell> = {};
    for (const col of columns) {
      let colTotal = 0;
      for (const row of rows) {
        colTotal += row.cells[col.key]?.forecast ?? 0;
      }
      totalCells[col.key] = cell(colTotal);
    }

    rows.push({
      code: type === 'receipt' ? 'R-TOTAL' : 'D-TOTAL',
      label: type === 'receipt' ? 'TOTAL ENCAISSEMENTS' : 'TOTAL DÉCAISSEMENTS',
      level: 0,
      is_expandable: false,
      is_total: true,
      sign,
      cells: totalCells,
      total: computeTotal(totalCells),
    });
  } else {
    // Even if no data, provide a total row with zeros
    const zeroCells: Record<string, ForecastCell> = {};
    for (const col of columns) {
      zeroCells[col.key] = cell(0);
    }
    rows.push({
      code: type === 'receipt' ? 'R-TOTAL' : 'D-TOTAL',
      label: type === 'receipt' ? 'TOTAL ENCAISSEMENTS' : 'TOTAL DÉCAISSEMENTS',
      level: 0,
      is_expandable: false,
      is_total: true,
      sign,
      cells: zeroCells,
      total: cell(0),
    });
  }

  return rows;
}

function generatePosition(
  columns: ForecastColumn[],
  receipts: ForecastRow[],
  disbursements: ForecastRow[],
  openingBalance: number,
): PositionBlock {
  const receiptTotal = receipts.find((r) => r.is_total);
  const disbTotal = disbursements.find((r) => r.is_total);
  const threshold = 0; // Will be configurable

  let opening = openingBalance;
  const positionColumns: PositionBlock['columns'] = {};

  for (const col of columns) {
    const inflow = receiptTotal?.cells[col.key]?.forecast ?? 0;
    const outflow = disbTotal?.cells[col.key]?.forecast ?? 0;
    const netFlow = inflow - outflow;
    const closing = opening + netFlow;
    const surplusDeficit = closing - threshold;

    positionColumns[col.key] = {
      opening,
      net_flow: netFlow,
      closing,
      threshold,
      surplus_deficit: surplusDeficit,
      optimistic: closing * 1.08,
      pessimistic: closing * 0.88,
    };

    opening = closing;
  }

  return { columns: positionColumns };
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export const rollingForecastService = {
  async getRollingForecast(
    companyId: string,
    granularity: Granularity = 'weekly_monthly',
    scenario: 'base' | 'optimistic' | 'pessimistic' = 'base',
  ): Promise<RollingForecast> {
    const refDate = new Date();
    const columns = getColumnsForGranularity(granularity, refDate);

    const periodStart = columns[0].start_date;
    const periodEnd = columns[columns.length - 1].end_date;

    // Fetch company info
    const { data: company } = await supabase
      .from('companies')
      .select('name, currency')
      .eq('id', companyId)
      .maybeSingle();

    // Fetch forecasts for the full period
    const { data: forecasts, error: fcError } = await supabase
      .from('forecasts')
      .select('type, category, amount, forecast_date')
      .eq('company_id', companyId)
      .gte('forecast_date', periodStart)
      .lte('forecast_date', periodEnd);
    if (fcError) throw fcError;

    // Also fetch realized cash flows for past/current periods
    const { data: cashFlows, error: cfError } = await supabase
      .from('cash_flows')
      .select('type, category, amount, value_date')
      .eq('company_id', companyId)
      .gte('value_date', periodStart)
      .lte('value_date', periodEnd)
      .neq('status', 'cancelled');
    if (cfError) throw cfError;

    // Merge forecasts and realized flows
    const allFlows: FlowRecord[] = [
      ...(forecasts ?? []).map((f) => ({
        type: f.type,
        category: f.category,
        amount: f.amount,
        forecast_date: f.forecast_date,
        value_date: undefined as string | undefined,
      })),
      ...(cashFlows ?? []).map((f) => ({
        type: f.type,
        category: f.category,
        amount: f.amount,
        forecast_date: undefined as string | undefined,
        value_date: f.value_date,
      })),
    ];

    // Group receipts and disbursements by category
    const receiptFlows = allFlows.filter((f) => f.type === 'receipt');
    const disbursementFlows = allFlows.filter((f) => f.type === 'disbursement');

    const receiptsByCategory = groupByCategory(
      receiptFlows.map((f) => ({ ...f, forecast_date: f.forecast_date ?? f.value_date })),
      columns,
      'forecast_date',
    );
    const disbursementsByCategory = groupByCategory(
      disbursementFlows.map((f) => ({ ...f, forecast_date: f.forecast_date ?? f.value_date })),
      columns,
      'forecast_date',
    );

    const receipts = buildRows(receiptsByCategory, columns, '+', 'receipt');
    const disbursements = buildRows(disbursementsByCategory, columns, '-', 'disbursement');

    // Opening balance from bank accounts
    const { data: bankAccounts } = await supabase
      .from('bank_accounts')
      .select('current_balance')
      .eq('company_id', companyId)
      .eq('is_active', true);

    const openingBalance = (bankAccounts ?? []).reduce((s, a) => s + a.current_balance, 0);
    const position = generatePosition(columns, receipts, disbursements, openingBalance);

    // Risk summary from real data
    const { data: disputes } = await supabase
      .from('dispute_files')
      .select('amount_disputed')
      .eq('company_id', companyId)
      .in('status', ['open', 'in_progress']);

    const disputesExpected = (disputes ?? []).reduce((s, d) => s + d.amount_disputed, 0);

    const { data: capexOps } = await supabase
      .from('capex_operations')
      .select('budget_amount, spent_amount, end_date')
      .eq('company_id', companyId)
      .eq('status', 'in_progress');

    const underfundedCapex = (capexOps ?? []).filter(
      (c) => c.budget_amount - c.spent_amount > 0,
    );

    const { data: debts } = await supabase
      .from('debt_contracts')
      .select('covenants')
      .eq('company_id', companyId)
      .eq('status', 'active');

    const riskSummary: RiskSummary = {
      tenants_at_risk: { count: 0, monthly_amount: 0 },
      disputes_expected: disputesExpected,
      capex_underfunded: underfundedCapex.length > 0
        ? {
            count: underfundedCapex.length,
            date: underfundedCapex[0]?.end_date ?? '',
            amount: underfundedCapex.reduce((s, c) => s + (c.budget_amount - c.spent_amount), 0),
          }
        : null,
      covenant_watch: null,
    };

    return {
      company_id: companyId,
      company_name: company?.name ?? '',
      reference_date: formatDateShort(refDate),
      period_start: periodStart,
      period_end: periodEnd,
      granularity,
      scenario,
      currency: company?.currency ?? 'XOF',
      columns,
      position,
      receipts,
      disbursements,
      risk_summary: riskSummary,
      last_updated: new Date().toISOString(),
    };
  },

  async getPlan13Weeks(companyId: string): Promise<RollingForecast> {
    return this.getRollingForecast(companyId, 'plan_13_weeks', 'base');
  },

  async simulateWithParams(
    companyId: string,
    params: SimulationParams,
  ): Promise<RollingForecast> {
    const base = await this.getRollingForecast(companyId, 'weekly_monthly', 'base');

    // Apply simulation adjustments to receipts
    for (const row of base.receipts) {
      for (const key of Object.keys(row.cells)) {
        const c = row.cells[key];
        c.forecast = Math.round(c.forecast * (params.recovery_rate / 100));
        if (c.low_80) c.low_80 = Math.round(c.low_80 * (params.recovery_rate / 100));
        if (c.high_80) c.high_80 = Math.round(c.high_80 * (params.recovery_rate / 100));
      }
      row.total = computeTotal(row.cells);
    }

    // Apply unplanned charges increase to disbursements
    for (const row of base.disbursements) {
      const factor = 1 + params.unplanned_charges_pct / 100;
      for (const key of Object.keys(row.cells)) {
        const c = row.cells[key];
        c.forecast = Math.round(c.forecast * factor);
        if (c.low_80) c.low_80 = Math.round(c.low_80 * factor);
        if (c.high_80) c.high_80 = Math.round(c.high_80 * factor);
      }
      row.total = computeTotal(row.cells);
    }

    // Fetch opening balance for recalculation
    const { data: bankAccounts } = await supabase
      .from('bank_accounts')
      .select('current_balance')
      .eq('company_id', companyId)
      .eq('is_active', true);

    const openingBalance = (bankAccounts ?? []).reduce((s, a) => s + a.current_balance, 0);
    base.position = generatePosition(base.columns, base.receipts, base.disbursements, openingBalance);

    return base;
  },

  async refreshForecast(companyId: string): Promise<RollingForecast> {
    return this.getRollingForecast(companyId);
  },

  async exportRollingExcel(_forecastId: string): Promise<{ url: string }> {
    // Export functionality to be implemented
    return { url: '#export-rolling-excel' };
  },

  async exportPlan13WeeksPDF(_forecastId: string): Promise<{ url: string }> {
    // Export functionality to be implemented
    return { url: '#export-plan-13-weeks-pdf' };
  },
};
