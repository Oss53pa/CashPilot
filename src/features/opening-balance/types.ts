import { z } from 'zod';

// Legacy schema kept for backward compatibility
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

// ─────────────────────────────────────────────────────────────────────────────
// Section A - En-tête
// ─────────────────────────────────────────────────────────────────────────────
export interface OpeningBalanceHeader {
  company_id: string;
  opening_date: string;
  fiscal_year: number;
  opening_type: 'cashpilot_start' | 'fiscal_year_start' | 'post_closing';
  certified_by?: string;
  notes?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Section B - Soldes bancaires d'ouverture (par compte)
// ─────────────────────────────────────────────────────────────────────────────
export interface BankOpeningBalance {
  account_id: string;
  accounting_balance: number;
  bank_balance: number;
  variance: number; // computed: bank_balance - accounting_balance
  variance_reason?: string; // required if variance != 0
  checks_issued_pending: number;
  checks_received_pending: number;
  transfers_out_pending: number;
  transfers_in_pending: number;
  available_balance: number; // computed
  statement_date: string;
  statement_file?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Section C - Solde fiscal d'ouverture
// ─────────────────────────────────────────────────────────────────────────────
export interface TaxOpeningBalance {
  vat_collected_undeclared: number;
  vat_deductible_pending: number;
  corporate_tax_prepaid: number;
  corporate_tax_remaining: number;
  other_tax_liabilities: number;
  tax_receivables: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Section D - Placements actifs
// ─────────────────────────────────────────────────────────────────────────────
export interface OpeningInvestment {
  id: string;
  instrument: 'term_deposit' | 'treasury_bill' | 'money_market' | 'bond' | 'other';
  institution: string;
  amount: number;
  rate: number;
  start_date: string;
  maturity_date: string;
  accrued_interest: number; // computed
  repatriation_account_id: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Section E - Emprunts actifs
// ─────────────────────────────────────────────────────────────────────────────
export interface OpeningLoan {
  id: string;
  reference: string;
  lender: string;
  initial_capital: number;
  outstanding_capital: number;
  next_payment_date: string;
  next_payment_amount: number;
  amortization_file?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Section F - Créances antérieures (enhanced)
// ─────────────────────────────────────────────────────────────────────────────
export interface PriorReceivable {
  id: string;
  debtor_id?: string;
  debtor_name: string;
  nature: 'rent' | 'charges' | 'deposit' | 'regularization' | 'variable_rent' | 'other';
  periods: string[]; // month references
  invoice_ref?: string;
  amount_ht: number;
  vat_rate: number; // default 18
  amount_ttc: number; // computed: amount_ht * (1 + vat_rate/100)
  partial_payments: number;
  balance_ttc: number; // computed: amount_ttc - partial_payments
  late_interest: number;
  late_interest_rate?: number;
  recoverable_amount: number;
  probability_pct: number; // 0-100
  status: 'normal' | 'late' | 'disputed' | 'litigation' | 'irrecoverable';
  original_due_date: string;
  expected_date: string;
  has_installment_plan: boolean;
  installment_schedule?: { date: string; amount: number }[];
  prescription_date: string; // computed: due_date + 5 years OHADA
  reception_account_id?: string;
  linked_dispute?: boolean;
  invoice_file?: string;
  notes?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Section G - Dettes antérieures (enhanced)
// ─────────────────────────────────────────────────────────────────────────────
export interface PriorPayable {
  id: string;
  creditor_id?: string;
  creditor_name: string;
  nature: 'supplier_invoice' | 'salary' | 'capex' | 'tax' | 'tenant_refund' | 'deposit_return' | 'loan_repayment' | 'interest' | 'other';
  invoice_ref?: string;
  amount_ht: number;
  vat_deductible?: number;
  amount_ttc: number; // computed
  payments_made: number;
  balance_remaining: number; // computed: amount_ttc - payments_made
  has_retention: boolean;
  retention_amount?: number;
  original_due_date: string;
  current_delay: number; // computed days
  late_penalties: number;
  planned_payment_date: string;
  priority: 'urgent' | 'normal' | 'deferrable';
  disbursement_account_id: string;
  purchase_order_file?: string;
  invoice_file?: string;
  notes?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Section H - Workflow d'approbation
// ─────────────────────────────────────────────────────────────────────────────
export type ApprovalRole = 'tresorier' | 'daf' | 'dg';

export interface ApprovalStep {
  role: ApprovalRole;
  label: string;
  status: 'pending' | 'approved' | 'rejected';
  approved_by?: string;
  approved_at?: string;
  comment?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Full Opening Balance Data
// ─────────────────────────────────────────────────────────────────────────────
export interface FullOpeningBalanceData {
  header: OpeningBalanceHeader;
  bank_balances: BankOpeningBalance[];
  tax_balance: TaxOpeningBalance;
  investments: OpeningInvestment[];
  loans: OpeningLoan[];
  receivables: PriorReceivable[];
  payables: PriorPayable[];
  approval_steps: ApprovalStep[];
}
