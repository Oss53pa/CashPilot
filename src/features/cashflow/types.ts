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

// ── Receivable Nature Labels ──
export const receivableNatures = [
  'fixed_rent',
  'charges',
  'charge_regularization',
  'variable_rent',
  'entry_fee',
  'credit_recovery',
  'expense_refund',
  'damages',
  'other',
] as const;

export const receivableNatureLabels: Record<typeof receivableNatures[number], string> = {
  fixed_rent: 'Loyer fixe',
  charges: 'Charges',
  charge_regularization: 'Régularisation de charges',
  variable_rent: 'Loyer variable',
  entry_fee: "Droit d'entrée",
  credit_recovery: 'Recouvrement de créance',
  expense_refund: 'Remboursement de frais',
  damages: 'Dommages et intérêts',
  other: 'Autre',
};

export const receivableStatusLabels: Record<ReceivableEntry['status'], string> = {
  normal: 'Normal',
  late: 'En retard',
  disputed: 'Contesté',
  litigation: 'Contentieux',
  irrecoverable: 'Irrécouvrable',
};

// ── Payable Nature Labels ──
export const payableNatures = [
  'supplier_invoice',
  'salary',
  'capex',
  'tax',
  'tenant_refund',
  'deposit_return',
  'loan_repayment',
  'interest',
  'other',
] as const;

export const payableNatureLabels: Record<typeof payableNatures[number], string> = {
  supplier_invoice: 'Facture fournisseur',
  salary: 'Salaire',
  capex: 'Investissement (CAPEX)',
  tax: 'Impôt / Taxe',
  tenant_refund: 'Remboursement locataire',
  deposit_return: 'Restitution de dépôt',
  loan_repayment: 'Remboursement emprunt',
  interest: 'Intérêts',
  other: 'Autre',
};

export const payableStatusLabels: Record<PayableEntry['status'], string> = {
  to_approve: 'À approuver',
  approved: 'Approuvé',
  scheduled: 'Programmé',
  paid: 'Payé',
  disputed: 'Contesté',
  cancelled: 'Annulé',
};

// ── Receivable (Créance) ──
export interface ReceivableInstallment {
  date: string;
  amount: number;
  status: 'expected' | 'paid' | 'late';
  received?: number;
  received_date?: string;
}

export interface ReceivablePayment {
  date: string;
  amount: number;
  method: string;
  account: string;
  balance_after: number;
  recorded_by: string;
}

export interface ReceivableEntry {
  id?: string;
  reference: string;
  company_id: string;
  debtor_id?: string;
  debtor_name: string;
  nature: typeof receivableNatures[number];
  contract_ref?: string;
  recurrence: 'one_time' | 'monthly_recurring';
  origin: 'manual' | 'auto_from_lease';
  // Amounts
  amount_ht: number;
  vat_applicable: boolean;
  vat_rate: number;
  amount_vat: number;
  amount_ttc: number;
  partial_payments_received: number;
  balance_ttc: number;
  late_interest: number;
  late_interest_rate?: number;
  late_interest_computed: number;
  recoverable_amount: number;
  probability_pct: number;
  discount: number;
  discount_reason?: string;
  // Temporality
  periods: string[];
  invoice_ref?: string;
  invoice_date: string;
  original_due_date: string;
  aging_days: number;
  aging_bracket: '<30' | '30-60' | '60-90' | '>90';
  expected_date: string;
  reception_account_id?: string;
  prescription_date: string;
  prescription_alert: boolean;
  // Installment plan
  has_installment_plan: boolean;
  plan_date?: string;
  plan_context?: string;
  plan_supervisor_id?: string;
  plan_expiry?: string;
  plan_document?: string;
  installments?: ReceivableInstallment[];
  // Status & actions
  status: 'normal' | 'late' | 'disputed' | 'litigation' | 'irrecoverable';
  status_reason?: string;
  priority: 'high' | 'normal' | 'low';
  responsible_id?: string;
  next_action?: 'phone_call' | 'email' | 'formal_notice' | 'payment_order' | 'none';
  next_action_date?: string;
  reminder_template?: 'reminder_1' | 'reminder_2' | 'formal_notice' | 'lawyer_letter';
  linked_dispute: boolean;
  // Files
  invoice_file?: string;
  reminder_files?: string[];
  correspondence_files?: string[];
  agreement_file?: string;
  notes?: string;
  // Payment history
  payments: ReceivablePayment[];
}

// ── Payable (Dette) ──
export interface PayablePayment {
  date: string;
  amount: number;
  account: string;
  reference: string;
  retention_deducted: number;
  recorded_by: string;
}

export interface DOAProgress {
  role: string;
  status: string;
  date?: string;
  name?: string;
}

export interface PayableEntry {
  id?: string;
  reference: string;
  company_id: string;
  creditor_id?: string;
  creditor_name: string;
  nature: typeof payableNatures[number];
  sub_nature?: string;
  purchase_order_ref?: string;
  cost_center?: string;
  budget_line_ref?: string;
  budget_consumed: number;
  budget_remaining: number;
  // 3-Way Matching
  po_amount?: number;
  delivery_amount?: number;
  invoice_amount_ht: number;
  po_variance: number;
  delivery_variance: number;
  matching_status: 'conforming' | 'po_variance' | 'delivery_variance';
  vat_deductible?: number;
  amount_vat: number;
  amount_ttc: number;
  invoice_currency: string;
  fx_rate?: number;
  amount_fcfa?: number;
  payments_made: number;
  balance_remaining: number;
  has_retention: boolean;
  retention_rate?: number;
  retention_amount: number;
  net_payable_now: number;
  retention_release_date?: string;
  late_penalties: number;
  has_early_discount: boolean;
  discount_amount?: number;
  credit_note_amount?: number;
  credit_note_ref?: string;
  final_net_amount: number;
  // Temporality
  service_periods?: string[];
  invoice_date: string;
  receipt_date: string;
  due_date: string;
  current_delay: number;
  planned_payment_date: string;
  priority: 'urgent' | 'normal' | 'deferrable';
  disbursement_account_id: string;
  // Status & DOA
  status: 'to_approve' | 'approved' | 'scheduled' | 'paid' | 'disputed' | 'cancelled';
  doa_required_roles: string[];
  doa_progress: DOAProgress[];
  dispute_reason?: string;
  is_urgent: boolean;
  urgent_reason?: string;
  urgent_approved_by?: string;
  // Letter of Exchange
  has_letter_of_exchange: boolean;
  loe_ref?: string;
  loe_issue_date?: string;
  loe_due_date?: string;
  loe_bank?: string;
  loe_status?: 'issued' | 'accepted' | 'paid' | 'unpaid';
  // Files
  invoice_file?: string;
  po_file?: string;
  delivery_file?: string;
  credit_note_file?: string;
  contract_file?: string;
  notes?: string;
  // Payment history
  payments: PayablePayment[];
}
