import { z } from 'zod';

export const counterpartySchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  short_name: z.string().max(50).nullable().default(null),
  type: z.enum(['customer', 'supplier', 'employee', 'government', 'other']),
  tax_id: z.string().max(50).nullable().default(null),
  email: z.string().email('Invalid email').nullable().default(null),
  phone: z.string().max(30).nullable().default(null),
  address: z.string().max(500).nullable().default(null),
  payment_terms: z.number().int().min(0).default(30),
  is_active: z.boolean().default(true),
});

export const counterpartyUpdateSchema = counterpartySchema.partial();

export type CounterpartyInput = z.infer<typeof counterpartySchema>;
export type CounterpartyUpdateInput = z.infer<typeof counterpartyUpdateSchema>;

// --- Payment Behavioral Profile ---

export type PaymentTrend = 'improving' | 'stable' | 'degrading';
export type VigilanceStatus = 'normal' | 'surveillance' | 'alert';

export interface PaymentProfile {
  counterparty_id: string;
  avg_delay_days: number;
  delay_std_dev: number;
  full_payment_rate: number;
  partial_payment_rate: number;
  avg_partial_amount_pct: number;
  history_months: number;
  trend: PaymentTrend;
  vigilance_status: VigilanceStatus;
  risk_score: number; // 1-5
  forced_delay: number | null; // optional override
}

export interface PaymentProfileOverrides {
  forced_delay?: number | null;
  probability_override?: number | null;
  risk_note?: string | null;
}

// --- Lease Contract & Indexation ---

export type IndexationType = 'fixed_rate' | 'external_index' | 'contractual_step' | 'manual';

export interface LeaseContract {
  id: string;
  counterparty_id: string;
  lease_reference: string;
  monthly_rent_ht: number;
  monthly_charges_ht: number;
  payment_due_day: number;
  security_deposit: number;
  start_date: string;
  end_date: string | null;
  indexation_type: IndexationType;
  indexation_rate: number;
  indexation_date: string;
  next_indexation_date: string;
  created_at: string;
  updated_at: string;
}

export interface LeaseContractInput {
  counterparty_id: string;
  lease_reference: string;
  monthly_rent_ht: number;
  monthly_charges_ht: number;
  payment_due_day: number;
  security_deposit: number;
  start_date: string;
  end_date: string | null;
  indexation_type: IndexationType;
  indexation_rate: number;
  indexation_date: string;
  next_indexation_date: string;
}

export interface IndexationHistoryEntry {
  id: string;
  lease_id: string;
  applied_date: string;
  old_rent_ht: number;
  new_rent_ht: number;
  rate_applied: number;
}

// --- Flow Certainty Classification ---

export type CertaintyClass = 'certain' | 'quasi_certain' | 'probable' | 'uncertain' | 'exceptional';

export interface FlowCertainty {
  class: CertaintyClass;
  description: string;
  forecast_treatment_pct: number;
}

export interface CounterpartyCertainty {
  counterparty_id: string;
  counterparty_name: string;
  assigned_class: CertaintyClass;
  forecast_treatment_pct: number;
  override: boolean;
}

// --- Cold-Start Scoring ---

export interface ColdStartProfile {
  counterparty_id: string;
  sector_avg_delay: number;
  convergence_months: number;
  alert_threshold_pct: number;
  is_cold_start: boolean;
  months_of_data: number;
}

// =============================================================================
// TENANT PROFILE - Full 10-Tab Form Types
// =============================================================================

// --- Tab 1: Identity (Identite) ---

export type TenantLegalForm = 'sarl' | 'sa' | 'sas' | 'ei' | 'association' | 'other';
export type TenantStatus = 'active' | 'inactive' | 'negotiating' | 'pre_lease' | 'suspended';
export type EmployeeCount = '1-5' | '6-20' | '21-50' | '51-200' | '200+';

export interface TenantIdentity {
  legal_name: string;
  trade_name: string;
  brand_group?: string;
  brand_nationality?: string;
  legal_form: TenantLegalForm;
  rc_number?: string;
  tax_number?: string;
  activity_sector: string;
  sub_sector?: string;
  primary_contact_name: string;
  primary_contact_role?: string;
  phone_primary: string;
  email_primary: string;
  phone_secondary?: string;
  email_secondary?: string;
  hq_address?: string;
  employee_count?: EmployeeCount;
  annual_revenue?: number;
  status: TenantStatus;
  tags: string[];
  has_multiple_units: boolean;
  conflict_of_interest: boolean;
  conflict_detail?: string;
  notes?: string;
  identity_documents?: string[];
}

// --- Tab 2: Lease & Rents (Bail & Loyers) ---

export type LeaseType = 'befa' | 'commercial' | 'precarious' | 'temporary';
export type Periodicity = 'monthly' | 'quarterly' | 'semi_annual';
export type FullIndexationType = 'none' | 'fixed_rate' | 'external_index' | 'contractual_step';

