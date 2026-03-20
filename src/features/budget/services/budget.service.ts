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
  BudgetCategory,
} from '../types';

// ─── 23 top-level budget categories for Ivorian commercial real estate ───────

export const BUDGET_CATEGORIES_TREE: {
  category: BudgetCategory;
  label: string;
  children: { code: string; label: string; defaultMonths?: number[] }[];
}[] = [
  {
    category: 'revenue',
    label: 'REVENUS',
    children: [
      { code: 'REV-01', label: 'Loyers bureaux', defaultMonths: [18500000, 18500000, 18500000, 18500000, 18500000, 18500000, 18500000, 18500000, 18500000, 18500000, 18500000, 18500000] },
      { code: 'REV-02', label: 'Loyers commerces', defaultMonths: [12000000, 12000000, 12000000, 12000000, 12000000, 14500000, 14500000, 12000000, 12000000, 14500000, 16000000, 18000000] },
      { code: 'REV-03', label: 'Charges récupérables locataires', defaultMonths: [4200000, 4200000, 4200000, 4200000, 4200000, 4200000, 4200000, 4200000, 4200000, 4200000, 4200000, 4200000] },
      { code: 'REV-04', label: 'Parking & stockage', defaultMonths: [2800000, 2800000, 2800000, 2800000, 2800000, 2800000, 2800000, 2800000, 2800000, 2800000, 2800000, 2800000] },
      { code: 'REV-05', label: 'Revenus annexes (antennes, affichage)', defaultMonths: [1500000, 1500000, 1500000, 1500000, 1500000, 1500000, 1500000, 1500000, 1500000, 1500000, 1500000, 1500000] },
      { code: 'REV-06', label: 'Indemnités & pénalités reçues', defaultMonths: [0, 0, 500000, 0, 0, 0, 0, 0, 750000, 0, 0, 0] },
    ],
  },
  {
    category: 'opex',
    label: "CHARGES D'EXPLOITATION",
    children: [
      { code: 'OPX-01', label: 'Salaires & charges sociales', defaultMonths: [8500000, 8500000, 8500000, 8500000, 8500000, 8500000, 8500000, 8500000, 8500000, 8500000, 8500000, 8500000] },
      { code: 'OPX-02', label: 'Entretien & maintenance bâtiment', defaultMonths: [3200000, 3200000, 3200000, 3200000, 3200000, 4500000, 3200000, 3200000, 3200000, 3200000, 3200000, 5000000] },
      { code: 'OPX-03', label: 'Énergie (électricité CIE)', defaultMonths: [4800000, 4800000, 5200000, 5600000, 5600000, 5200000, 4800000, 4800000, 5200000, 5600000, 5200000, 4800000] },
      { code: 'OPX-04', label: 'Eau (SODECI)', defaultMonths: [850000, 850000, 850000, 950000, 950000, 850000, 850000, 850000, 950000, 950000, 850000, 850000] },
      { code: 'OPX-05', label: 'Sécurité & gardiennage', defaultMonths: [2400000, 2400000, 2400000, 2400000, 2400000, 2400000, 2400000, 2400000, 2400000, 2400000, 2400000, 2400000] },
      { code: 'OPX-06', label: 'Assurances', defaultMonths: [6000000, 0, 0, 0, 0, 0, 6000000, 0, 0, 0, 0, 0] },
      { code: 'OPX-07', label: 'Taxe foncière & impôts locaux', defaultMonths: [0, 0, 8500000, 0, 0, 0, 0, 0, 8500000, 0, 0, 0] },
      { code: 'OPX-08', label: 'Honoraires (gestion, juridique, audit)', defaultMonths: [1800000, 1800000, 1800000, 1800000, 1800000, 1800000, 1800000, 1800000, 1800000, 1800000, 1800000, 3500000] },
      { code: 'OPX-09', label: 'Frais de commercialisation', defaultMonths: [750000, 750000, 750000, 750000, 1500000, 750000, 750000, 750000, 1500000, 750000, 750000, 750000] },
      { code: 'OPX-10', label: 'Fournitures & consommables', defaultMonths: [450000, 450000, 450000, 450000, 450000, 450000, 450000, 450000, 450000, 450000, 450000, 450000] },
      { code: 'OPX-11', label: 'Télécommunications & IT', defaultMonths: [1200000, 1200000, 1200000, 1200000, 1200000, 1200000, 1200000, 1200000, 1200000, 1200000, 1200000, 1200000] },
      { code: 'OPX-12', label: 'Divers exploitation', defaultMonths: [600000, 600000, 600000, 600000, 600000, 600000, 600000, 600000, 600000, 600000, 600000, 600000] },
    ],
  },
  {
    category: 'financial',
    label: 'CHARGES FINANCIÈRES',
    children: [
      { code: 'FIN-01', label: 'Intérêts emprunts bancaires', defaultMonths: [3200000, 3200000, 3200000, 3200000, 3200000, 3200000, 3150000, 3150000, 3150000, 3150000, 3150000, 3150000] },
      { code: 'FIN-02', label: 'Frais bancaires & commissions', defaultMonths: [350000, 350000, 350000, 350000, 350000, 350000, 350000, 350000, 350000, 350000, 350000, 350000] },
      { code: 'FIN-03', label: 'Intérêts leasing', defaultMonths: [1800000, 1800000, 1800000, 1800000, 1800000, 1800000, 1800000, 1800000, 1800000, 1800000, 1800000, 1800000] },
    ],
  },
  {
    category: 'capex',
    label: 'CAPEX',
    children: [
      { code: 'CPX-01', label: 'Investissements immobiliers & équipements', defaultMonths: [0, 0, 15000000, 0, 0, 25000000, 0, 0, 0, 10000000, 0, 0] },
    ],
  },
  {
    category: 'loan_repayment',
    label: 'REMBOURSEMENTS EMPRUNTS',
    children: [
      { code: 'RMB-01', label: 'Remboursement capital emprunts', defaultMonths: [4500000, 4500000, 4500000, 4500000, 4500000, 4500000, 4500000, 4500000, 4500000, 4500000, 4500000, 4500000] },
    ],
  },
];

