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
  TenantIdentity,
  LeaseDetails,
  LeaseAmendment,
  DeclaredRevenue,
  InstallmentPlan,
  DepositGuarantee,
  TenantInsurance,
  TenantWork,
  TransactionHistoryEntry,
  TenantDispute,
  SupplierFullProfile,
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

  // ==========================================================================
  // SUPPLIER FULL PROFILE - 7 Tabs
  // ==========================================================================

  async getSupplierFullProfile(counterpartyId: string): Promise<SupplierFullProfile> {
    await delay(300);
    return {
      id: counterpartyId,
      identity: {
        legal_name: 'SOGECI MAINTENANCE SARL',
        trade_name: 'SOGECI',
        legal_form: 'SARL',
        rc_number: 'CI-ABJ-2018-B-12456',
        tax_number: '1824567A',
        vat_number: 'CI0018245670',
        category: 'maintenance',
        sub_category: 'Climatisation & Plomberie',
        commercial_contact: 'M. Koné Ibrahim',
        phone: '+225 07 08 09 10 11',
        email: 'contact@sogeci.ci',
        billing_contact: 'Mme Touré Aminata',
        billing_email: 'facturation@sogeci.ci',
        address: 'Zone Industrielle Vridi, Abidjan',
        country: 'Côte d\'Ivoire',
        billing_currency: 'XOF',
        status: 'active',
        criticality: 'important',
        annual_cap: 120_000_000,
        conflict_of_interest: false,
        notes: 'Fournisseur référencé depuis 2018.',
      },
      referencing: {
        referencing_status: 'approved',
        request_date: '2018-03-15',
        approval_date: '2018-04-20',
        approved_by: 'Direction Achats',
        documents: [
          { type: 'Extrait RCCM', file: 'rccm_sogeci.pdf', provided: true },
          { type: 'Attestation fiscale', file: 'attest_fisc_sogeci.pdf', provided: true },
          { type: 'Attestation CNPS', file: 'cnps_sogeci.pdf', provided: true },
          { type: 'RIB bancaire', file: 'rib_sogeci.pdf', provided: true },
          { type: 'Certificat assurance', file: 'assur_sogeci.pdf', provided: true },
          { type: 'Références clients', file: 'ref_sogeci.pdf', provided: true },
          { type: 'Certificat qualité', provided: false },
          { type: 'Attestation régularité', provided: false },
        ],
        tender_ref: 'AO-2024-MAINT-003',
        tender_date: '2024-01-15',
        tender_result: 'selected',
        tender_justification: 'Meilleur rapport qualité/prix',
        subject_to_rotation: true,
        rotation_frequency: 'triennial',
        next_tender_date: '2027-01-15',
      },
      contract: {
        relationship_type: 'annual',
        contract_ref: 'CTR-2024-MAINT-001',
        start_date: '2024-01-01',
        end_date: '2024-12-31',
        tacit_renewal: true,
        notice_days: 90,
        contract_alert_days: 60,
        annual_amount: 96_000_000,
        monthly_amount: 8_000_000,
        billing_frequency: 'Mensuelle',
        vat_applicable: true,
        vat_rate: 18,
        payment_delay_days: 30,
        payment_base: 'invoice_receipt',
        early_payment_discount: true,
        discount_rate: 2,
        discount_delay: 10,
        late_penalty_rate: 1.5,
        payment_methods: ['Virement bancaire'],
        has_retention: true,
        retention_rate: 5,
        retention_duration_months: 12,
        retention_release_conditions: 'Levée des réserves et PV de réception définitive',
      },
      payment_profile: {
        counterparty_id: counterpartyId,
        avg_delay_days: -3.2,
        delay_std_dev: 2.1,
        full_payment_rate: 0.95,
        partial_payment_rate: 0.04,
        avg_partial_amount_pct: 0.88,
        history_months: 24,
        trend: 'stable',
        vigilance_status: 'normal',
        risk_score: 2,
        forced_delay: null,
      },
      bank_accounts: [
        {
          id: 'ba-001',
          bank_name: 'Société Générale CI',
          bank_country: 'Côte d\'Ivoire',
          iban: 'CI93 CI05 0001 0000 1234 5678 9012',
          bic_swift: 'SGCICIAB',
          account_holder: 'SOGECI MAINTENANCE SARL',
          currency: 'XOF',
          is_primary: true,
          verification_date: '2024-01-10',
          verified_by: 'DAF - M. Diallo',
          verification_method: 'Confirmation bancaire',
          verification_document: 'verif_rib_sogeci.pdf',
        },
      ],
      scorecards: [
        {
          id: 'sc-001',
          criteria: [
            { name: 'Qualité de service', score: 4 },
            { name: 'Respect des délais', score: 3 },
            { name: 'Réactivité', score: 4 },
            { name: 'Rapport qualité/prix', score: 4 },
            { name: 'Conformité documentaire', score: 5 },
            { name: 'Communication', score: 4 },
          ],
          overall_score: 4.0,
          evaluator_id: 'user-001',
          evaluation_date: '2025-12-15',
          period: '2025',
          recommendation: 'renew',
        },
      ],
      transactions: [
        { id: 'tx-001', date: '2026-03-05', type: 'invoice', reference: 'FAC-2026-0301', description: 'Maintenance climatisation Mars 2026', amount: 8_000_000, status: 'pending' },
        { id: 'tx-002', date: '2026-02-28', type: 'payment', reference: 'VIR-2026-0215', description: 'Règlement facture Février 2026', amount: 8_000_000, status: 'paid' },
        { id: 'tx-003', date: '2026-02-05', type: 'invoice', reference: 'FAC-2026-0201', description: 'Maintenance climatisation Février 2026', amount: 8_000_000, status: 'paid' },
        { id: 'tx-004', date: '2026-01-30', type: 'payment', reference: 'VIR-2026-0125', description: 'Règlement facture Janvier 2026', amount: 8_000_000, status: 'paid' },
        { id: 'tx-005', date: '2026-01-05', type: 'invoice', reference: 'FAC-2026-0101', description: 'Maintenance climatisation Janvier 2026', amount: 8_000_000, status: 'paid' },
      ],
    };
  },

  async saveSupplierFullProfile(counterpartyId: string, _profile: Partial<SupplierFullProfile>): Promise<{ success: boolean }> {
    await delay(400);
    void counterpartyId;
    return { success: true };
  },

  // ==========================================================================
  // TENANT FULL PROFILE - 10 Tabs
  // ==========================================================================

  async getTenantFullProfile(counterpartyId: string, counterpartyName?: string): Promise<TenantFullProfile> {
    await delay(300);
    const profileData = MOCK_TENANT_FULL_PROFILES[counterpartyName ?? ''] ?? MOCK_TENANT_FULL_PROFILES['ZARA CI'];
    return { ...profileData, id: counterpartyId };
  },

  async saveTenantFullProfile(counterpartyId: string, profile: Partial<TenantFullProfile>): Promise<TenantFullProfile> {
    await delay(400);
    void counterpartyId;
    void profile;
    // In production this would persist to Supabase
    const base = MOCK_TENANT_FULL_PROFILES['ZARA CI'];
    return { ...base, ...profile, id: counterpartyId };
  },
};

