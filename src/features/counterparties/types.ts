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