// ─── Mock N-1 data (previous year) ──────────────────────────────────────────

const MOCK_N1_DATA: Record<string, number> = {
  'REV-01': 210000000,
  'REV-02': 156000000,
  'REV-03': 48000000,
  'REV-04': 31200000,
  'REV-05': 16800000,
  'REV-06': 2500000,
  'OPX-01': 96000000,
  'OPX-02': 42000000,
  'OPX-03': 58000000,
  'OPX-04': 10200000,
  'OPX-05': 27600000,
  'OPX-06': 11000000,
  'OPX-07': 16000000,
  'OPX-08': 23000000,
  'OPX-09': 10500000,
  'OPX-10': 5100000,
  'OPX-11': 13800000,
  'OPX-12': 6800000,
  'FIN-01': 39600000,
  'FIN-02': 4000000,
  'FIN-03': 21600000,
  'CPX-01': 45000000,
  'RMB-01': 52000000,
};

// ─── Generate mock budget lines ─────────────────────────────────────────────

let lineIdCounter = 1;

function generateMockBudgetLines(budgetId: string): BudgetLine[] {
  const lines: BudgetLine[] = [];

  for (const group of BUDGET_CATEGORIES_TREE) {
    const parentId = `line-${lineIdCounter++}`;
    const parentMonths = Array(12).fill(0);

    const childLines: BudgetLine[] = [];

    for (const child of group.children) {
      const childId = `line-${lineIdCounter++}`;
      const months = child.defaultMonths ?? Array(12).fill(0);
      const annualTotal = months.reduce((s, v) => s + v, 0);
      const budgetN1 = MOCK_N1_DATA[child.code] ?? 0;
      const varianceN1 = budgetN1 > 0 ? Math.round(((annualTotal - budgetN1) / budgetN1) * 10000) / 100 : 0;

      months.forEach((v, i) => { parentMonths[i] += v; });

      childLines.push({
        id: childId,
        budget_id: budgetId,
        parent_id: parentId,
        level: 2,
        code: child.code,
        label: child.label,
        category: group.category,
        hypothesis: '',
        budget_n1: budgetN1,
        variance_n1: varianceN1,
        annual_total: annualTotal,
        months,
        distribution_rule: 'manual',
        collapsed: false,
      });
    }

    const parentTotal = parentMonths.reduce((s, v) => s + v, 0);
    const parentN1 = childLines.reduce((s, c) => s + (c.budget_n1 ?? 0), 0);
    const parentVariance = parentN1 > 0 ? Math.round(((parentTotal - parentN1) / parentN1) * 10000) / 100 : 0;

    lines.push({
      id: parentId,
      budget_id: budgetId,
      parent_id: null,
      level: 1,
      code: group.category.toUpperCase(),
      label: group.label,
      category: group.category,
      hypothesis: '',
      budget_n1: parentN1,
      variance_n1: parentVariance,
      annual_total: parentTotal,
      months: parentMonths,
      distribution_rule: 'manual',
      collapsed: false,
      children: childLines,
    });
  }

  return lines;
}