// =============================================================================
// MOCK TENANT FULL PROFILES
// =============================================================================

const MOCK_IDENTITY_ZARA: TenantIdentity = {
  legal_name: 'ZARA Cote d\'Ivoire SARL',
  trade_name: 'ZARA CI',
  brand_group: 'Inditex',
  brand_nationality: 'Espagne',
  legal_form: 'sarl',
  rc_number: 'CI-ABJ-2019-B-14523',
  tax_number: '1904567A',
  activity_sector: 'Commerce de detail',
  sub_sector: 'Pret-a-porter',
  primary_contact_name: 'Kouame Yao',
  primary_contact_role: 'Directeur General',
  phone_primary: '+225 07 08 09 10 11',
  email_primary: 'k.yao@zara-ci.com',
  phone_secondary: '+225 05 06 07 08 09',
  email_secondary: 'compta@zara-ci.com',
  hq_address: 'Zone 4, Rue des Jardins, Abidjan, Cote d\'Ivoire',
  employee_count: '51-200',
  annual_revenue: 2_800_000_000,
  status: 'active',
  tags: ['Ancre', 'Premium', 'International'],
  has_multiple_units: false,
  conflict_of_interest: false,
  notes: 'Locataire ancre depuis 2019. Excellent historique.',
};

const MOCK_IDENTITY_CARREFOUR: TenantIdentity = {
  legal_name: 'CARREFOUR Market Cote d\'Ivoire SA',
  trade_name: 'CARREFOUR Market',
  brand_group: 'CFAO Retail',
  brand_nationality: 'France',
  legal_form: 'sa',
  rc_number: 'CI-ABJ-2017-B-09821',
  tax_number: '1705432B',
  activity_sector: 'Grande distribution',
  sub_sector: 'Supermarche',
  primary_contact_name: 'Awa Traore',
  primary_contact_role: 'Responsable Immobilier',
  phone_primary: '+225 01 02 03 04 05',
  email_primary: 'a.traore@carrefour-ci.com',
  hq_address: 'Plateau, Bd de la Republique, Abidjan',
  employee_count: '200+',
  annual_revenue: 8_500_000_000,
  status: 'active',
  tags: ['Ancre', 'Grande Surface', 'International'],
  has_multiple_units: true,
  conflict_of_interest: false,
};

