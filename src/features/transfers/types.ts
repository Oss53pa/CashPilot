import { z } from 'zod';

export const transferFormSchema = z.object({
  from_account_id: z.string().min(1, 'Required'),
  to_account_id: z.string().min(1, 'Required'),
  amount: z.coerce.number().min(0.01, 'Must be positive'),
  currency: z.string().min(1, 'Required'),
  transfer_type: z.enum(['internal', 'intercompany', 'cash_to_bank', 'bank_to_cash', 'mobile_money']),
  transfer_date: z.string().min(1, 'Required'),
  value_date: z.string().optional().nullable(),
  reference: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  to_company_id: z.string().optional().nullable(),
  interest_rate: z.coerce.number().min(0).max(100).optional().nullable(),
  convention_reference: z.string().optional().nullable(),
});

export type TransferFormData = z.infer<typeof transferFormSchema>;

export type TransferType = 'internal' | 'intercompany' | 'cash_to_bank' | 'bank_to_cash' | 'mobile_money';

export type TransferStatus =
  | 'draft'
  | 'pending_validation'
  | 'validated'
  | 'in_transit'
  | 'completed'
  | 'cancelled';

export interface Transfer {
  id: string;
  tenant_id: string;
  company_id: string;
  from_account_id: string;
  to_account_id: string;
  amount: number;
  currency: string;
  transfer_type: TransferType;
  status: TransferStatus;
  initiated_by: string;
  validated_by: string | null;
  validation_date: string | null;
  transfer_date: string;
  value_date: string | null;
  reference: string | null;
  description: string | null;
  from_company_id: string | null;
  to_company_id: string | null;
  interest_rate: number | null;
  convention_reference: string | null;
  created_at: string;
  updated_at: string;
}

export interface TransitAccount {
  total_in_transit: number;
  count_in_transit: number;
  oldest_transfer_date: string | null;
  currency: string;
}

export interface TransferFilters {
  transfer_type?: TransferType;
  status?: TransferStatus;
  date_from?: string;
  date_to?: string;
}

export interface TransferSummary {
  total_transfers: number;
  in_transit_count: number;
  in_transit_amount: number;
  pending_validation_count: number;
  completed_today: number;
}

export interface IntercompanyFlow {
  from_company_id: string;
  to_company_id: string;
  total_amount: number;
  currency: string;
  transfer_count: number;
}
