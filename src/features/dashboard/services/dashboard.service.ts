import { supabase } from '@/config/supabase';

// ─── Shared / Legacy Types ───────────────────────────────────────────────────

export interface DashboardSummary {
  totalBalance: number;
  monthReceipts: number;
  monthDisbursements: number;
  netCashFlow: number;
  pendingPayments: number;
  alertsCount: number;
}

export interface CashFlowTrendItem {
  date: string;
  receipts: number;
  disbursements: number;
  net: number;
}

export interface TopCategory {
  name: string;
  value: number;
}

export interface RecentTransaction {
  id: string;
  date: string;
  type: 'receipt' | 'disbursement';
  category: string;
  description: string;
  amount: number;
  currency: string;
  status: 'pending' | 'validated' | 'reconciled';
}

// ─── CEO Dashboard Types ─────────────────────────────────────────────────────

export interface CEOAlert {
  id: string;
  title: string;
  message: string;
  severity: 'critical' | 'warning' | 'info';
  date: string;
}

export interface BudgetVsActualItem {
  category: string;
  type: 'revenue' | 'expense';
  budget: number;
  actual: number;
  variance: number;
  variancePercent: number;
}

export interface DelinquentTenant {
  id: string;
  name: string;
  amountDue: number;
  daysOverdue: number;
  severity: 'critical' | 'warning' | 'info';
}

export interface PendingApproval {
  id: string;
  description: string;
  amount: number;
  requestedBy: string;
  date: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

export interface EntityBreakdown {
  id: string;
  companyName: string;
  position: number;
  status: 'healthy' | 'warning' | 'critical';
}

export interface CEODashboardData {
  consolidatedPosition: number;
  forecastJ30: number;
  forecastJ90: number;
  alerts: CEOAlert[];
  budgetVsActual: BudgetVsActualItem[];
  delinquentTenants: DelinquentTenant[];
  pendingApprovals: PendingApproval[];
  entityBreakdown: EntityBreakdown[];
}

// ─── CFO Dashboard Types ─────────────────────────────────────────────────────

export interface BankPositionItem {
  id: string;
  accountName: string;
  bankName: string;
  realBalance: number;
  forecastJ7: number;
  status: 'healthy' | 'warning' | 'critical';
}

export interface WeeklyPlanItem {
  week: string;
  receipts: number;
  disbursements: number;
  net: number;
}

export interface DailyActionCounts {
  unidentifiedFlows: number;
  missingCashCounts: number;
  pendingApprovals: number;
  missingBankImports: number;
}

export interface VATDue {
  amount: number;
  deadline: string;
  daysRemaining: number;
}

export interface FinancialRatio {
  name: string;
  value: number;
  unit: string;
  status: 'good' | 'warning' | 'critical';
}

export interface CFODashboardData {
  bankPositions: BankPositionItem[];
  weeklyPlan: WeeklyPlanItem[];
  dailyActions: DailyActionCounts;
  vatDue: VATDue;
  financialRatios: FinancialRatio[];
}

// ─── Treasurer Dashboard Types ───────────────────────────────────────────────

export interface ToProcessItem {
  key: 'receiptsToMatch' | 'unidentifiedFlows' | 'pendingCashCounts' | 'overdueJustifications';
  label: string;
  count: number;
  icon: string;
}

export interface DeadlineItem {
  id: string;
  date: string;
  description: string;
  amount: number;
  bankAccount: string;
}

export interface TreasurerDashboardData {
  toProcess: ToProcessItem[];
  deadlines: DeadlineItem[];
}

// ─── Center Manager Dashboard Types ──────────────────────────────────────────

export interface TenantFollowUp {
  id: string;
  name: string;
  amountDue: number;
  daysOverdue: number;
  severity: 'critical' | 'warning' | 'info';
  lastAction: string;
}

export interface CashRegisterStatus {
  id: string;
  name: string;
  balance: number;
  status: 'open' | 'closed' | 'discrepancy';
}

export interface TenantStatusBreakdown {
  upToDate: number;
  late: number;
  dispute: number;
  vacant: number;
  total: number;
}

export interface CenterManagerDashboardData {
  followUps: TenantFollowUp[];
  cashRegisters: CashRegisterStatus[];
  tenantStatus: TenantStatusBreakdown;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getMonthRange(monthsAgo: number): { start: string; end: string } {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1);
  const start = d.toISOString().split('T')[0];
  const endDate = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  const end = endDate.toISOString().split('T')[0];
  return { start, end };
}

function getMonthLabel(monthsAgo: number): string {
  const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1);
  return `${months[d.getMonth()]} ${d.getFullYear()}`;
}

