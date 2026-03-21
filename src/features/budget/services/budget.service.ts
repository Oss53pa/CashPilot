import { supabase } from '@/config/supabase';
import type {
  BudgetCreateInput,
  BudgetUpdateInput,
  BudgetLineInput,
  BudgetImportData,
  DistributionRule,
  BudgetComparison,
  BudgetComparisonLine,
  BudgetLine,
  BudgetApprovalStep,
  BudgetSimulation,
  SimulationResult,
} from '../types';

// ─── Service ─────────────────────────────────────────────────────────────────

export const budgetService = {
  async listBudgets(companyId: string) {
    const { data, error } = await supabase
      .from('budgets')
      .select('*, budget_lines(*)')
      .eq('company_id', companyId)
      .order('fiscal_year', { ascending: false });
    if (error) throw error;
    return data ?? [];
  },

  async getBudget(id: string) {
    const { data, error } = await supabase
      .from('budgets')
      .select('*, budget_lines(*)')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  async createBudget(companyId: string, input: BudgetCreateInput) {
    const { data, error } = await supabase
      .from('budgets')
      .insert({ ...input, company_id: companyId, version: 1 })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateBudget(id: string, input: BudgetUpdateInput) {
    const { data, error } = await supabase
      .from('budgets')
      .update(input)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteBudget(id: string) {
    const { error } = await supabase
      .from('budgets')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  async getBudgetLines(budgetId: string): Promise<BudgetLine[]> {
    const { data, error } = await supabase
      .from('budget_lines')
      .select('*')
      .eq('budget_id', budgetId)
      .order('type')
      .order('category');
    if (error) throw error;
    return (data ?? []) as BudgetLine[];
  },

  async upsertBudgetLines(budgetId: string, lines: BudgetLineInput[]) {
    const rows = lines.map((line) => ({
      ...line,
      budget_id: budgetId,
    }));
    const { data, error } = await supabase
      .from('budget_lines')
      .upsert(rows, { onConflict: 'id' })
      .select();
    if (error) throw error;
    return data ?? [];
  },

  async compareBudgetVersions(id1: string, id2: string): Promise<BudgetComparison> {
    const [budget1, budget2] = await Promise.all([
      this.getBudget(id1),
      this.getBudget(id2),
    ]);

    const MONTHS = [
      'month_01','month_02','month_03','month_04','month_05','month_06',
      'month_07','month_08','month_09','month_10','month_11','month_12',
    ] as const;

    const linesA: Record<string, unknown>[] = budget1?.budget_lines ?? [];
    const linesB: Record<string, unknown>[] = budget2?.budget_lines ?? [];

    const allCategories = new Set([
      ...linesA.map((l: Record<string, unknown>) => `${l.category}|${l.type}`),
      ...linesB.map((l: Record<string, unknown>) => `${l.category}|${l.type}`),
    ]);

    const comparisonLines: BudgetComparisonLine[] = Array.from(allCategories).map((key) => {
      const [category, type] = key.split('|');
      const lineA = linesA.find((l: Record<string, unknown>) => l.category === category && l.type === type) as Record<string, unknown> | undefined;
      const lineB = linesB.find((l: Record<string, unknown>) => l.category === category && l.type === type) as Record<string, unknown> | undefined;

      const aMonths = MONTHS.map((m) => (lineA ? Number(lineA[m]) || 0 : 0));
      const bMonths = MONTHS.map((m) => (lineB ? Number(lineB[m]) || 0 : 0));
      const varMonths = aMonths.map((a, i) => bMonths[i] - a);
      const varPctMonths = aMonths.map((a, i) => (a !== 0 ? ((bMonths[i] - a) / Math.abs(a)) * 100 : null));

      const aTotal = aMonths.reduce((s, v) => s + v, 0);
      const bTotal = bMonths.reduce((s, v) => s + v, 0);

      return {
        category,
        type: type as 'receipt' | 'disbursement',
        version_a_months: aMonths,
        version_b_months: bMonths,
        variance_months: varMonths,
        variance_pct_months: varPctMonths,
        version_a_total: aTotal,
        version_b_total: bTotal,
        variance_total: bTotal - aTotal,
        variance_pct_total: aTotal !== 0 ? ((bTotal - aTotal) / Math.abs(aTotal)) * 100 : null,
      };
    });

    return {
      version_a: { id: id1, name: budget1?.name ?? '', fiscal_year: budget1?.fiscal_year ?? 0 },
      version_b: { id: id2, name: budget2?.name ?? '', fiscal_year: budget2?.fiscal_year ?? 0 },
      lines: comparisonLines,
    };
  },

  async importBudget(budgetId: string, importData: BudgetImportData): Promise<BudgetLineInput[]> {
    // Call an edge function or parse server-side; for now delegate to the backend
    const { data, error } = await supabase.functions.invoke('budget-import', {
      body: { budget_id: budgetId, import_data: importData },
    });
    if (error) throw error;
    return (data ?? []) as BudgetLineInput[];
  },

  async getApprovalSteps(budgetId: string): Promise<BudgetApprovalStep[]> {
    const { data, error } = await supabase
      .from('budget_approval_steps')
      .select('*')
      .eq('budget_id', budgetId)
      .order('step', { ascending: true });

    if (error) throw error;
    return (data ?? []) as BudgetApprovalStep[];
  },

  simulateBudget(
    lines: BudgetLine[],
    params: BudgetSimulation
  ): SimulationResult {
    // Base totals from current lines
    let baseRevenues = 0;
    let baseCharges = 0;

    for (const line of lines) {
      if (line.level !== 1) continue;
      if (line.category === 'revenue') {
        baseRevenues = line.annual_total;
      } else {
        baseCharges += line.annual_total;
      }
    }

    // Apply simulation adjustments
    const occupancyFactor = params.occupancy_rate / 95; // base assumption 95%
    const adjustedRevenues = Math.round(baseRevenues * occupancyFactor * (1 + params.avg_rent_variation / 100));

    // Energy lines
    let energyBase = 0;
    let otherCharges = 0;
    for (const line of lines) {
      if (line.level !== 1) continue;
      if (line.category === 'revenue') continue;
      if (line.children) {
        for (const child of line.children) {
          if (child.code === 'OPX-03') {
            energyBase += child.annual_total;
          }
        }
      }
    }
    otherCharges = baseCharges - energyBase;
    const adjustedEnergy = Math.round(energyBase * (1 + params.energy_variation / 100));

    // Headcount impact on salaries (rough: 8.5M/person/month)
    const salaryDelta = (params.headcount - 12) * 8500000; // base 12 employees
    const adjustedCharges = otherCharges + adjustedEnergy + salaryDelta;

    const netCashFlow = adjustedRevenues - adjustedCharges;

    // Break-even: month where cumulative net > 0
    const monthlyNet = adjustedRevenues / 12 - adjustedCharges / 12;
    let breakEvenMonth: number | null = null;
    if (monthlyNet > 0) {
      breakEvenMonth = 1;
    } else if (netCashFlow > 0) {
      let cumulative = 0;
      for (let m = 1; m <= 12; m++) {
        const monthRev = (adjustedRevenues / 12) * (1 + (m - 1) * 0.005);
        const monthExp = adjustedCharges / 12;
        cumulative += monthRev - monthExp;
        if (cumulative > 0) {
          breakEvenMonth = m;
          break;
        }
      }
    }

    return {
      total_revenues: adjustedRevenues,
      total_charges: adjustedCharges,
      net_cash_flow: netCashFlow,
      break_even_month: breakEvenMonth,
    };
  },

  async submitForApproval(budgetId: string): Promise<{ success: boolean; message: string }> {
    const { error } = await supabase
      .from('budgets')
      .update({ status: 'submitted' })
      .eq('id', budgetId);

    if (error) throw error;
    return {
      success: true,
      message: 'Budget soumis pour approbation.',
    };
  },

  // ─── Distribution helpers ─────────────────────────────────────────────────

  getDistributionRules(): DistributionRule[] {
    return [
      { type: 'equal' },
      {
        type: 'weighted',
        weights: [7, 7, 8, 8, 9, 9, 7, 6, 9, 10, 10, 10],
      },
      { type: 'progressive' },
      { type: 'custom', weights: [8, 8, 8, 8, 8, 8, 8, 8, 9, 9, 9, 9] },
    ];
  },

  applyDistribution(annualAmount: number, rule: DistributionRule, growthRate?: number): number[] {
    if (rule.type === 'equal') {
      const monthly = Math.round(annualAmount / 12);
      return Array(12).fill(monthly);
    }

    if ((rule.type === 'weighted' || rule.type === 'custom') && rule.weights) {
      const totalWeight = rule.weights.reduce((s, w) => s + w, 0);
      return rule.weights.map((w) => Math.round((annualAmount * w) / totalWeight));
    }

    if (rule.type === 'progressive') {
      const rate = (growthRate ?? 5) / 100;
      const baseMonth = annualAmount / (12 + (12 * 11 * rate) / 2);
      return Array.from({ length: 12 }, (_, i) =>
        Math.round(baseMonth * (1 + rate * i))
      );
    }

    return Array(12).fill(Math.round(annualAmount / 12));
  },
};