const MOCK_IDENTITY_MTN: TenantIdentity = {
  legal_name: 'MTN Cote d\'Ivoire SA',
  trade_name: 'MTN Boutique',
  brand_group: 'MTN Group',
  brand_nationality: 'Afrique du Sud',
  legal_form: 'sa',
  rc_number: 'CI-ABJ-2015-B-06712',
  tax_number: '1503298C',
  activity_sector: 'Telecommunications',
  sub_sector: 'Boutique operateur',
  primary_contact_name: 'Ibrahim Diallo',
  primary_contact_role: 'Chef de projet immobilier',
  phone_primary: '+225 07 77 88 99 00',
  email_primary: 'i.diallo@mtn.ci',
  hq_address: 'Cocody, Riviera 3, Abidjan',
  employee_count: '200+',
  annual_revenue: 450_000_000_000,
  status: 'active',
  tags: ['Telecom', 'International'],
  has_multiple_units: true,
  conflict_of_interest: false,
};

const MOCK_IDENTITY_ORANGE: TenantIdentity = {
  legal_name: 'Orange Cote d\'Ivoire SA',
  trade_name: 'Orange CI',
  brand_group: 'Orange Group',
  brand_nationality: 'France',
  legal_form: 'sa',
  rc_number: 'CI-ABJ-1996-B-00412',
  tax_number: '9600123D',
  activity_sector: 'Telecommunications',
  sub_sector: 'Boutique operateur',
  primary_contact_name: 'Marie-Louise Konan',
  primary_contact_role: 'Directrice Patrimoine',
  phone_primary: '+225 07 11 22 33 44',
  email_primary: 'ml.konan@orange.ci',
  hq_address: 'Plateau, Av. Lamblin, Abidjan',
  employee_count: '200+',
  annual_revenue: 600_000_000_000,
  status: 'active',
  tags: ['Ancre', 'Telecom', 'International'],
  has_multiple_units: true,
  conflict_of_interest: false,
};

const MOCK_IDENTITY_BANQUE: TenantIdentity = {
  legal_name: 'Banque Atlantique Cote d\'Ivoire SA',
  trade_name: 'Banque Atlantique',
  brand_group: 'Atlantic Financial Group',
  brand_nationality: 'Togo',
  legal_form: 'sa',
  rc_number: 'CI-ABJ-2005-B-03456',
  tax_number: '0503876E',
  activity_sector: 'Services financiers',
  sub_sector: 'Banque de detail',
  primary_contact_name: 'Seydou Kone',
  primary_contact_role: 'Responsable Logistique',
  phone_primary: '+225 27 20 31 45 67',
  email_primary: 's.kone@banqueatlantique.net',
  hq_address: 'Plateau, Rue du Commerce, Abidjan',
  employee_count: '200+',
  annual_revenue: 85_000_000_000,
  status: 'suspended',
  tags: ['Banque', 'Contentieux'],
  has_multiple_units: false,
  conflict_of_interest: false,
  notes: 'Loyers impayes depuis 3 mois. Procedure de recouvrement en cours.',
};

