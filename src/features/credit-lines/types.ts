import { z } from 'zod';

export const creditLineSchema = z.object({
  bank_name: z.string().min(1, 'Required'),
  type: z.enum(['overdraft', 'revolving', 'guarantee', 'letter_of_credit']),
  limit_amount: z.coerce.number().min(0, 'Must be positive'),
  used_amount: z.coerce.number().min(0, 'Must be positive'),
  currency: z.string().min(1, 'Required'),
  interest_rate: z.coerce.number().min(0).max(100),
  start_date: z.string().min(1, 'Required'),
  expiry_date: z.string().min(1, 'Required'),
  covenants: z.string().optional().nullable(),
});

export type CreditLineFormData = z.infer<typeof creditLineSchema>;

export interface CreditLine {
  id: string;
  company_id: string;
  bank_name: string;
  type: 'overdraft' | 'revolving' | 'guarantee' | 'letter_of_credit';
  limit_amount: number;
  used_amount: number;
  currency: string;
  interest_rate: number;
  start_date: string;
  expiry_date: string;
  covenants: string | null;
  created_at: string;
  updated_at: string;
}
