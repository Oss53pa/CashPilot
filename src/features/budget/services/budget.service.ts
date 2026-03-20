import { supabase } from '@/config/supabase';
import type {
  BudgetCreateInput,
  BudgetUpdateInput,
  BudgetLineInput,
  BudgetImportData,
  DistributionRule,
  BudgetComparison,
  BudgetComparisonLine,
} from '../types';

export const budgetService = {
  async listBudgets(companyId: string) {
    const { data, error } = await supabase
      .from('budgets')
      .select('*, budget_lines(*)')
      .eq('company_id', companyId)
      .order('fiscal_year', { ascending: false });
    if (error) throw error;
    return data;
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

  async getBudgetLines(budgetId: string) {
    const { data, error } = await supabase
      .from('budget_lines')
      .select('*')
      .eq('budget_id', budgetId)
      .order('type')
      .order('category');
    if (error) throw error;
    return data;
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
    return data;
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

  async importBudget(_budgetId: string, _importData: BudgetImportData): Promise<BudgetLineInput[]> {
    // Mock: return sample imported lines
    return [
      {
        category: 'Ventes marchandises',
        subcategory: null,
        type: 'receipt',
        month_01: 12000000, month_02: 13500000, month_03: 14000000, month_04: 11500000,
        month_05: 12800000, month_06: 13200000, month_07: 10500000, month_08: 9800000,
        month_09: 14200000, month_10: 15000000, month_11: 16500000, month_12: 18000000,
      },
      {
        category: 'Loyers',
        subcategory: null,
        type: 'disbursement',
        month_01: 2500000, month_02: 2500000, month_03: 2500000, month_04: 2500000,
        month_05: 2500000, month_06: 2500000, month_07: 2500000, month_08: 2500000,
        month_09: 2500000, month_10: 2500000, month_11: 2500000, month_12: 2500000,
      },
    ];
  },

  getDistributionRules(): DistributionRule[] {
    return [
      { type: 'equal' },
      {
        type: 'weighted',
        weights: [7, 7, 8, 8, 9, 9, 7, 6, 9, 10, 10, 10], // seasonal with Dec peak
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
