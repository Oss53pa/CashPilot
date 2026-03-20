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
} from '../types';

// --- Mock data for Ivorian commercial real estate (FCFA) ---

const MOCK_PAYMENT_PROFILES: Record<string, PaymentProfile> = {
  default: {
    counterparty_id: '',
    avg_delay_days: 7.2,
    delay_std_dev: 3.1,
    full_payment_rate: 0.85,
    partial_payment_rate: 0.12,
    avg_partial_amount_pct: 0.78,
    history_months: 18,
    trend: 'stable',
    vigilance_status: 'normal',
    risk_score: 2,
    forced_delay: null,
  },
};

const MOCK_LEASE_CONTRACTS: LeaseContract[] = [
  {
    id: 'lease-001',
    counterparty_id: '',
    lease_reference: 'BAIL-2024-001',
    monthly_rent_ht: 2_500_000,
    monthly_charges_ht: 450_000,
    payment_due_day: 5,
    security_deposit: 7_500_000,
    start_date: '2024-01-01',
    end_date: '2026-12-31',
    indexation_type: 'fixed_rate',
    indexation_rate: 3.5,
    indexation_date: '2025-01-01',
    next_indexation_date: '2026-01-01',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2025-01-15T00:00:00Z',
  },
  {
    id: 'lease-002',
    counterparty_id: '',
    lease_reference: 'BAIL-2024-002',
    monthly_rent_ht: 1_800_000,
    monthly_charges_ht: 320_000,
    payment_due_day: 1,
    security_deposit: 5_400_000,
    start_date: '2024-03-01',
    end_date: '2027-02-28',
    indexation_type: 'external_index',
    indexation_rate: 2.8,
    indexation_date: '2025-03-01',
    next_indexation_date: '2026-03-01',
    created_at: '2024-03-01T00:00:00Z',
    updated_at: '2025-03-10T00:00:00Z',
  },
  {
    id: 'lease-003',
    counterparty_id: '',
    lease_reference: 'BAIL-2023-015',
    monthly_rent_ht: 4_200_000,
    monthly_charges_ht: 780_000,
    payment_due_day: 10,
    security_deposit: 12_600_000,
    start_date: '2023-06-01',
    end_date: '2029-05-31',
    indexation_type: 'contractual_step',
    indexation_rate: 5.0,
    indexation_date: '2024-06-01',
    next_indexation_date: '2026-06-01',
    created_at: '2023-06-01T00:00:00Z',
    updated_at: '2025-06-05T00:00:00Z',
  },
];

const MOCK_INDEXATION_HISTORY: IndexationHistoryEntry[] = [
  {
    id: 'idx-001',
    lease_id: 'lease-001',
    applied_date: '2025-01-01',
    old_rent_ht: 2_415_000,
    new_rent_ht: 2_500_000,
    rate_applied: 3.5,
  },
  {
    id: 'idx-002',
    lease_id: 'lease-001',
    applied_date: '2024-01-01',
    old_rent_ht: 2_333_000,
    new_rent_ht: 2_415_000,
    rate_applied: 3.5,
  },
  {
    id: 'idx-003',
    lease_id: 'lease-002',
    applied_date: '2025-03-01',
    old_rent_ht: 1_751_000,
    new_rent_ht: 1_800_000,
    rate_applied: 2.8,
  },
  {
    id: 'idx-004',
    lease_id: 'lease-003',
    applied_date: '2025-06-01',
    old_rent_ht: 4_000_000,
    new_rent_ht: 4_200_000,
    rate_applied: 5.0,
  },
  {
    id: 'idx-005',
    lease_id: 'lease-003',
    applied_date: '2024-06-01',
    old_rent_ht: 3_810_000,
    new_rent_ht: 4_000_000,
    rate_applied: 5.0,
  },
];

const MOCK_TENANT_PROFILES: Record<string, Partial<PaymentProfile>> = {
  'ZARA CI': {
    avg_delay_days: 2.1,
    delay_std_dev: 1.4,
    full_payment_rate: 0.97,
    partial_payment_rate: 0.02,
    avg_partial_amount_pct: 0.92,
    history_months: 24,
    trend: 'improving',
    vigilance_status: 'normal',
    risk_score: 1,
  },
  'CARREFOUR Market': {
    avg_delay_days: 5.8,
    delay_std_dev: 2.9,
    full_payment_rate: 0.91,
    partial_payment_rate: 0.07,
    avg_partial_amount_pct: 0.85,
    history_months: 18,
    trend: 'stable',
    vigilance_status: 'normal',
    risk_score: 2,
  },
  'MTN Boutique': {
    avg_delay_days: 12.4,
    delay_std_dev: 6.7,
    full_payment_rate: 0.72,
    partial_payment_rate: 0.18,
    avg_partial_amount_pct: 0.65,
    history_months: 12,
    trend: 'degrading',
    vigilance_status: 'surveillance',
    risk_score: 3,
  },
  'Orange CI': {
    avg_delay_days: 3.5,
    delay_std_dev: 1.8,
    full_payment_rate: 0.95,
    partial_payment_rate: 0.04,
    avg_partial_amount_pct: 0.9,
    history_months: 36,
    trend: 'stable',
    vigilance_status: 'normal',
    risk_score: 1,
  },
  'Banque Atlantique': {
    avg_delay_days: 18.6,
    delay_std_dev: 8.2,
    full_payment_rate: 0.6,
    partial_payment_rate: 0.25,
    avg_partial_amount_pct: 0.55,
    history_months: 6,
    trend: 'degrading',
    vigilance_status: 'alert',
    risk_score: 4,
  },
};

