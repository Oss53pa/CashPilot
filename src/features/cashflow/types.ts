import { z } from 'zod';
import type { CashFlow } from '@/types/database';

export const receiptCategories = [
  'sales',
  'services',
  'interest',
  'subsidies',
  'other_receipts',
] as const;

export const disbursementCategories = [
  'salaries',
  'suppliers',
  'rent',
  'taxes',
  'utilities',
  'insurance',
  'maintenance',
  'other_expenses',
] as const;

export const cashFlowSchema = z.object({
  type: z.enum(['receipt', 'disbursement']),
  category: z.string().min(1, 'Category is required'),
  subcategory: z.string().optional().nullable(),
  amount: z.coerce.number().positive('Amount must be positive'),
  currency: z.string().min(1, 'Currency is required'),
  value_date: z.string().min(1, 'Value date is required'),
  operation_date: z.string().min(1, 'Operation date is required'),
  reference: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  counterparty_id: z.string().optional().nullable(),
  bank_account_id: z.string().min(1, 'Bank account is required'),
  status: z.enum(['pending', 'validated', 'reconciled', 'cancelled']).default('pending'),
});

export type CashFlowFormData = z.infer<typeof cashFlowSchema>;

export interface MonthlySummary {
  total_receipts: number;
  total_disbursements: number;
  net_flow: number;
  count_pending: number;
  count_validated: number;
  count_reconciled: number;
}

export type { CashFlow };
