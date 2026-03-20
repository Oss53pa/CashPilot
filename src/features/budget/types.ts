import { z } from 'zod';

// ─── Budget Header — Section A ───────────────────────────────────────────────

export const BUDGET_STATUS_OPTIONS = ['draft', 'in_review', 'validated', 'archived'] as const;
export const BUDGET_TYPE_OPTIONS = ['annual_fixed', 'rolling', 'project'] as const;
export const BUDGET_SCOPE_OPTIONS = ['company', 'consolidated'] as const;
export const BUDGET_CURRENCY_OPTIONS = ['XOF', 'XAF', 'EUR', 'USD'] as const;
export const BUDGET_CATEGORY_OPTIONS = ['revenue', 'opex', 'financial', 'capex', 'loan_repayment'] as const;
export const DISTRIBUTION_RULE_OPTIONS = ['equal', 'seasonal', 'progressive', 'manual'] as const;
export const ALLOCATION_KEY_OPTIONS = ['surface', 'rent_prorata', 'manual', 'auto'] as const;
export const ENTRY_MODE_OPTIONS = ['manual', 'import', 'duplicate', 'rolling'] as const;
export const COMPARISON_VIEW_OPTIONS = ['simple', 'n_vs_n1', 'budget_vs_actual'] as const;

export type BudgetStatusType = typeof BUDGET_STATUS_OPTIONS[number];
export type BudgetType = typeof BUDGET_TYPE_OPTIONS[number];
export type BudgetScope = typeof BUDGET_SCOPE_OPTIONS[number];
export type BudgetCurrency = typeof BUDGET_CURRENCY_OPTIONS[number];
export type BudgetCategory = typeof BUDGET_CATEGORY_OPTIONS[number];
export type DistributionRuleType = typeof DISTRIBUTION_RULE_OPTIONS[number];
export type AllocationKey = typeof ALLOCATION_KEY_OPTIONS[number];
export type EntryMode = typeof ENTRY_MODE_OPTIONS[number];
export type ComparisonView = typeof COMPARISON_VIEW_OPTIONS[number];

export interface BudgetHeader {
  id?: string;
  tenant_id: string;
  company_id: string;
  name: string;
  fiscal_year: number;
  start_date: string;
  end_date: string;
  currency: BudgetCurrency;
  version: string;
  status: BudgetStatusType;
  budget_type: BudgetType;
  scope: BudgetScope;
  responsible_id: string;
  notes: string;
}

export const budgetHeaderSchema = z.object({
  name: z.string().min(1, 'Le nom est obligatoire').max(150, 'Maximum 150 caractères'),
  company_id: z.string().min(1, 'La société est obligatoire'),
  fiscal_year: z.number().int().min(2024).max(2028),
  start_date: z.string().min(1, 'La date de début est obligatoire'),
  end_date: z.string(),
  currency: z.enum(BUDGET_CURRENCY_OPTIONS).default('XOF'),
  version: z.string().default('V1'),
  status: z.enum(BUDGET_STATUS_OPTIONS).default('draft'),
  budget_type: z.enum(BUDGET_TYPE_OPTIONS).default('annual_fixed'),
  scope: z.enum(BUDGET_SCOPE_OPTIONS).default('company'),
  responsible_id: z.string().min(1, 'Le responsable est obligatoire'),
  notes: z.string().max(1000, 'Maximum 1000 caractères').default(''),
});

export type BudgetHeaderInput = z.infer<typeof budgetHeaderSchema>;

// ─── Budget Line — Section C (hierarchical 3-level tree) ─────────────────────

export interface BudgetLine {
  id: string;
  budget_id: string;
  parent_id: string | null;
  level: 1 | 2 | 3;
  code: string;
  label: string;
  category: BudgetCategory;
  counterparty_id?: string;
  cost_center?: string;
  hypothesis: string;
  budget_n1?: number;
  variance_n1?: number;
  annual_total: number;
  months: number[];
  distribution_rule: DistributionRuleType;
  collapsed?: boolean;
  children?: BudgetLine[];
}