export interface LeaseDetails {
  lease_type: LeaseType;
  lease_ref: string;
  zone: string;
  unit_number: string;
  floor?: string;
  total_area: number;
  sales_area?: number;
  signature_date: string;
  effective_date: string;
  expiry_date: string;
  firm_duration: number;
  renewal_option: boolean;
  notice_period_months?: number;
  renewal_alert_days?: number;
  lease_document: string;
  // Rent structure
  monthly_rent_ht: number;
  rent_per_sqm: number;
  monthly_charges_ht: number;
  has_variable_rent: boolean;
  variable_rent_pct?: number;
  guaranteed_minimum_ca?: number;
  entry_fee?: number;
  entry_fee_date?: string;
  has_rent_free: boolean;
  rent_free_months?: number;
  rent_free_start?: string;
  rent_free_end?: string;
  post_free_rent?: number;
  vat_applicable: boolean;
  vat_rate?: number;
  payment_due_day: number;
  periodicity: Periodicity;
  payment_method?: string;
  reception_account_id: string;
  // Indexation
  indexation_type?: FullIndexationType;
  indexation_rate?: number;
  indexation_index?: string;
  indexation_anniversary?: string;
  next_revised_rent?: number;
  indexation_cap?: number;
  // Effort ratio
  effort_ratio?: number;
  effort_alert_threshold?: number;
}

// --- Tab 3: Amendments (Avenants) ---

export interface LeaseAmendment {
  id: string;
  amendment_number: string;
  signature_date: string;
  effective_date: string;
  modification_types: string[];
  description: string;
  new_rent?: number;
  new_area?: number;
  new_expiry?: string;
  document: string;
  signed_by_tenant: string;
  signed_by_landlord: string;
  validated_by?: string;
}

// --- Tab 4: Declared Revenue (CA Declare) ---

export type DeclaredRevenueStatus = 'declared' | 'verified' | 'disputed' | 'audited';

export interface DeclaredRevenue {
  period: string;
  declared_ca: number;
  verified_ca?: number;
  declaration_date: string;
  variable_rent_calculated: number;
  guaranteed_minimum: number;
  variable_rent_due: number;
  justification_file?: string;
  status: DeclaredRevenueStatus;
  notes?: string;
}

// --- Tab 5: Behavior / Installment Plan ---

export type InstallmentPlanStatus = 'active' | 'completed' | 'defaulted';

export interface InstallmentPlan {
  id: string;
  plan_ref: string;
  start_date: string;
  end_date: string;
  total_debt: number;
  monthly_payment: number;
  nb_installments: number;
  paid_installments: number;
  remaining_balance: number;
  status: InstallmentPlanStatus;
  notes?: string;
}

// --- Tab 6: Deposits & Guarantees (Depots & Garanties) ---

export interface DepositGuarantee {
  cash_deposit_received?: number;
  deposit_date?: string;
  months_equivalent?: number;
  holding_account?: string;
  restitution_date?: string;
  restitution_conditions?: string;
  estimated_deduction?: number;
  deduction_reason?: string;
  entry_inspection_date?: string;
  entry_inspection_file?: string;
  entry_inspection_notes?: string;
  exit_inspection_date?: string;
  exit_inspection_file?: string;
  exit_inspection_notes?: string;
  has_damages: boolean;
  damage_deduction?: number;
  has_bank_guarantee: boolean;
  guarantee_ref?: string;
  guarantor_bank?: string;
  guarantee_amount?: number;
  guarantee_expiry?: string;
  guarantee_renewal_alert_days?: number;
  guarantee_document?: string;
}

// --- Tab 7: Insurance (Assurances) ---

export interface TenantInsurance {
  has_rc_insurance: boolean;
  rc_company?: string;
  rc_policy_number?: string;
  rc_start_date?: string;
  rc_expiry_date?: string;
  rc_coverage?: number;
  rc_certificate_file?: string;
  rc_expiry_alert_days?: number;
  has_multirisque: boolean;
  mr_company?: string;
  mr_policy_number?: string;
  mr_start_date?: string;
  mr_expiry_date?: string;
  mr_coverage?: number;
  mr_certificate_file?: string;
  notes?: string;
}

// --- Tab 8: Tenant Works (Travaux) ---

export type TenantWorkStatus = 'pending' | 'authorized' | 'refused' | 'in_progress' | 'completed';

export interface TenantWork {
  id: string;
  ref: string;
  request_date: string;
  description: string;
  estimated_cost?: number;
  status: TenantWorkStatus;
  authorization_date?: string;
  start_date?: string;
  expected_end_date?: string;
  actual_end_date?: string;
  restoration_required: boolean;
  documents?: string[];
  validated_by?: string;
  notes?: string;
}

// --- Tab 9: History (Historique) ---

export type TransactionHistoryType = 'rent' | 'charge' | 'deposit' | 'penalty' | 'adjustment' | 'refund';

export interface TransactionHistoryEntry {
  id: string;
  date: string;
  type: TransactionHistoryType;
  description: string;
  amount: number;
  balance_after: number;
  reference?: string;
}