// ─── Mock approval workflow ─────────────────────────────────────────────────

function getMockApprovalSteps(): BudgetApprovalStep[] {
  return [
    {
      step: 1,
      role: 'Saisie',
      actor_name: 'Kouamé Adjoua (Trésorier)',
      status: 'approved',
      comment: 'Saisie complète, lignes vérifiées',
      date: '2026-01-15',
      deadline_days: 5,
    },
    {
      step: 2,
      role: 'Revue DAF',
      actor_name: 'N\'Guessan Koffi (DAF)',
      status: 'approved',
      comment: 'Hypothèses cohérentes avec le plan stratégique',
      date: '2026-01-18',
      deadline_days: 3,
    },
    {
      step: 3,
      role: 'Validation DGA',
      actor_name: 'Bamba Moussa (DGA)',
      status: 'pending',
      deadline_days: 5,
    },
    {
      step: 4,
      role: 'Validation DG',
      actor_name: 'Traoré Ibrahim (DG)',
      status: 'pending',
      deadline_days: 3,
    },
    {
      step: 5,
      role: 'Activation',
      actor_name: 'Système',
      status: 'pending',
      deadline_days: 1,
    },
  ];
}

// ─── Mock companies and users ────────────────────────────────────────────────

export const MOCK_COMPANIES = [
  { id: 'comp-001', name: 'Abidjan Business Center SARL' },
  { id: 'comp-002', name: 'Plateau Commercial SA' },
  { id: 'comp-003', name: 'Cocody Résidences SCI' },
];

export const MOCK_USERS = [
  { id: 'user-001', name: 'Kouamé Adjoua' },
  { id: 'user-002', name: 'N\'Guessan Koffi' },
  { id: 'user-003', name: 'Bamba Moussa' },
  { id: 'user-004', name: 'Traoré Ibrahim' },
  { id: 'user-005', name: 'Diallo Fatou' },
];

export const MOCK_COST_CENTERS = [
  'Tour A — Bureaux',
  'Tour B — Commerces',
  'Parking sous-sol',
  'Espaces communs',
  'Administration',
];

export const MOCK_BUDGETS_LIST = [
  { id: 'budget-2025', name: 'Budget 2025 — V2 Validé', fiscal_year: 2025 },
  { id: 'budget-2024', name: 'Budget 2024 — V3 Final', fiscal_year: 2024 },
];

export const MOCK_COUNTERPARTIES = [
  { id: 'cp-001', name: 'CIE (Compagnie Ivoirienne d\'Électricité)' },
  { id: 'cp-002', name: 'SODECI' },
  { id: 'cp-003', name: 'Ivoire Sécurité SA' },
  { id: 'cp-004', name: 'NSIA Assurances' },
  { id: 'cp-005', name: 'SGBCI' },
  { id: 'cp-006', name: 'Ecobank CI' },
  { id: 'cp-007', name: 'Cabinet Diallo & Associés' },
  { id: 'cp-008', name: 'Groupe Bolloré' },
];

// ─── Service ─────────────────────────────────────────────────────────────────

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

  // ─── New methods ──────────────────────────────────────────────────────────

  getMockBudgetLines(budgetId: string): BudgetLine[] {
    lineIdCounter = 1;
    return generateMockBudgetLines(budgetId);
  },

  getMockApprovalSteps(): BudgetApprovalStep[] {
    return getMockApprovalSteps();
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
      // Sum children to find energy
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
      // Progressive break-even
      let cumulative = 0;
      for (let m = 1; m <= 12; m++) {
        // Revenues grow slightly each month
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

  async submitForApproval(_budgetId: string): Promise<{ success: boolean; message: string }> {
    // Mock: simulate API call
    return {
      success: true,
      message: 'Budget soumis pour approbation. Le DAF sera notifié.',
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