// ─── Cost Center Config — Section C header ───────────────────────────────────

export interface CostCenterConfig {
  enabled: boolean;
  centers: string[];
  allocation_key: AllocationKey;
}

// ─── What-If Simulation — Section D ──────────────────────────────────────────

export interface BudgetSimulation {
  occupancy_rate: number;
  avg_rent_variation: number;
  energy_variation: number;
  headcount: number;
}

export interface SimulationResult {
  total_revenues: number;
  total_charges: number;
  net_cash_flow: number;
  break_even_month: number | null;
}

// ─── Approval Workflow — Section F ───────────────────────────────────────────

export const APPROVAL_STATUS_OPTIONS = ['pending', 'approved', 'rejected', 'skipped'] as const;
export type ApprovalStatus = typeof APPROVAL_STATUS_OPTIONS[number];

export interface BudgetApprovalStep {
  step: number;
  role: string;
  actor_name: string;
  status: ApprovalStatus;
  comment?: string;
  date?: string;
  deadline_days: number;
}

// ─── Import & Distribution (kept for backward compat) ────────────────────────

export interface BudgetImportData {
  file: File;
  format: 'excel' | 'csv';
  mapping: Record<string, string>;
}

export interface DistributionRule {
  type: 'equal' | 'weighted' | 'progressive' | 'custom';
  weights?: number[];
}

// ─── Comparison ──────────────────────────────────────────────────────────────

export interface BudgetComparisonLine {
  category: string;
  type: 'receipt' | 'disbursement';
  version_a_months: number[];
  version_b_months: number[];
  variance_months: number[];
  variance_pct_months: (number | null)[];
  version_a_total: number;
  version_b_total: number;
  variance_total: number;
  variance_pct_total: number | null;
}

export interface BudgetComparison {
  version_a: { id: string; name: string; fiscal_year: number };
  version_b: { id: string; name: string; fiscal_year: number };
  lines: BudgetComparisonLine[];
}

// ─── Full Budget Form State ──────────────────────────────────────────────────

export interface BudgetFormState {
  header: BudgetHeaderInput;
  entry_mode: EntryMode;
  rolling_horizon?: 12 | 18 | 24;
  duplicate_source_id?: string;
  duplicate_revision_pct?: Record<BudgetCategory, number>;
  lines: BudgetLine[];
  cost_center_config: CostCenterConfig;
  simulation: BudgetSimulation;
  comparison_view: ComparisonView;
  approval_steps: BudgetApprovalStep[];
}

// ─── Legacy schemas (kept for backward compat) ──────────────────────────────

export const budgetCreateSchema = z.object({
  name: z.string().min(1, 'Budget name is required').max(100),
  fiscal_year: z.number().int().min(2000).max(2100),
  status: z.enum(['draft', 'submitted', 'approved', 'archived']).default('draft'),
});

export const budgetUpdateSchema = budgetCreateSchema.partial();

export type BudgetCreateInput = z.infer<typeof budgetCreateSchema>;
export type BudgetUpdateInput = z.infer<typeof budgetUpdateSchema>;

export const budgetLineSchema = z.object({
  id: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  subcategory: z.string().nullable().default(null),
  type: z.enum(['receipt', 'disbursement']),
  month_01: z.number().default(0),
  month_02: z.number().default(0),
  month_03: z.number().default(0),
  month_04: z.number().default(0),
  month_05: z.number().default(0),
  month_06: z.number().default(0),
  month_07: z.number().default(0),
  month_08: z.number().default(0),
  month_09: z.number().default(0),
  month_10: z.number().default(0),
  month_11: z.number().default(0),
  month_12: z.number().default(0),
});

export const budgetLinesSchema = z.array(budgetLineSchema);

export type BudgetLineInput = z.infer<typeof budgetLineSchema>;
