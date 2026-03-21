import { supabase } from '@/config/supabase';
import type {
  CounterpartyInput,
  CounterpartyUpdateInput,
  PaymentProfile,
  PaymentProfileOverrides,
  LeaseContract,
  LeaseContractInput,
  IndexationHistoryEntry,
  ColdStartProfile,
  CounterpartyCertainty,
  FlowCertainty,
  TenantFullProfile,
  SupplierFullProfile,
} from '../types';

export const counterpartiesService = {
  async list(companyId: string) {
    const { data, error } = await supabase
      .from('counterparties')
      .select('*')
      .eq('company_id', companyId)
      .order('name');
    if (error) throw error;
    return data ?? [];
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('counterparties')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  async create(companyId: string, input: CounterpartyInput) {
    const { data, error } = await supabase
      .from('counterparties')
      .insert({ ...input, company_id: companyId })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id: string, input: CounterpartyUpdateInput) {
    const { data, error } = await supabase
      .from('counterparties')
      .update(input)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async remove(id: string) {
    const { error } = await supabase
      .from('counterparties')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  // --- Payment Profile ---

  async getPaymentProfile(counterpartyId: string): Promise<PaymentProfile> {
    const { data, error } = await supabase
      .from('payment_profiles')
      .select('*')
      .eq('counterparty_id', counterpartyId)
      .single();

    if (error && error.code === 'PGRST116') {
      // No profile found — return empty default
      return {
        counterparty_id: counterpartyId,
        avg_delay_days: 0,
        delay_std_dev: 0,
        full_payment_rate: 0,
        partial_payment_rate: 0,
        avg_partial_amount_pct: 0,
        history_months: 0,
        trend: 'stable',
        vigilance_status: 'normal',
        risk_score: 0,
        forced_delay: null,
      };
    }
    if (error) throw error;
    return data as PaymentProfile;
  },

  async updatePaymentProfile(
    counterpartyId: string,
    overrides: PaymentProfileOverrides
  ): Promise<PaymentProfile> {
    const { data, error } = await supabase
      .from('payment_profiles')
      .update({
        forced_delay: overrides.forced_delay ?? null,
      })
      .eq('counterparty_id', counterpartyId)
      .select()
      .single();

    if (error) throw error;
    return data as PaymentProfile;
  },

  // --- Lease Contracts ---

  async getLeaseContracts(counterpartyId: string): Promise<LeaseContract[]> {
    const { data, error } = await supabase
      .from('lease_contracts')
      .select('*')
      .eq('counterparty_id', counterpartyId)
      .order('start_date', { ascending: false });

    if (error) throw error;
    return (data ?? []) as LeaseContract[];
  },

  async createLeaseContract(input: LeaseContractInput): Promise<LeaseContract> {
    const { data, error } = await supabase
      .from('lease_contracts')
      .insert(input)
      .select()
      .single();

    if (error) throw error;
    return data as LeaseContract;
  },

  // --- Indexation ---

  async applyIndexation(leaseId: string): Promise<IndexationHistoryEntry> {
    // First get the lease to compute the new rent
    const { data: lease, error: leaseError } = await supabase
      .from('lease_contracts')
      .select('*')
      .eq('id', leaseId)
      .single();

    if (leaseError) throw leaseError;

    const newRent = Math.round(lease.monthly_rent_ht * (1 + lease.indexation_rate / 100));
    const appliedDate = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('indexation_history')
      .insert({
        lease_id: leaseId,
        applied_date: appliedDate,
        old_rent_ht: lease.monthly_rent_ht,
        new_rent_ht: newRent,
        rate_applied: lease.indexation_rate,
      })
      .select()
      .single();

    if (error) throw error;

    // Update the lease with new rent
    await supabase
      .from('lease_contracts')
      .update({ monthly_rent_ht: newRent })
      .eq('id', leaseId);

    return data as IndexationHistoryEntry;
  },

  async getIndexationHistory(leaseId: string): Promise<IndexationHistoryEntry[]> {
    const { data, error } = await supabase
      .from('indexation_history')
      .select('*')
      .eq('lease_id', leaseId)
      .order('applied_date', { ascending: false });

    if (error) throw error;
    return (data ?? []) as IndexationHistoryEntry[];
  },

  // --- Cold-Start Profile ---

  async getColdStartProfile(counterpartyId: string): Promise<ColdStartProfile> {
    const { data, error } = await supabase
      .from('cold_start_profiles')
      .select('*')
      .eq('counterparty_id', counterpartyId)
      .single();

    if (error && error.code === 'PGRST116') {
      return {
        counterparty_id: counterpartyId,
        sector_avg_delay: 0,
        convergence_months: 0,
        alert_threshold_pct: 0,
        is_cold_start: true,
        months_of_data: 0,
      };
    }
    if (error) throw error;
    return data as ColdStartProfile;
  },

  // --- Flow Certainty ---

  async getFlowCertaintyClasses(): Promise<FlowCertainty[]> {
    const { data, error } = await supabase
      .from('flow_certainty_classes')
      .select('*')
      .order('forecast_treatment_pct', { ascending: false });

    if (error) throw error;
    return (data ?? []) as FlowCertainty[];
  },

  async getCounterpartyCertainties(companyId: string): Promise<CounterpartyCertainty[]> {
    const { data, error } = await supabase
      .from('counterparty_certainties')
      .select('*')
      .eq('company_id', companyId)
      .order('counterparty_name');

    if (error) throw error;
    return (data ?? []) as CounterpartyCertainty[];
  },

  async updateCounterpartyCertainty(
    counterpartyId: string,
    certaintyClass: string,
    forecastPct: number
  ): Promise<CounterpartyCertainty> {
    const { data, error } = await supabase
      .from('counterparty_certainties')
      .update({
        assigned_class: certaintyClass,
        forecast_treatment_pct: forecastPct,
        override: true,
      })
      .eq('counterparty_id', counterpartyId)
      .select()
      .single();

    if (error) throw error;
    return data as CounterpartyCertainty;
  },

  // ==========================================================================
  // SUPPLIER FULL PROFILE
  // ==========================================================================

  async getSupplierFullProfile(counterpartyId: string): Promise<SupplierFullProfile> {
    const { data, error } = await supabase
      .from('supplier_profiles')
      .select('*')
      .eq('counterparty_id', counterpartyId)
      .single();

    if (error && error.code === 'PGRST116') {
      // No profile — return empty structure
      return {
        id: counterpartyId,
        identity: {
          legal_name: '',
          trade_name: '',
          legal_form: '',
          tax_number: '',
          category: 'other',
          commercial_contact: '',
          phone: '',
          email: '',
          country: '',
          billing_currency: 'XOF',
          status: 'active',
          criticality: 'standard',
          conflict_of_interest: false,
        },
        referencing: {
          referencing_status: 'in_progress',
          request_date: '',
          documents: [],
          subject_to_rotation: false,
        },
        contract: {
          relationship_type: 'spot',
          tacit_renewal: false,
          vat_applicable: false,
          payment_delay_days: 30,
          payment_base: 'invoice_receipt',
          early_payment_discount: false,
          payment_methods: [],
          has_retention: false,
        },
        payment_profile: {
          counterparty_id: counterpartyId,
          avg_delay_days: 0,
          delay_std_dev: 0,
          full_payment_rate: 0,
          partial_payment_rate: 0,
          avg_partial_amount_pct: 0,
          history_months: 0,
          trend: 'stable',
          vigilance_status: 'normal',
          risk_score: 0,
          forced_delay: null,
        },
        bank_accounts: [],
        scorecards: [],
        transactions: [],
      };
    }
    if (error) throw error;
    return data as SupplierFullProfile;
  },

  async saveSupplierFullProfile(counterpartyId: string, profile: Partial<SupplierFullProfile>): Promise<{ success: boolean }> {
    const { error } = await supabase
      .from('supplier_profiles')
      .upsert({ counterparty_id: counterpartyId, ...profile }, { onConflict: 'counterparty_id' });

    if (error) throw error;
    return { success: true };
  },

  // ==========================================================================
  // TENANT FULL PROFILE
  // ==========================================================================

  async getTenantFullProfile(counterpartyId: string): Promise<TenantFullProfile> {
    const { data, error } = await supabase
      .from('tenant_profiles')
      .select('*')
      .eq('counterparty_id', counterpartyId)
      .single();

    if (error && error.code === 'PGRST116') {
      // No profile — return empty structure
      return {
        id: counterpartyId,
        identity: {
          legal_name: '',
          trade_name: '',
          legal_form: 'sarl',
          activity_sector: '',
          primary_contact_name: '',
          phone_primary: '',
          email_primary: '',
          status: 'active',
          tags: [],
          has_multiple_units: false,
          conflict_of_interest: false,
        },
        lease: {
          lease_type: 'commercial',
          lease_ref: '',
          zone: '',
          unit_number: '',
          total_area: 0,
          signature_date: '',
          effective_date: '',
          expiry_date: '',
          firm_duration: 0,
          renewal_option: false,
          lease_document: '',
          monthly_rent_ht: 0,
          rent_per_sqm: 0,
          monthly_charges_ht: 0,
          has_variable_rent: false,
          has_rent_free: false,
          vat_applicable: false,
          payment_due_day: 1,
          periodicity: 'monthly',
          reception_account_id: '',
        },
        amendments: [],
        declared_revenues: [],
        installment_plans: [],
        deposit_guarantee: {
          has_damages: false,
          has_bank_guarantee: false,
        },
        insurance: {
          has_rc_insurance: false,
          has_multirisque: false,
        },
        works: [],
        transaction_history: [],
        disputes: [],
      };
    }
    if (error) throw error;
    return data as TenantFullProfile;
  },

  async saveTenantFullProfile(counterpartyId: string, profile: Partial<TenantFullProfile>): Promise<TenantFullProfile> {
    const { data, error } = await supabase
      .from('tenant_profiles')
      .upsert({ counterparty_id: counterpartyId, ...profile }, { onConflict: 'counterparty_id' })
      .select()
      .single();

    if (error) throw error;
    return data as TenantFullProfile;
  },
};
