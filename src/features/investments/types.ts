import { z } from 'zod';

export const investmentSchema = z.object({
  name: z.string().min(1, 'Required'),
  type: z.enum(['term_deposit', 'treasury_bill', 'bond', 'money_market', 'certificate_of_deposit', 'other']),
  institution: z.string().min(1, 'Required'),
  amount: z.coerce.number().min(0, 'Must be positive'),
  currency: z.string().min(1, 'Required'),
  interest_rate: z.coerce.number().min(0).max(100),
  start_date: z.string().min(1, 'Required'),
  maturity_date: z.string().min(1, 'Required'),
  auto_renew: z.boolean().default(false),
});

export type InvestmentFormData = z.infer<typeof investmentSchema>;

export interface Investment {
  id: string;
  company_id: string;
  name: string;
  type: 'term_deposit' | 'treasury_bill' | 'bond' | 'money_market' | 'certificate_of_deposit' | 'other';
  institution: string;
  amount: number;
  currency: string;
  interest_rate: number;
  start_date: string;
  maturity_date: string;
  auto_renew: boolean;
  created_at: string;
  updated_at: string;
}

export interface PortfolioSummary {
  total_invested: number;
  weighted_avg_rate: number;
  maturing_within_30_days: number;
  by_type: { name: string; value: number }[];
}
