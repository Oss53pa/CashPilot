import { z } from 'zod';
import type { CapexOperation } from '@/types/database';

export const capexOperationSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional().nullable(),
  category: z.enum(['equipment', 'vehicle', 'building', 'it', 'other']),
  budget_amount: z.coerce.number().positive('Budget must be positive'),
  committed_amount: z.coerce.number().min(0),
  spent_amount: z.coerce.number().min(0),
  currency: z.string().min(1, 'Currency is required'),
  status: z.enum(['planned', 'approved', 'in_progress', 'completed', 'cancelled']).default('planned'),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().optional().nullable(),
});

export type CapexOperationFormData = z.infer<typeof capexOperationSchema>;

export interface CapexDashboard {
  total_budget: number;
  total_committed: number;
  total_spent: number;
  completion_rate: number;
  by_category: { category: string; budget: number; spent: number }[];
}

export type { CapexOperation };

// --- Payment Schedule ---

export type PaymentLabel = 'advance' | 'progress_1' | 'progress_2' | 'final' | 'retention';

export type PaymentStatus = 'scheduled' | 'invoiced' | 'paid' | 'overdue';

export interface CapexPaymentSchedule {
  id: string;
  capex_id: string;
  label: PaymentLabel;
  amount: number;
  due_date: string;
  actual_date: string | null;
  status: PaymentStatus;
  invoice_reference: string | null;
}

// --- Contractor ---

export interface CapexContractor {
  name: string;
  contract_reference: string;
  contract_amount_ht: number;
  vat_rate: number;
  amount_ttc: number;
  retention_rate: number;
  retention_amount: number;
  retention_release_date: string;
}

// --- Extended operation detail ---

export interface CapexOperationDetail {
  id: string;
  code: string;
  name: string;
  description: string | null;
  category: string;
  company_id: string;
  company_name?: string;
  budget_amount: number;
  committed_amount: number;
  spent_amount: number;
  invoiced_amount: number;
  retention_amount: number;
  slippage_days: number;
  currency: string;
  status: string;
  start_date: string;
  end_date: string | null;
  contractor: CapexContractor;
  payment_schedule: CapexPaymentSchedule[];
}

// --- Slippage Alert ---

export interface SlippageAlert {
  capex_id: string;
  capex_code: string;
  capex_name: string;
  payment_id: string;
  payment_label: PaymentLabel;
  due_date: string;
  days_overdue: number;
  amount: number;
  currency: string;
}