function getWeekRange(weeksFromNow: number): { start: string; end: string; label: string } {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const startOfThisWeek = new Date(now);
  startOfThisWeek.setDate(now.getDate() - dayOfWeek + 1);

  const start = new Date(startOfThisWeek);
  start.setDate(start.getDate() + weeksFromNow * 7);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);

  const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
  const weekNum = Math.ceil((start.getDate() + new Date(start.getFullYear(), start.getMonth(), 1).getDay()) / 7);
  const label = `S${weekNum} (${start.getDate()}-${end.getDate()} ${months[start.getMonth()]})`;

  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
    label,
  };
}

function balanceStatus(balance: number): 'healthy' | 'warning' | 'critical' {
  if (balance <= 0) return 'critical';
  if (balance < 5_000_000) return 'critical';
  if (balance < 20_000_000) return 'warning';
  return 'healthy';
}

// ─── Service ─────────────────────────────────────────────────────────────────

export const dashboardService = {
  async getSummary(companyId: string): Promise<DashboardSummary> {
    // Get total balance from bank accounts
    const { data: accounts, error: accError } = await supabase
      .from('bank_accounts')
      .select('current_balance')
      .eq('company_id', companyId)
      .eq('is_active', true);
    if (accError) throw accError;

    const totalBalance = (accounts ?? []).reduce((sum, a) => sum + (a.current_balance ?? 0), 0);

    // Get current month cash flows
    const { start, end } = getMonthRange(0);
    const { data: flows, error: flowError } = await supabase
      .from('cash_flows')
      .select('type, amount')
      .eq('company_id', companyId)
      .gte('value_date', start)
      .lte('value_date', end)
      .neq('status', 'cancelled');
    if (flowError) throw flowError;

    const monthReceipts = (flows ?? [])
      .filter((f) => f.type === 'receipt')
      .reduce((sum, f) => sum + f.amount, 0);
    const monthDisbursements = (flows ?? [])
      .filter((f) => f.type === 'disbursement')
      .reduce((sum, f) => sum + f.amount, 0);

    // Pending payments count
    const { count: pendingPayments, error: pendingError } = await supabase
      .from('payment_requests')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .eq('status', 'pending_approval');
    if (pendingError) throw pendingError;

    // Alerts count
    const { count: alertsCount, error: alertError } = await supabase
      .from('alerts')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .eq('is_read', false);
    if (alertError) throw alertError;

    return {
      totalBalance,
      monthReceipts,
      monthDisbursements,
      netCashFlow: monthReceipts - monthDisbursements,
      pendingPayments: pendingPayments ?? 0,
      alertsCount: alertsCount ?? 0,
    };
  },

  async getCashFlowTrend(companyId: string, months: number = 6): Promise<CashFlowTrendItem[]> {
    const items: CashFlowTrendItem[] = [];

    for (let i = months - 1; i >= 0; i--) {
      const { start, end } = getMonthRange(i);
      const label = getMonthLabel(i);

      const { data: flows, error } = await supabase
        .from('cash_flows')
        .select('type, amount')
        .eq('company_id', companyId)
        .gte('value_date', start)
        .lte('value_date', end)
        .neq('status', 'cancelled');
      if (error) throw error;

      const receipts = (flows ?? [])
        .filter((f) => f.type === 'receipt')
        .reduce((sum, f) => sum + f.amount, 0);
      const disbursements = (flows ?? [])
        .filter((f) => f.type === 'disbursement')
        .reduce((sum, f) => sum + f.amount, 0);

      items.push({
        date: label,
        receipts,
        disbursements,
        net: receipts - disbursements,
      });
    }

    return items;
  },

  async getTopCategories(companyId: string): Promise<TopCategory[]> {
    const { start, end } = getMonthRange(0);

    const { data: flows, error } = await supabase
      .from('cash_flows')
      .select('category, amount')
      .eq('company_id', companyId)
      .gte('value_date', start)
      .lte('value_date', end)
      .neq('status', 'cancelled');
    if (error) throw error;

    const categoryMap = new Map<string, number>();
    for (const flow of flows ?? []) {
      const current = categoryMap.get(flow.category) ?? 0;
      categoryMap.set(flow.category, current + flow.amount);
    }

    return Array.from(categoryMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  },

  async getRecentTransactions(companyId: string, limit: number = 10): Promise<RecentTransaction[]> {
    const { data, error } = await supabase
      .from('cash_flows')
      .select('id, value_date, type, category, description, amount, currency, status')
      .eq('company_id', companyId)
      .neq('status', 'cancelled')
      .order('value_date', { ascending: false })
      .limit(limit);
    if (error) throw error;

    return (data ?? []).map((f) => ({
      id: f.id,
      date: f.value_date,
      type: f.type as 'receipt' | 'disbursement',
      category: f.category,
      description: f.description ?? '',
      amount: f.amount,
      currency: f.currency,
      status: f.status as 'pending' | 'validated' | 'reconciled',
    }));
  },

  // ─── CEO Dashboard ──────────────────────────────────────────────────────────

  async getCEODashboard(tenantId: string): Promise<CEODashboardData> {
    // Fetch all companies for this tenant
    const { data: companies, error: compError } = await supabase
      .from('companies')
      .select('id, name')
      .eq('tenant_id', tenantId)
      .eq('is_active', true);
    if (compError) throw compError;

    const companyIds = (companies ?? []).map((c) => c.id);

    // Consolidated position: sum of all bank accounts across companies
    const { data: allAccounts, error: accError } = await supabase
      .from('bank_accounts')
      .select('current_balance, company_id')
      .in('company_id', companyIds)
      .eq('is_active', true);
    if (accError) throw accError;

    const consolidatedPosition = (allAccounts ?? []).reduce(
      (sum, a) => sum + (a.current_balance ?? 0),
      0,
    );

    // Entity breakdown
    const entityBreakdown: EntityBreakdown[] = (companies ?? []).map((company) => {
      const companyAccounts = (allAccounts ?? []).filter((a) => a.company_id === company.id);
      const position = companyAccounts.reduce((sum, a) => sum + (a.current_balance ?? 0), 0);
      return {
        id: company.id,
        companyName: company.name,
        position,
        status: balanceStatus(position),
      };
    });

    // Forecasts for J+30 and J+90
    const now = new Date();
    const j30 = new Date(now);
    j30.setDate(j30.getDate() + 30);
    const j90 = new Date(now);
    j90.setDate(j90.getDate() + 90);

    const { data: forecasts30, error: fc30Error } = await supabase
      .from('forecasts')
      .select('type, amount')
      .in('company_id', companyIds)
      .lte('forecast_date', j30.toISOString().split('T')[0])
      .gte('forecast_date', now.toISOString().split('T')[0]);
    if (fc30Error) throw fc30Error;

    const forecastNet30 = (forecasts30 ?? []).reduce((sum, f) => {
      return sum + (f.type === 'receipt' ? f.amount : -f.amount);
    }, 0);

    const { data: forecasts90, error: fc90Error } = await supabase
      .from('forecasts')
      .select('type, amount')
      .in('company_id', companyIds)
      .lte('forecast_date', j90.toISOString().split('T')[0])
      .gte('forecast_date', now.toISOString().split('T')[0]);
    if (fc90Error) throw fc90Error;

    const forecastNet90 = (forecasts90 ?? []).reduce((sum, f) => {
      return sum + (f.type === 'receipt' ? f.amount : -f.amount);
    }, 0);

    // Alerts
    const { data: alertRows, error: alertError } = await supabase
      .from('alerts')
      .select('*')
      .in('company_id', companyIds)
      .eq('is_read', false)
      .order('created_at', { ascending: false })
      .limit(10);
    if (alertError) throw alertError;

    const alerts: CEOAlert[] = (alertRows ?? []).map((a) => ({
      id: a.id,
      title: a.title,
      message: a.message,
      severity: a.severity as 'critical' | 'warning' | 'info',
      date: a.created_at.split('T')[0],
    }));

    // Budget vs Actual: query budget_lines and cash_flows for current month
    const { start, end } = getMonthRange(0);
    const currentMonth = new Date().getMonth() + 1;
    const monthKey = `month_${String(currentMonth).padStart(2, '0')}` as string;

    const { data: budgets, error: budgetError } = await supabase
      .from('budgets')
      .select('id, company_id')
      .in('company_id', companyIds)
      .eq('status', 'approved');
    if (budgetError) throw budgetError;

    const budgetIds = (budgets ?? []).map((b) => b.id);
    let budgetVsActual: BudgetVsActualItem[] = [];

    if (budgetIds.length > 0) {
      const { data: budgetLines, error: blError } = await supabase
        .from('budget_lines')
        .select('*')
        .in('budget_id', budgetIds);
      if (blError) throw blError;

      const { data: monthFlows, error: mfError } = await supabase
        .from('cash_flows')
        .select('type, category, amount')
        .in('company_id', companyIds)
        .gte('value_date', start)
        .lte('value_date', end)
        .neq('status', 'cancelled');
      if (mfError) throw mfError;

      // Group actuals by category
      const actualByCategory = new Map<string, { type: string; amount: number }>();
      for (const f of monthFlows ?? []) {
        const existing = actualByCategory.get(f.category);
        if (existing) {
          existing.amount += f.amount;
        } else {
          actualByCategory.set(f.category, { type: f.type, amount: f.amount });
        }
      }

      // Group budgets by category
      const budgetByCategory = new Map<string, { type: string; amount: number }>();
      for (const bl of budgetLines ?? []) {
        const budgetAmount = (bl as Record<string, unknown>)[monthKey] as number ?? 0;
        const existing = budgetByCategory.get(bl.category);
        if (existing) {
          existing.amount += budgetAmount;
        } else {
          budgetByCategory.set(bl.category, { type: bl.type, amount: budgetAmount });
        }
      }

      // Merge
      const allCategories = new Set([...actualByCategory.keys(), ...budgetByCategory.keys()]);
      budgetVsActual = Array.from(allCategories).map((category) => {
        const budgetEntry = budgetByCategory.get(category);
        const actualEntry = actualByCategory.get(category);
        const budget = budgetEntry?.amount ?? 0;
        const actual = actualEntry?.amount ?? 0;
        const variance = actual - budget;
        const variancePercent = budget !== 0 ? Math.round((variance / budget) * 1000) / 10 : 0;
        const type: 'revenue' | 'expense' =
          (budgetEntry?.type ?? actualEntry?.type) === 'receipt' ? 'revenue' : 'expense';

        return { category, type, budget, actual, variance, variancePercent };
      });
    }

    // Pending approvals
    const { data: pendingReqs, error: prError } = await supabase
      .from('payment_requests')
      .select('id, description, amount, requester_id, payment_date, priority')
      .in('company_id', companyIds)
      .eq('status', 'pending_approval')
      .order('created_at', { ascending: false })
      .limit(10);
    if (prError) throw prError;

    const pendingApprovals: PendingApproval[] = (pendingReqs ?? []).map((r) => ({
      id: r.id,
      description: r.description,
      amount: r.amount,
      requestedBy: r.requester_id,
      date: r.payment_date,
      priority: r.priority as 'low' | 'medium' | 'high' | 'urgent',
    }));

    return {
      consolidatedPosition,
      forecastJ30: consolidatedPosition + forecastNet30,
      forecastJ90: consolidatedPosition + forecastNet90,
      alerts,
      budgetVsActual,
      delinquentTenants: [], // Requires domain-specific table (tenant tracking); returns empty until implemented
      pendingApprovals,
      entityBreakdown,
    };
  },

  // ─── CFO Dashboard ──────────────────────────────────────────────────────────

  async getCFODashboard(companyId: string): Promise<CFODashboardData> {
    // Bank positions
    const { data: accounts, error: accError } = await supabase
      .from('bank_accounts')
      .select('id, account_name, bank_name, current_balance')
      .eq('company_id', companyId)
      .eq('is_active', true);
    if (accError) throw accError;

    // Forecasts for the next 7 days for each account
    const now = new Date();
    const j7 = new Date(now);
    j7.setDate(j7.getDate() + 7);

    const { data: forecasts7, error: fc7Error } = await supabase
      .from('forecasts')
      .select('bank_account_id, type, amount')
      .eq('company_id', companyId)
      .gte('forecast_date', now.toISOString().split('T')[0])
      .lte('forecast_date', j7.toISOString().split('T')[0]);
    if (fc7Error) throw fc7Error;

    const forecastByAccount = new Map<string, number>();
    for (const f of forecasts7 ?? []) {
      if (f.bank_account_id) {
        const current = forecastByAccount.get(f.bank_account_id) ?? 0;
        forecastByAccount.set(
          f.bank_account_id,
          current + (f.type === 'receipt' ? f.amount : -f.amount),
        );
      }
    }

    const bankPositions: BankPositionItem[] = (accounts ?? []).map((a) => {
      const forecastDelta = forecastByAccount.get(a.id) ?? 0;
      const forecastJ7 = a.current_balance + forecastDelta;
      return {
        id: a.id,
        accountName: a.account_name,
        bankName: a.bank_name,
        realBalance: a.current_balance,
        forecastJ7,
        status: balanceStatus(forecastJ7),
      };
    });

    // Weekly plan (next 13 weeks)
    const weeklyPlan: WeeklyPlanItem[] = [];
    for (let w = 0; w < 13; w++) {
      const range = getWeekRange(w);
      const { data: weekForecasts, error: wfError } = await supabase
        .from('forecasts')
        .select('type, amount')
        .eq('company_id', companyId)
        .gte('forecast_date', range.start)
        .lte('forecast_date', range.end);
      if (wfError) throw wfError;

      const receipts = (weekForecasts ?? [])
        .filter((f) => f.type === 'receipt')
        .reduce((sum, f) => sum + f.amount, 0);
      const disbursements = (weekForecasts ?? [])
        .filter((f) => f.type === 'disbursement')
        .reduce((sum, f) => sum + f.amount, 0);

      weeklyPlan.push({
        week: range.label,
        receipts,
        disbursements,
        net: receipts - disbursements,
      });
    }

    // Daily actions: count unidentified flows (no counterparty), pending approvals, etc.
    const { count: unidentifiedFlows } = await supabase
      .from('cash_flows')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .is('counterparty_id', null)
      .eq('status', 'pending');

    const { count: pendingApprovals } = await supabase
      .from('payment_requests')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .eq('status', 'pending_approval');

    const dailyActions: DailyActionCounts = {
      unidentifiedFlows: unidentifiedFlows ?? 0,
      missingCashCounts: 0, // Domain-specific; returns 0 until cash register tracking is implemented
      pendingApprovals: pendingApprovals ?? 0,
      missingBankImports: 0, // Domain-specific; returns 0 until bank import tracking is implemented
    };

    // VAT due: next upcoming VAT tax obligation
    const { data: vatObligation, error: vatError } = await supabase
      .from('tax_obligations')
      .select('amount, due_date')
      .eq('company_id', companyId)
      .eq('type', 'vat')
      .eq('status', 'upcoming')
      .order('due_date', { ascending: true })
      .limit(1)
      .maybeSingle();
    if (vatError) throw vatError;

    let vatDue: VATDue;
    if (vatObligation) {
      const dueDate = new Date(vatObligation.due_date);
      const daysRemaining = Math.max(
        0,
        Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
      );
      vatDue = {
        amount: vatObligation.amount,
        deadline: vatObligation.due_date,
        daysRemaining,
      };
    } else {
      vatDue = { amount: 0, deadline: '', daysRemaining: 0 };
    }

    // Financial ratios: compute from real data
    const totalBalance = (accounts ?? []).reduce((sum, a) => sum + a.current_balance, 0);
    const { start: monthStart, end: monthEnd } = getMonthRange(0);
    const { data: monthFlows, error: mfError } = await supabase
      .from('cash_flows')
      .select('type, amount, value_date')
      .eq('company_id', companyId)
      .gte('value_date', monthStart)
      .lte('value_date', monthEnd)
      .neq('status', 'cancelled');
    if (mfError) throw mfError;

    const monthDisb = (monthFlows ?? [])
      .filter((f) => f.type === 'disbursement')
      .reduce((s, f) => s + f.amount, 0);
    const monthRec = (monthFlows ?? [])
      .filter((f) => f.type === 'receipt')
      .reduce((s, f) => s + f.amount, 0);

    const dailyBurn = monthDisb > 0 ? monthDisb / 30 : 1;
    const daysCashOnHand = dailyBurn > 0 ? Math.round(totalBalance / dailyBurn) : 0;

    // DSO: average days from operation_date to value_date for receipts
    const receiptsWithDates = (monthFlows ?? []).filter((f) => f.type === 'receipt');
    const financialRatios: FinancialRatio[] = [
      {
        name: 'Days Cash on Hand',
        value: daysCashOnHand,
        unit: 'jours',
        status: daysCashOnHand > 30 ? 'good' : daysCashOnHand > 15 ? 'warning' : 'critical',
      },
      {
        name: 'Taux de recouvrement',
        value: monthRec > 0 && monthDisb > 0 ? Math.round((monthRec / (monthRec + monthDisb)) * 1000) / 10 : 0,
        unit: '%',
        status: 'good',
      },
    ];

    // Fetch debt contracts for DSCR
    const { data: debts, error: debtError } = await supabase
      .from('debt_contracts')
      .select('outstanding_amount, interest_rate, payment_frequency')
      .eq('company_id', companyId)
      .eq('status', 'active');
    if (debtError) throw debtError;

    if ((debts ?? []).length > 0) {
      const monthlyDebtService = (debts ?? []).reduce((sum, d) => {
        const freq = d.payment_frequency === 'monthly' ? 1 : d.payment_frequency === 'quarterly' ? 3 : 12;
        return sum + d.outstanding_amount * (d.interest_rate / 100 / 12) * freq;
      }, 0);

      const netOperatingCf = monthRec - monthDisb;
      const dscr = monthlyDebtService > 0
        ? Math.round((netOperatingCf / monthlyDebtService) * 100) / 100
        : 0;

      financialRatios.push({
        name: 'DSCR (Ratio couverture dette)',
        value: dscr,
        unit: 'x',
        status: dscr >= 1.5 ? 'good' : dscr >= 1.0 ? 'warning' : 'critical',
      });
    }

    return {
      bankPositions,
      weeklyPlan,
      dailyActions,
      vatDue,
      financialRatios,
    };
  },

  // ─── Treasurer Dashboard ────────────────────────────────────────────────────

  async getTreasurerDashboard(companyId: string): Promise<TreasurerDashboardData> {
    // Counts for toProcess
    const { count: unidentifiedFlows } = await supabase
      .from('cash_flows')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .is('counterparty_id', null)
      .eq('status', 'pending');

    const { count: pendingReceipts } = await supabase
      .from('cash_flows')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .eq('type', 'receipt')
      .eq('status', 'pending');

    const toProcess: ToProcessItem[] = [
      { key: 'receiptsToMatch', label: 'Encaissements à rapprocher', count: pendingReceipts ?? 0, icon: 'receipt' },
      { key: 'unidentifiedFlows', label: 'Flux non identifiés', count: unidentifiedFlows ?? 0, icon: 'help-circle' },
      { key: 'pendingCashCounts', label: 'Arrêtés de caisse en attente', count: 0, icon: 'calculator' },
      { key: 'overdueJustifications', label: 'Justificatifs en retard', count: 0, icon: 'file-warning' },
    ];

    // Upcoming deadlines: forecasts and payment requests in the next 7 days
    const now = new Date();
    const j7 = new Date(now);
    j7.setDate(j7.getDate() + 7);

    const { data: upcomingForecasts, error: ufError } = await supabase
      .from('forecasts')
      .select('id, forecast_date, category, amount, bank_account_id')
      .eq('company_id', companyId)
      .eq('type', 'disbursement')
      .gte('forecast_date', now.toISOString().split('T')[0])
      .lte('forecast_date', j7.toISOString().split('T')[0])
      .order('forecast_date', { ascending: true });
    if (ufError) throw ufError;

    const deadlines: DeadlineItem[] = (upcomingForecasts ?? []).map((f) => ({
      id: f.id,
      date: f.forecast_date,
      description: f.category,
      amount: f.amount,
      bankAccount: f.bank_account_id ?? '',
    }));

    return { toProcess, deadlines };
  },

  // ─── Center Manager Dashboard ───────────────────────────────────────────────

  async getCenterManagerDashboard(companyId: string): Promise<CenterManagerDashboardData> {
    // Follow-ups: counterparties with overdue receivables
    // This requires domain-specific tables; query counterparties and cash_flows
    const { error: cpError } = await supabase
      .from('counterparties')
      .select('id, name, type')
      .eq('company_id', companyId)
      .eq('is_active', true);
    if (cpError) throw cpError;

    // Cash register accounts
    const { data: cashAccounts, error: cashError } = await supabase
      .from('bank_accounts')
      .select('id, account_name, current_balance')
      .eq('company_id', companyId)
      .eq('account_type', 'cash')
      .eq('is_active', true);
    if (cashError) throw cashError;

    const cashRegisters: CashRegisterStatus[] = (cashAccounts ?? []).map((a) => ({
      id: a.id,
      name: a.account_name,
      balance: a.current_balance,
      status: 'open' as const,
    }));

    return {
      followUps: [], // Requires tenant/debtor tracking; returns empty until implemented
      cashRegisters,
      tenantStatus: {
        upToDate: 0,
        late: 0,
        dispute: 0,
        vacant: 0,
        total: 0,
      },
    };
  },
};