const MOCK_IDENTITY_CFAO: TenantIdentity = {
  legal_name: 'CFAO Motors Cote d\'Ivoire SA',
  trade_name: 'CFAO Motors',
  brand_group: 'CFAO Group',
  brand_nationality: 'France',
  legal_form: 'sa',
  rc_number: 'CI-ABJ-2010-B-05678',
  tax_number: '1006543F',
  activity_sector: 'Automobile',
  sub_sector: 'Concession automobile',
  primary_contact_name: 'Jean-Pierre Aka',
  primary_contact_role: 'Directeur des Operations',
  phone_primary: '+225 27 22 44 55 66',
  email_primary: 'jp.aka@cfao-motors.ci',
  hq_address: 'Marcory, Zone Industrielle, Abidjan',
  employee_count: '51-200',
  annual_revenue: 15_000_000_000,
  status: 'active',
  tags: ['Automobile', 'International', 'Premium'],
  has_multiple_units: true,
  conflict_of_interest: false,
};

function buildLeaseDetails(overrides: Partial<LeaseDetails> = {}): LeaseDetails {
  return {
    lease_type: 'commercial',
    lease_ref: 'BAIL-2024-001',
    zone: 'Zone A - Centre Commercial',
    unit_number: 'LOC-A12',
    floor: 'RDC',
    total_area: 250,
    sales_area: 220,
    signature_date: '2023-12-15',
    effective_date: '2024-01-01',
    expiry_date: '2029-12-31',
    firm_duration: 72,
    renewal_option: true,
    notice_period_months: 6,
    renewal_alert_days: 90,
    lease_document: 'bail_zara_2024.pdf',
    monthly_rent_ht: 2_500_000,
    rent_per_sqm: 10_000,
    monthly_charges_ht: 450_000,
    has_variable_rent: true,
    variable_rent_pct: 5,
    guaranteed_minimum_ca: 40_000_000,
    entry_fee: 15_000_000,
    entry_fee_date: '2024-01-15',
    has_rent_free: true,
    rent_free_months: 3,
    rent_free_start: '2024-01-01',
    rent_free_end: '2024-03-31',
    post_free_rent: 2_500_000,
    vat_applicable: true,
    vat_rate: 18,
    payment_due_day: 5,
    periodicity: 'monthly',
    payment_method: 'Virement bancaire',
    reception_account_id: 'ACC-001',
    indexation_type: 'fixed_rate',
    indexation_rate: 3.5,
    indexation_anniversary: '2025-01-01',
    next_revised_rent: 2_587_500,
    indexation_cap: 5,
    effort_ratio: 8.2,
    effort_alert_threshold: 15,
    ...overrides,
  };
}

function buildMockAmendments(): LeaseAmendment[] {
  return [
    {
      id: 'amend-001',
      amendment_number: 'AV-001',
      signature_date: '2024-06-15',
      effective_date: '2024-07-01',
      modification_types: ['Extension de surface', 'Revision loyer'],
      description: 'Extension de 30m2 supplementaires cote est. Loyer revise.',
      new_rent: 2_800_000,
      new_area: 280,
      document: 'avenant_001_zara.pdf',
      signed_by_tenant: 'Kouame Yao',
      signed_by_landlord: 'SCI Les Palmiers',
      validated_by: 'Me Toure',
    },
    {
      id: 'amend-002',
      amendment_number: 'AV-002',
      signature_date: '2025-01-10',
      effective_date: '2025-02-01',
      modification_types: ['Prolongation bail'],
      description: 'Prolongation du bail de 2 ans supplementaires jusqu\'au 31/12/2031.',
      new_expiry: '2031-12-31',
      document: 'avenant_002_zara.pdf',
      signed_by_tenant: 'Kouame Yao',
      signed_by_landlord: 'SCI Les Palmiers',
    },
  ];
}

