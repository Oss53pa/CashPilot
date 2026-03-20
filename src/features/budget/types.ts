import { z } from 'zod';

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

// --- Import ---
export interface BudgetImportData {
  file: File;
  format: 'excel' | 'csv';
  mapping: Record<string, string>; // imported column -> budget field
}

// --- Distribution ---
export interface DistributionRule {
  type: 'equal' | 'weighted' | 'progressive' | 'custom';
  weights?: number[];
}

// --- Comparison ---
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