const FLOW_CERTAINTY_CLASSES: FlowCertainty[] = [
  { class: 'certain', description: 'Contractual obligation with guarantee', forecast_treatment_pct: 100 },
  { class: 'quasi_certain', description: 'Regular payer, long history', forecast_treatment_pct: 95 },
  { class: 'probable', description: 'Based on calculated probability', forecast_treatment_pct: 75 },
  { class: 'uncertain', description: 'Optimistic scenario only', forecast_treatment_pct: 40 },
  { class: 'exceptional', description: 'Manual probability assignment', forecast_treatment_pct: 0 },
];

// Simulated delay
function delay(ms = 200): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const counterpartiesService = {
  async list(companyId: string) {
    const { data, error } = await supabase
      .from('counterparties')
      .select('*')
      .eq('company_id', companyId)
      .order('name');
    if (error) throw error;
    return data;
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

  async getPaymentProfile(counterpartyId: string, counterpartyName?: string): Promise<PaymentProfile> {
    await delay();
    const nameProfile = counterpartyName ? MOCK_TENANT_PROFILES[counterpartyName] : undefined;
    const base = MOCK_PAYMENT_PROFILES.default;
    return {
      ...base,
      ...nameProfile,
      counterparty_id: counterpartyId,
    };
  },

  async updatePaymentProfile(
    counterpartyId: string,
    overrides: PaymentProfileOverrides
  ): Promise<PaymentProfile> {
    await delay();
    const base = MOCK_PAYMENT_PROFILES.default;
    return {
      ...base,
      counterparty_id: counterpartyId,
      forced_delay: overrides.forced_delay ?? null,
    };
  },

  // --- Lease Contracts ---

  async getLeaseContracts(counterpartyId: string): Promise<LeaseContract[]> {
    await delay();
    // Return mock leases bound to this counterparty
    const leases = MOCK_LEASE_CONTRACTS.slice(0, 2).map((l) => ({
      ...l,
      counterparty_id: counterpartyId,
    }));
    return leases;
  },

  async createLeaseContract(data: LeaseContractInput): Promise<LeaseContract> {
    await delay();
    return {
      id: `lease-${Date.now()}`,
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  },

  // --- Indexation ---

  async applyIndexation(leaseId: string): Promise<IndexationHistoryEntry> {
    await delay();
    const lease = MOCK_LEASE_CONTRACTS.find((l) => l.id === leaseId) ?? MOCK_LEASE_CONTRACTS[0];
    const newRent = Math.round(lease.monthly_rent_ht * (1 + lease.indexation_rate / 100));
    return {
      id: `idx-${Date.now()}`,
      lease_id: leaseId,
      applied_date: new Date().toISOString().split('T')[0],
      old_rent_ht: lease.monthly_rent_ht,
      new_rent_ht: newRent,
      rate_applied: lease.indexation_rate,
    };
  },

  async getIndexationHistory(leaseId: string): Promise<IndexationHistoryEntry[]> {
    await delay();
    return MOCK_INDEXATION_HISTORY.filter((h) => h.lease_id === leaseId);
  },

  // --- Cold-Start Profile ---

  async getColdStartProfile(counterpartyId: string, counterpartyName?: string): Promise<ColdStartProfile> {
    await delay();
    const nameProfile = counterpartyName ? MOCK_TENANT_PROFILES[counterpartyName] : undefined;
    const historyMonths = nameProfile?.history_months ?? 0;
    return {
      counterparty_id: counterpartyId,
      sector_avg_delay: 8.5,
      convergence_months: 6,
      alert_threshold_pct: 15,
      is_cold_start: historyMonths < 6,
      months_of_data: historyMonths,
    };
  },

  // --- Flow Certainty ---

  async getFlowCertaintyClasses(): Promise<FlowCertainty[]> {
    await delay();
    return FLOW_CERTAINTY_CLASSES;
  },

  async getCounterpartyCertainties(companyId: string): Promise<CounterpartyCertainty[]> {
    await delay();
    // Generate mock certainty classifications
    void companyId;
    const mockEntries: CounterpartyCertainty[] = [
      { counterparty_id: 'cp-001', counterparty_name: 'ZARA CI', assigned_class: 'certain', forecast_treatment_pct: 100, override: false },
      { counterparty_id: 'cp-002', counterparty_name: 'CARREFOUR Market', assigned_class: 'quasi_certain', forecast_treatment_pct: 95, override: false },
      { counterparty_id: 'cp-003', counterparty_name: 'MTN Boutique', assigned_class: 'probable', forecast_treatment_pct: 75, override: false },
      { counterparty_id: 'cp-004', counterparty_name: 'Orange CI', assigned_class: 'quasi_certain', forecast_treatment_pct: 95, override: false },
      { counterparty_id: 'cp-005', counterparty_name: 'Banque Atlantique', assigned_class: 'uncertain', forecast_treatment_pct: 40, override: true },
    ];
    return mockEntries;
  },

  async updateCounterpartyCertainty(
    counterpartyId: string,
    certaintyClass: string,
    forecastPct: number
  ): Promise<CounterpartyCertainty> {
    await delay();
    return {
      counterparty_id: counterpartyId,
      counterparty_name: '',
      assigned_class: certaintyClass as CounterpartyCertainty['assigned_class'],
      forecast_treatment_pct: forecastPct,
      override: true,
    };
  },
};
