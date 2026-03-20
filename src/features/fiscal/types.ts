import { z } from 'zod';
import type { TaxObligation, SecurityDeposit } from '@/types/database';

export const taxObligationSchema = z.object({
  type: z.enum(['vat', 'corporate_tax', 'payroll_tax', 'withholding', 'customs', 'other']),
  period: z.string().min(1, 'Period is required'),
  due_date: z.string().min(1, 'Due date is required'),
  amount: z.coerce.number().positive('Amount must be positive'),
  currency: z.string().min(1, 'Currency is required'),
  status: z.enum(['upcoming', 'paid', 'overdue', 'contested']).default('upcoming'),
  paid_date: z.string().optional().nullable(),
  reference: z.string().optional().nullable(),
});

export const securityDepositSchema = z.object({
  type: z.enum(['rental', 'customs', 'utility', 'other']),
  amount: z.coerce.number().positive('Amount must be positive'),
  currency: z.string().min(1, 'Currency is required'),
  institution: z.string().min(1, 'Institution is required'),
  deposit_date: z.string().min(1, 'Deposit date is required'),
  release_date: z.string().optional().nullable(),
  status: z.enum(['active', 'released', 'forfeited']).default('active'),
  reference: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export type TaxObligationFormData = z.infer<typeof taxObligationSchema>;
export type SecurityDepositFormData = z.infer<typeof securityDepositSchema>;

export type { TaxObligation, SecurityDeposit };

// VAT Flow
export interface VATFlow {
  id: string;
  period: string;
  vat_collected: number;
  vat_deductible: number;
  vat_due: number;
  payment_date: string | null;
  status: 'pending' | 'declared' | 'paid' | 'overdue';
}

// Partial Payment
export interface PartialPayment {
  id: string;
  obligation_id: string;
  amount_paid: number;
  payment_date: string;
  remaining: number;
  imputation_rule: 'fifo' | 'lifo' | 'prorata' | 'manual';
}

// Charge Regularization
export interface ChargeRegularization {
  id: string;
  fiscal_year: number;
  actual_charges: number;
  called_provisions: number;
  balance: number;
  status: 'pending' | 'regularized' | 'disputed';
}
