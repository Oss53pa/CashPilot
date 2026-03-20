import { BankAccount } from '@/types/database';
import { z } from 'zod';

export const cashRegisterSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['cash', 'mobile_money']),
  currency: z.string().min(1),
  location: z.string().optional().nullable(),
  operator: z.string().optional().nullable(),
  phone_number: z.string().optional().nullable(),
  initial_balance: z.coerce.number(),
  is_active: z.boolean().default(true),
});

export type CashRegisterFormData = z.infer<typeof cashRegisterSchema>;

export type CashRegister = BankAccount;

// Cash Count
export interface CashCount {
  id: string;
  register_id: string;
  count_date: string;
  theoretical_balance: number;
  physical_balance: number;
  variance: number;
  counted_by: string;
  validated_by: string | null;
  status: 'pending' | 'validated' | 'discrepancy';
  notes: string | null;
}

// Cash Withdrawal Request
export interface CashWithdrawalRequest {
  id: string;
  register_id: string;
  amount: number;
  reason: string;
  requested_by: string;
  approved_by: string | null;
  approval_status: 'pending' | 'approved' | 'rejected';
  justification_due: string;
  justification_received: boolean;
}
