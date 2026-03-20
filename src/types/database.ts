export interface Tenant {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  updated_at: string;
}

export interface Company {
  id: string;
  tenant_id: string;
  name: string;
  short_name: string;
  currency: string;
  fiscal_year_start: number;
  logo_url: string | null;
  address: string | null;
  country: string;
  city: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  /** Tenant-level role: determines cross-company access */
  tenant_role: 'tenant_admin' | 'group_cfo' | 'group_viewer' | null;
  tenant_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserCompanyAccess {
  id: string;
  user_id: string;
  company_id: string;
  /** Company-level role: determines what the user can do within this specific company */
  role: 'company_cfo' | 'company_manager' | 'treasurer' | 'viewer' | 'auditor';
  granted_at: string;
}

export interface BankAccount {
  id: string;
  company_id: string;
  bank_name: string;
  account_number: string;
  account_name: string;
  currency: string;
  account_type: 'current' | 'savings' | 'mobile_money' | 'cash';
  initial_balance: number;
  current_balance: number;
  is_active: boolean;
  iban: string | null;
  swift_code: string | null;
  created_at: string;
  updated_at: string;
}

export interface CashFlow {
  id: string;
  company_id: string;
  bank_account_id: string;
  type: 'receipt' | 'disbursement';
  category: string;
  subcategory: string | null;
  amount: number;
  currency: string;
  value_date: string;
  operation_date: string;
  reference: string | null;
  description: string | null;
  counterparty_id: string | null;
  status: 'pending' | 'validated' | 'reconciled' | 'cancelled';
  created_by: string;
  validated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Forecast {
  id: string;
  company_id: string;
  bank_account_id: string | null;
  type: 'receipt' | 'disbursement';
  category: string;
  amount: number;
  currency: string;
  forecast_date: string;
  horizon: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  confidence: number;
  source: 'manual' | 'recurring' | 'ai';
  notes: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Counterparty {
  id: string;
  company_id: string;
  name: string;
  short_name: string | null;
  type: 'customer' | 'supplier' | 'employee' | 'government' | 'other';
  tax_id: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  payment_terms: number;
  scoring: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Budget {
  id: string;
  company_id: string;
  name: string;
  fiscal_year: number;
  version: number;
  status: 'draft' | 'submitted' | 'approved' | 'archived';
  created_by: string;
  approved_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface BudgetLine {
  id: string;
  budget_id: string;
  category: string;
  subcategory: string | null;
  type: 'receipt' | 'disbursement';
  month_01: number;
  month_02: number;
  month_03: number;
  month_04: number;
  month_05: number;
  month_06: number;
  month_07: number;
  month_08: number;
  month_09: number;
  month_10: number;
  month_11: number;
  month_12: number;
  notes: string | null;
}

export interface DisputeFile {
  id: string;
  company_id: string;
  reference: string;
  counterparty_id: string;
  type: 'litigation' | 'arbitration' | 'mediation' | 'recovery';
  amount_disputed: number;
  amount_provision: number;
  currency: string;
  status: 'open' | 'in_progress' | 'settled' | 'closed' | 'written_off';
  opened_date: string;
  closed_date: string | null;
  description: string | null;
  lawyer: string | null;
  court: string | null;
  next_hearing: string | null;
  exit_scenario: 'favorable' | 'neutral' | 'unfavorable' | null;
  probability: number | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CapexOperation {
  id: string;
  company_id: string;
  name: string;
  description: string | null;
  category: 'equipment' | 'vehicle' | 'building' | 'it' | 'other';
  budget_amount: number;
  committed_amount: number;
  spent_amount: number;
  currency: string;
  status: 'planned' | 'approved' | 'in_progress' | 'completed' | 'cancelled';
  start_date: string;
  end_date: string | null;
  approved_by: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface DebtContract {
  id: string;
  company_id: string;
  lender: string;
  contract_reference: string;
  type: 'term_loan' | 'revolving' | 'overdraft' | 'leasing' | 'bond';
  principal_amount: number;
  outstanding_amount: number;
  interest_rate: number;
  currency: string;
  start_date: string;
  maturity_date: string;
  payment_frequency: 'monthly' | 'quarterly' | 'semi_annual' | 'annual';
  status: 'active' | 'fully_repaid' | 'defaulted' | 'restructured';
  covenants: string | null;
  created_at: string;
  updated_at: string;
}

export interface Investment {
  id: string;
  company_id: string;
  name: string;
  type: 'term_deposit' | 'treasury_bill' | 'money_market' | 'bond' | 'other';
  institution: string;
  amount: number;
  currency: string;
  interest_rate: number;
  start_date: string;
  maturity_date: string;
  status: 'active' | 'matured' | 'withdrawn';
  auto_renew: boolean;
  created_at: string;
  updated_at: string;
}

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
  status: 'active' | 'expired' | 'suspended';
  covenants: string | null;
  created_at: string;
  updated_at: string;
}

export interface InternalTransfer {
  id: string;
  company_id: string;
  from_account_id: string;
  to_account_id: string;
  amount: number;
  currency: string;
  execution_date: string;
  status: 'pending' | 'executed' | 'cancelled';
  reference: string | null;
  notes: string | null;
  created_by: string;
  created_at: string;
}

export interface PaymentRequest {
  id: string;
  company_id: string;
  requester_id: string;
  counterparty_id: string | null;
  bank_account_id: string | null;
  amount: number;
  currency: string;
  payment_date: string;
  category: string;
  description: string;
  status: 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'paid' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  attachments: string[];
  created_at: string;
  updated_at: string;
}

export interface PaymentApproval {
  id: string;
  payment_request_id: string;
  approver_id: string;
  decision: 'approved' | 'rejected';
  comments: string | null;
  decided_at: string;
}

export interface AuditLog {
  id: string;
  tenant_id: string;
  company_id: string | null;
  user_id: string;
  action: string;
  module: string;
  entity_type: string;
  entity_id: string;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
}

export interface SecurityDeposit {
  id: string;
  company_id: string;
  type: 'rental' | 'customs' | 'utility' | 'other';
  amount: number;
  currency: string;
  institution: string;
  deposit_date: string;
  release_date: string | null;
  status: 'active' | 'released' | 'forfeited';
  reference: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface TaxObligation {
  id: string;
  company_id: string;
  type: 'vat' | 'corporate_tax' | 'payroll_tax' | 'withholding' | 'customs' | 'other';
  period: string;
  due_date: string;
  amount: number;
  currency: string;
  status: 'upcoming' | 'paid' | 'overdue' | 'contested';
  paid_date: string | null;
  reference: string | null;
  created_at: string;
  updated_at: string;
}

export interface Alert {
  id: string;
  company_id: string;
  type: 'low_balance' | 'high_balance' | 'payment_due' | 'covenant_breach' | 'budget_overrun' | 'forecast_deviation';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  is_read: boolean;
  entity_type: string | null;
  entity_id: string | null;
  created_at: string;
}
