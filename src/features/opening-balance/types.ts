import { z } from 'zod';

export const openingBalanceEntrySchema = z.object({
  account_id: z.string().uuid('Invalid account ID'),
  balance: z.number(),
  as_of_date: z.string().min(1, 'Date is required'),
});

export const openingBalancesSchema = z.object({
  fiscal_year: z.number().int().min(2000).max(2100),
  as_of_date: z.string().min(1, 'Date is required'),
  entries: z.array(openingBalanceEntrySchema).min(1, 'At least one balance is required'),
});

export type OpeningBalanceEntry = z.infer<typeof openingBalanceEntrySchema>;
export type OpeningBalancesInput = z.infer<typeof openingBalancesSchema>;

// --- Prior Receivables ---
export interface PriorReceivable {
  id: string;
  counterparty: string;
  nature: 'loyer' | 'charges' | 'pas_de_porte' | 'autre';
  period: string;
  gross_amount: number;
  recoverable_amount: number;
  status: 'normal' | 'late' | 'disputed' | 'irrecoverable';
  expected_date: string;
  probability_pct: number;
  notes: string;
}

// --- Prior Payables ---
export interface PriorPayable {
  id: string;
  counterparty: string;
  nature: 'maintenance' | 'energy' | 'personnel' | 'capex' | 'fiscal' | 'other';
  amount_due: number;
  original_due_date: string;
  planned_payment_date: string;
  status: 'to_pay' | 'late' | 'disputed';
  disbursement_account: string;
}