function buildMockDeclaredRevenues(): DeclaredRevenue[] {
  const months = ['2025-01', '2025-02', '2025-03', '2024-12', '2024-11', '2024-10', '2024-09', '2024-08', '2024-07', '2024-06', '2024-05', '2024-04'];
  return months.map((period, idx) => {
    const ca = 35_000_000 + Math.round(Math.random() * 20_000_000);
    const varRent = Math.round(ca * 0.05);
    const minGuaranteed = 40_000_000 * 0.05;
    return {
      period,
      declared_ca: ca,
      verified_ca: idx < 3 ? undefined : ca - Math.round(Math.random() * 500_000),
      declaration_date: `${period}-15`,
      variable_rent_calculated: varRent,
      guaranteed_minimum: minGuaranteed,
      variable_rent_due: Math.max(varRent, minGuaranteed),
      status: idx < 2 ? 'declared' : idx < 6 ? 'verified' : 'audited',
    };
  });
}

function buildMockInstallmentPlans(): InstallmentPlan[] {
  return [
    {
      id: 'plan-001',
      plan_ref: 'ECH-2025-001',
      start_date: '2025-01-01',
      end_date: '2025-06-30',
      total_debt: 4_500_000,
      monthly_payment: 750_000,
      nb_installments: 6,
      paid_installments: 3,
      remaining_balance: 2_250_000,
      status: 'active',
      notes: 'Echelonnement accorde suite a difficulte passagere.',
    },
  ];
}

function buildMockDeposit(): DepositGuarantee {
  return {
    cash_deposit_received: 7_500_000,
    deposit_date: '2024-01-05',
    months_equivalent: 3,
    holding_account: 'Compte sequestre BNI',
    restitution_conditions: 'Restitution sous 60 jours apres etat des lieux de sortie, deduction faite des degradations.',
    entry_inspection_date: '2024-01-02',
    entry_inspection_file: 'edl_entree_zara.pdf',
    entry_inspection_notes: 'Local en parfait etat. Peinture neuve. Climatisation fonctionnelle.',
    has_damages: false,
    has_bank_guarantee: true,
    guarantee_ref: 'GAR-BNI-2024-0567',
    guarantor_bank: 'BNI (Banque Nationale d\'Investissement)',
    guarantee_amount: 15_000_000,
    guarantee_expiry: '2029-12-31',
    guarantee_renewal_alert_days: 60,
    guarantee_document: 'garantie_bancaire_zara.pdf',
  };
}

function buildMockInsurance(): TenantInsurance {
  return {
    has_rc_insurance: true,
    rc_company: 'NSIA Assurances',
    rc_policy_number: 'RC-2024-ABJ-08934',
    rc_start_date: '2024-01-01',
    rc_expiry_date: '2025-12-31',
    rc_coverage: 500_000_000,
    rc_certificate_file: 'rc_pro_zara_2024.pdf',
    rc_expiry_alert_days: 30,
    has_multirisque: true,
    mr_company: 'SUNU Assurances',
    mr_policy_number: 'MR-2024-ABJ-12345',
    mr_start_date: '2024-01-01',
    mr_expiry_date: '2025-12-31',
    mr_coverage: 1_000_000_000,
    mr_certificate_file: 'multirisque_zara_2024.pdf',
    notes: 'Attestations a jour. Prochaine echeance dec 2025.',
  };
}

function buildMockWorks(): TenantWork[] {
  return [
    {
      id: 'work-001',
      ref: 'TRV-2024-001',
      request_date: '2024-04-10',
      description: 'Amenagement vitrine exterieure - pose enseigne lumineuse LED',
      estimated_cost: 8_500_000,
      status: 'completed',
      authorization_date: '2024-04-20',
      start_date: '2024-05-01',
      expected_end_date: '2024-05-15',
      actual_end_date: '2024-05-12',
      restoration_required: true,
      documents: ['demande_travaux_001.pdf', 'plan_enseigne.pdf'],
      validated_by: 'Direction Technique',
      notes: 'Travaux conformes. Enseigne validee par la copropriete.',
    },
    {
      id: 'work-002',
      ref: 'TRV-2025-001',
      request_date: '2025-02-01',
      description: 'Installation systeme de climatisation supplementaire en reserve',
      estimated_cost: 3_200_000,
      status: 'authorized',
      authorization_date: '2025-02-15',
      restoration_required: false,
      documents: ['demande_travaux_002.pdf'],
    },
  ];
}

