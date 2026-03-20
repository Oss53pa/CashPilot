import { z } from 'zod';

export const debtContractSchema = z.object({
  lender: z.string().min(1, 'Required'),
  contract_reference: z.string().min(1, 'Required'),
  type: z.enum(['term_loan', 'credit_facility', 'bond', 'leasing', 'syndicated_loan', 'other']),
  principal_amount: z.coerce.number().min(0, 'Must be positive'),
  outstanding_amount: z.coerce.number().min(0, 'Must be positive'),
  interest_rate: z.coerce.number().min(0).max(100),
  currency: z.string().min(1, 'Required'),
  start_date: z.string().min(1, 'Required'),
  maturity_date: z.string().min(1, 'Required'),
  payment_frequency: z.enum(['monthly', 'quarterly', 'semi_annual', 'annual', 'bullet']),
  covenants: z.string().optional().nullable(),
});

export type DebtContractFormData = z.infer<typeof debtContractSchema>;

export interface DebtContract {
  id: string;
  company_id: string;
  lender: string;
  contract_reference: string;
  type: 'term_loan' | 'credit_facility' | 'bond' | 'leasing' | 'syndicated_loan' | 'other';
  principal_amount: number;
  outstanding_amount: number;
  interest_rate: number;
  currency: string;
  start_date: string;
  maturity_date: string;
  payment_frequency: 'monthly' | 'quarterly' | 'semi_annual' | 'annual' | 'bullet';
  covenants: string | null;
  created_at: string;
  updated_at: string;
}

export interface DebtSummary {
  total_debt: number;
  total_outstanding: number;
  weighted_avg_rate: number;
  next_payment_due: string | null;
}

export interface RepaymentScheduleItem {
  date: string;
  principal_portion: number;
  interest_portion: number;
  total: number;
  remaining_balance: number;
}

// --- Financing Plan ---
export interface FinancingPlanYear {
  year: number;
  needs: {
    capex: number;
    loan_repayments: number;
    working_capital: number;
    total: number;
  };
  resources: {
    operating_cash_flow: number;
    available_cash: number;
    maturing_investments: number;
    credit_lines: number;
    total: number;
  };
  balance: number;
}

export interface FinancingPlan {
  years: FinancingPlanYear[];
}