// --- Tab 10: Disputes (Contentieux) ---

export type TenantDisputeStatus = 'open' | 'in_progress' | 'settled' | 'closed' | 'written_off';

export interface TenantDispute {
  id: string;
  ref: string;
  opened_date: string;
  type: string;
  description: string;
  amount_claimed: number;
  status: TenantDisputeStatus;
  lawyer?: string;
  next_hearing_date?: string;
  resolution_date?: string;
  resolution_amount?: number;
  notes?: string;
}

// --- Full Tenant Profile (aggregates all tabs) ---

export interface TenantFullProfile {
  id: string;
  identity: TenantIdentity;
  lease: LeaseDetails;
  amendments: LeaseAmendment[];
  declared_revenues: DeclaredRevenue[];
  installment_plans: InstallmentPlan[];
  deposit_guarantee: DepositGuarantee;
  insurance: TenantInsurance;
  works: TenantWork[];
  transaction_history: TransactionHistoryEntry[];
  disputes: TenantDispute[];
}

// --- Supplier-specific types ---

export type SupplierCategory =
  | 'maintenance'
  | 'energy'
  | 'security'
  | 'cleaning'
  | 'personnel'
  | 'consulting'
  | 'equipment'
  | 'utilities'
  | 'works'
  | 'other';

export type SupplierStatus = 'active' | 'inactive' | 'suspended' | 'in_dispute' | 'being_referenced';
export type SupplierCriticality = 'critical' | 'important' | 'standard';
export type ReferencingStatus = 'in_progress' | 'approved' | 'refused' | 'suspended';
export type TenderResult = 'selected' | 'not_selected' | 'pending';
export type RotationFrequency = 'annual' | 'biennial' | 'triennial';
export type RelationshipType = 'annual' | 'multi_year' | 'spot' | 'framework';
export type PaymentBase = 'invoice_receipt' | 'month_end' | 'service_date';

export interface SupplierIdentity {
  legal_name: string;
  trade_name?: string;
  legal_form: string;
  rc_number?: string;
  tax_number: string;
  vat_number?: string;
  category: SupplierCategory;
  sub_category?: string;
  commercial_contact: string;
  phone: string;
  email: string;
  billing_contact?: string;
  billing_email?: string;
  address?: string;
  country: string;
  billing_currency: string;
  status: SupplierStatus;
  criticality: SupplierCriticality;
  backup_supplier_id?: string;
  annual_cap?: number;
  conflict_of_interest: boolean;
  conflict_detail?: string;
  notes?: string;
}

export interface SupplierReferencingDocument {
  type: string;
  file?: string;
  provided: boolean;
}

export interface SupplierReferencing {
  referencing_status: ReferencingStatus;
  request_date: string;
  approval_date?: string;
  approved_by?: string;
  documents: SupplierReferencingDocument[];
  tender_ref?: string;
  tender_date?: string;
  tender_result?: TenderResult;
  tender_justification?: string;
  subject_to_rotation: boolean;
  rotation_frequency?: RotationFrequency;
  next_tender_date?: string;
}

export interface SupplierContract {
  relationship_type: RelationshipType;
  contract_ref?: string;
  start_date?: string;
  end_date?: string;
  tacit_renewal: boolean;
  notice_days?: number;
  contract_alert_days?: number;
  contract_file?: string;
  annual_amount?: number;
  monthly_amount?: number;
  billing_frequency?: string;
  vat_applicable: boolean;
  vat_rate?: number;
  payment_delay_days: number;
  payment_base: PaymentBase;
  early_payment_discount: boolean;
  discount_rate?: number;
  discount_delay?: number;
  late_penalty_rate?: number;
  payment_methods: string[];
  default_account_id?: string;
  has_retention: boolean;
  retention_rate?: number;
  retention_duration_months?: number;
  retention_release_conditions?: string;
}

export interface SupplierBankAccount {
  id: string;
  bank_name: string;
  bank_country: string;
  iban: string;
  bic_swift?: string;
  account_holder: string;
  currency: string;
  is_primary: boolean;
  verification_date?: string;
  verified_by?: string;
  verification_method?: string;
  verification_document?: string;
}

export interface SupplierScorecardCriteria {
  name: string;
  score: number;
  comment?: string;
}

export interface SupplierScorecard {
  id: string;
  criteria: SupplierScorecardCriteria[];
  overall_score: number;
  evaluator_id: string;
  evaluation_date: string;
  period: string;
  recommendation: 'renew' | 'tender' | 'terminate';
}

export interface SupplierFullProfile {
  id: string;
  identity: SupplierIdentity;
  referencing: SupplierReferencing;
  contract: SupplierContract;
  payment_profile: PaymentProfile;
  bank_accounts: SupplierBankAccount[];
  scorecards: SupplierScorecard[];
  transactions: SupplierTransaction[];
}

export interface SupplierTransaction {
  id: string;
  date: string;
  type: 'invoice' | 'payment' | 'credit_note' | 'advance';
  reference: string;
  description: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue' | 'cancelled';
}