function buildMockTransactionHistory(): TransactionHistoryEntry[] {
  const entries: TransactionHistoryEntry[] = [];
  let balance = 0;
  const months = ['2024-01', '2024-02', '2024-03', '2024-04', '2024-05', '2024-06', '2024-07', '2024-08', '2024-09', '2024-10', '2024-11', '2024-12', '2025-01', '2025-02', '2025-03'];
  months.forEach((m, idx) => {
    // Rent charge
    balance += 2_500_000;
    entries.push({
      id: `txn-rent-${idx}`,
      date: `${m}-05`,
      type: 'rent',
      description: `Loyer ${m}`,
      amount: 2_500_000,
      balance_after: balance,
      reference: `FAC-${m}-001`,
    });
    // Charge
    balance += 450_000;
    entries.push({
      id: `txn-charge-${idx}`,
      date: `${m}-05`,
      type: 'charge',
      description: `Charges ${m}`,
      amount: 450_000,
      balance_after: balance,
      reference: `FAC-${m}-002`,
    });
    // Payment (with some variation)
    const payDelay = Math.random() > 0.85 ? 0 : 2_950_000;
    if (payDelay > 0) {
      balance -= payDelay;
      entries.push({
        id: `txn-pay-${idx}`,
        date: `${m}-${String(5 + Math.floor(Math.random() * 5)).padStart(2, '0')}`,
        type: 'rent',
        description: `Reglement ${m}`,
        amount: -payDelay,
        balance_after: balance,
        reference: `PAY-${m}-001`,
      });
    }
  });
  // Deposit
  entries.unshift({
    id: 'txn-deposit-001',
    date: '2024-01-05',
    type: 'deposit',
    description: 'Depot de garantie initial',
    amount: -7_500_000,
    balance_after: -7_500_000,
    reference: 'DEP-2024-001',
  });
  return entries.reverse();
}

function buildMockDisputes(): TenantDispute[] {
  return [
    {
      id: 'disp-001',
      ref: 'CTX-2025-001',
      opened_date: '2025-01-15',
      type: 'Impaye',
      description: 'Retard de paiement cumule de 3 mois. Mise en demeure envoyee le 15/01/2025.',
      amount_claimed: 8_850_000,
      status: 'in_progress',
      lawyer: 'Cabinet Toure & Associes',
      next_hearing_date: '2025-04-20',
      notes: 'Negociation d\'echelonnement en cours.',
    },
  ];
}

const MOCK_TENANT_FULL_PROFILES: Record<string, TenantFullProfile> = {
  'ZARA CI': {
    id: 'cp-001',
    identity: MOCK_IDENTITY_ZARA,
    lease: buildLeaseDetails(),
    amendments: buildMockAmendments(),
    declared_revenues: buildMockDeclaredRevenues(),
    installment_plans: [],
    deposit_guarantee: buildMockDeposit(),
    insurance: buildMockInsurance(),
    works: buildMockWorks(),
    transaction_history: buildMockTransactionHistory(),
    disputes: [],
  },
  'CARREFOUR Market': {
    id: 'cp-002',
    identity: MOCK_IDENTITY_CARREFOUR,
    lease: buildLeaseDetails({
      lease_ref: 'BAIL-2023-045',
      zone: 'Zone B - Hypermarche',
      unit_number: 'LOC-B01',
      total_area: 1_200,
      sales_area: 1_050,
      monthly_rent_ht: 8_500_000,
      rent_per_sqm: 7_083,
      monthly_charges_ht: 1_800_000,
      has_variable_rent: true,
      variable_rent_pct: 3,
      guaranteed_minimum_ca: 200_000_000,
      entry_fee: 50_000_000,
      lease_type: 'commercial',
    }),
    amendments: [],
    declared_revenues: buildMockDeclaredRevenues(),
    installment_plans: [],
    deposit_guarantee: { ...buildMockDeposit(), cash_deposit_received: 25_500_000, months_equivalent: 3 },
    insurance: buildMockInsurance(),
    works: [],
    transaction_history: buildMockTransactionHistory(),
    disputes: [],
  },
  'MTN Boutique': {
    id: 'cp-003',
    identity: MOCK_IDENTITY_MTN,
    lease: buildLeaseDetails({
      lease_ref: 'BAIL-2022-018',
      zone: 'Zone C - Galerie',
      unit_number: 'LOC-C05',
      total_area: 80,
      sales_area: 70,
      monthly_rent_ht: 1_200_000,
      rent_per_sqm: 15_000,
      monthly_charges_ht: 200_000,
      has_variable_rent: false,
      lease_type: 'commercial',
    }),
    amendments: [],
    declared_revenues: [],
    installment_plans: buildMockInstallmentPlans(),
    deposit_guarantee: { ...buildMockDeposit(), cash_deposit_received: 3_600_000, months_equivalent: 3 },
    insurance: buildMockInsurance(),
    works: [],
    transaction_history: buildMockTransactionHistory(),
    disputes: [],
  },
  'Orange CI': {
    id: 'cp-004',
    identity: MOCK_IDENTITY_ORANGE,
    lease: buildLeaseDetails({
      lease_ref: 'BAIL-2021-032',
      zone: 'Zone A - Centre Commercial',
      unit_number: 'LOC-A03',
      total_area: 120,
      sales_area: 100,
      monthly_rent_ht: 1_800_000,
      rent_per_sqm: 15_000,
      monthly_charges_ht: 350_000,
      has_variable_rent: false,
      lease_type: 'commercial',
    }),
    amendments: [buildMockAmendments()[0]],
    declared_revenues: [],
    installment_plans: [],
    deposit_guarantee: { ...buildMockDeposit(), cash_deposit_received: 5_400_000, months_equivalent: 3 },
    insurance: buildMockInsurance(),
    works: buildMockWorks().slice(0, 1),
    transaction_history: buildMockTransactionHistory(),
    disputes: [],
  },
  'Banque Atlantique': {
    id: 'cp-005',
    identity: MOCK_IDENTITY_BANQUE,
    lease: buildLeaseDetails({
      lease_ref: 'BAIL-2020-007',
      zone: 'Zone A - Centre Commercial',
      unit_number: 'LOC-A01',
      total_area: 300,
      sales_area: 250,
      monthly_rent_ht: 3_500_000,
      rent_per_sqm: 11_667,
      monthly_charges_ht: 650_000,
      has_variable_rent: false,
      lease_type: 'commercial',
    }),
    amendments: [],
    declared_revenues: [],
    installment_plans: buildMockInstallmentPlans(),
    deposit_guarantee: { ...buildMockDeposit(), cash_deposit_received: 10_500_000, months_equivalent: 3 },
    insurance: { ...buildMockInsurance(), has_multirisque: false },
    works: [],
    transaction_history: buildMockTransactionHistory(),
    disputes: buildMockDisputes(),
  },
  'CFAO Motors': {
    id: 'cp-006',
    identity: MOCK_IDENTITY_CFAO,
    lease: buildLeaseDetails({
      lease_ref: 'BAIL-2023-051',
      zone: 'Zone D - Parking / Showroom',
      unit_number: 'LOC-D01',
      total_area: 800,
      sales_area: 600,
      monthly_rent_ht: 6_000_000,
      rent_per_sqm: 7_500,
      monthly_charges_ht: 1_200_000,
      has_variable_rent: false,
      lease_type: 'commercial',
      entry_fee: 30_000_000,
    }),
    amendments: [],
    declared_revenues: [],
    installment_plans: [],
    deposit_guarantee: { ...buildMockDeposit(), cash_deposit_received: 18_000_000, months_equivalent: 3 },
    insurance: buildMockInsurance(),
    works: buildMockWorks(),
    transaction_history: buildMockTransactionHistory(),
    disputes: [],
  },
};
