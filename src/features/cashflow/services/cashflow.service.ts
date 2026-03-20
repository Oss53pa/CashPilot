import { supabase } from '@/config/supabase';
import type { CashFlow } from '@/types/database';
import type { CashFlowFormData, MonthlySummary, ReceivableEntry, PayableEntry } from '../types';

export const cashFlowService = {
  async list(companyId: string): Promise<CashFlow[]> {
    try {
      const { data, error } = await supabase
        .from('cash_flows')
        .select('*')
        .eq('company_id', companyId)
        .order('operation_date', { ascending: false });

      if (error) throw error;
      return data ?? [];
    } catch {
      return [];
    }
  },

  async listByType(companyId: string, type: 'receipt' | 'disbursement'): Promise<CashFlow[]> {
    try {
      const { data, error } = await supabase
        .from('cash_flows')
        .select('*')
        .eq('company_id', companyId)
        .eq('type', type)
        .order('operation_date', { ascending: false });

      if (error) throw error;
      return data ?? [];
    } catch {
      return [];
    }
  },

  async getById(id: string): Promise<CashFlow | null> {
    try {
      const { data, error } = await supabase
        .from('cash_flows')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch {
      return null;
    }
  },

  async create(companyId: string, userId: string, formData: CashFlowFormData): Promise<CashFlow> {
    const { data, error } = await supabase
      .from('cash_flows')
      .insert({
        ...formData,
        company_id: companyId,
        created_by: userId,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, formData: Partial<CashFlowFormData>): Promise<CashFlow> {
    const { data, error } = await supabase
      .from('cash_flows')
      .update(formData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('cash_flows')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async validateFlow(id: string, userId: string): Promise<CashFlow> {
    const { data, error } = await supabase
      .from('cash_flows')
      .update({ status: 'validated', validated_by: userId })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async reconcileFlow(id: string): Promise<CashFlow> {
    const { data, error } = await supabase
      .from('cash_flows')
      .update({ status: 'reconciled' })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // ── Receivables (Créances) ──
  async listReceivables(companyId: string): Promise<ReceivableEntry[]> {
    // Mock data - Ivorian business context
    return mockReceivables.filter((r) => r.company_id === companyId || companyId);
  },

  async getReceivable(id: string): Promise<ReceivableEntry | null> {
    return mockReceivables.find((r) => r.id === id) ?? null;
  },

  async createReceivable(_companyId: string, data: Partial<ReceivableEntry>): Promise<ReceivableEntry> {
    const entry: ReceivableEntry = {
      ...getDefaultReceivable(_companyId),
      ...data,
      id: crypto.randomUUID(),
      reference: `CRE-2026-${String(mockReceivables.length + 1).padStart(4, '0')}`,
    };
    mockReceivables.push(entry);
    return entry;
  },

  async updateReceivable(id: string, data: Partial<ReceivableEntry>): Promise<ReceivableEntry> {
    const idx = mockReceivables.findIndex((r) => r.id === id);
    if (idx === -1) throw new Error('Receivable not found');
    mockReceivables[idx] = { ...mockReceivables[idx], ...data };
    return mockReceivables[idx];
  },

  async deleteReceivable(id: string): Promise<void> {
    const idx = mockReceivables.findIndex((r) => r.id === id);
    if (idx !== -1) mockReceivables.splice(idx, 1);
  },

  // ── Payables (Dettes) ──
  async listPayables(companyId: string): Promise<PayableEntry[]> {
    return mockPayables.filter((p) => p.company_id === companyId || companyId);
  },

  async getPayable(id: string): Promise<PayableEntry | null> {
    return mockPayables.find((p) => p.id === id) ?? null;
  },

  async createPayable(_companyId: string, data: Partial<PayableEntry>): Promise<PayableEntry> {
    const entry: PayableEntry = {
      ...getDefaultPayable(_companyId),
      ...data,
      id: crypto.randomUUID(),
      reference: `DET-2026-${String(mockPayables.length + 1).padStart(4, '0')}`,
    };
    mockPayables.push(entry);
    return entry;
  },

  async updatePayable(id: string, data: Partial<PayableEntry>): Promise<PayableEntry> {
    const idx = mockPayables.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error('Payable not found');
    mockPayables[idx] = { ...mockPayables[idx], ...data };
    return mockPayables[idx];
  },

  async deletePayable(id: string): Promise<void> {
    const idx = mockPayables.findIndex((p) => p.id === id);
    if (idx !== -1) mockPayables.splice(idx, 1);
  },

  async getMonthlySummary(
    companyId: string,
    type: 'receipt' | 'disbursement',
    year: number,
    month: number,
  ): Promise<MonthlySummary> {
    try {
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const endMonth = month === 12 ? 1 : month + 1;
      const endYear = month === 12 ? year + 1 : year;
      const endDate = `${endYear}-${String(endMonth).padStart(2, '0')}-01`;

      const { data, error } = await supabase
        .from('cash_flows')
        .select('*')
        .eq('company_id', companyId)
        .eq('type', type)
        .gte('operation_date', startDate)
        .lt('operation_date', endDate);

      if (error) throw error;

      const flows = data ?? [];
      const pending = flows.filter((f) => f.status === 'pending');
      const validated = flows.filter((f) => f.status === 'validated');
      const reconciled = flows.filter((f) => f.status === 'reconciled');

      const totalAmount = flows.reduce((sum, f) => sum + f.amount, 0);

      return {
        total_receipts: type === 'receipt' ? totalAmount : 0,
        total_disbursements: type === 'disbursement' ? totalAmount : 0,
        net_flow: type === 'receipt' ? totalAmount : -totalAmount,
        count_pending: pending.length,
        count_validated: validated.length,
        count_reconciled: reconciled.length,
      };
    } catch {
      return {
        total_receipts: 0,
        total_disbursements: 0,
        net_flow: 0,
        count_pending: 0,
        count_validated: 0,
        count_reconciled: 0,
      };
    }
  },
};

// ── Default factories ──
function getDefaultReceivable(companyId: string): ReceivableEntry {
  return {
    reference: '',
    company_id: companyId,
    debtor_name: '',
    nature: 'fixed_rent',
    recurrence: 'one_time',
    origin: 'manual',
    amount_ht: 0,
    vat_applicable: true,
    vat_rate: 18,
    amount_vat: 0,
    amount_ttc: 0,
    partial_payments_received: 0,
    balance_ttc: 0,
    late_interest: 0,
    late_interest_computed: 0,
    recoverable_amount: 0,
    probability_pct: 100,
    discount: 0,
    periods: [],
    invoice_date: new Date().toISOString().split('T')[0],
    original_due_date: new Date().toISOString().split('T')[0],
    aging_days: 0,
    aging_bracket: '<30',
    expected_date: new Date().toISOString().split('T')[0],
    prescription_date: '',
    prescription_alert: false,
    has_installment_plan: false,
    status: 'normal',
    priority: 'normal',
    linked_dispute: false,
    payments: [],
  };
}

function getDefaultPayable(companyId: string): PayableEntry {
  return {
    reference: '',
    company_id: companyId,
    creditor_name: '',
    nature: 'supplier_invoice',
    invoice_amount_ht: 0,
    po_variance: 0,
    delivery_variance: 0,
    matching_status: 'conforming',
    amount_vat: 0,
    amount_ttc: 0,
    invoice_currency: 'XOF',
    payments_made: 0,
    balance_remaining: 0,
    has_retention: false,
    retention_amount: 0,
    net_payable_now: 0,
    late_penalties: 0,
    has_early_discount: false,
    final_net_amount: 0,
    budget_consumed: 0,
    budget_remaining: 0,
    invoice_date: new Date().toISOString().split('T')[0],
    receipt_date: new Date().toISOString().split('T')[0],
    due_date: new Date().toISOString().split('T')[0],
    current_delay: 0,
    planned_payment_date: new Date().toISOString().split('T')[0],
    priority: 'normal',
    disbursement_account_id: '',
    status: 'to_approve',
    doa_required_roles: [],
    doa_progress: [],
    is_urgent: false,
    has_letter_of_exchange: false,
    payments: [],
  };
}

// ── Mock data ──
const mockReceivables: ReceivableEntry[] = [
  {
    id: 'rec-001',
    reference: 'CRE-2026-0001',
    company_id: 'mock-company',
    debtor_id: 'dbt-001',
    debtor_name: 'SODECI - Société de Distribution d\'Eau',
    nature: 'fixed_rent',
    contract_ref: 'BAIL-2024-0012',
    recurrence: 'monthly_recurring',
    origin: 'auto_from_lease',
    amount_ht: 4_500_000,
    vat_applicable: true,
    vat_rate: 18,
    amount_vat: 810_000,
    amount_ttc: 5_310_000,
    partial_payments_received: 2_000_000,
    balance_ttc: 3_310_000,
    late_interest: 165_500,
    late_interest_rate: 12,
    late_interest_computed: 165_500,
    recoverable_amount: 3_310_000,
    probability_pct: 85,
    discount: 0,
    periods: ['2026-01', '2026-02', '2026-03'],
    invoice_ref: 'FAC-2026-0045',
    invoice_date: '2026-01-05',
    original_due_date: '2026-02-05',
    aging_days: 43,
    aging_bracket: '30-60',
    expected_date: '2026-04-15',
    reception_account_id: 'acc-001',
    prescription_date: '2031-02-05',
    prescription_alert: false,
    has_installment_plan: true,
    plan_date: '2026-03-01',
    plan_context: 'Accord amiable suite à relance téléphonique',
    plan_supervisor_id: 'usr-001',
    plan_expiry: '2026-06-30',
    installments: [
      { date: '2026-03-15', amount: 1_103_333, status: 'paid', received: 1_103_333, received_date: '2026-03-15' },
      { date: '2026-04-15', amount: 1_103_333, status: 'expected' },
      { date: '2026-05-15', amount: 1_103_334, status: 'expected' },
    ],
    status: 'late',
    status_reason: 'Retard de paiement > 30 jours',
    priority: 'high',
    responsible_id: 'usr-002',
    next_action: 'phone_call',
    next_action_date: '2026-03-22',
    reminder_template: 'reminder_2',
    linked_dispute: false,
    invoice_file: 'facture_sodeci_jan2026.pdf',
    notes: 'Locataire historique, bon payeur habituellement. Difficultés temporaires de trésorerie signalées.',
    payments: [
      { date: '2026-02-20', amount: 2_000_000, method: 'Virement bancaire', account: 'SGBCI - Compte courant', balance_after: 3_310_000, recorded_by: 'Kouadio Aya' },
    ],
  },
  {
    id: 'rec-002',
    reference: 'CRE-2026-0002',
    company_id: 'mock-company',
    debtor_id: 'dbt-002',
    debtor_name: 'Orange Côte d\'Ivoire',
    nature: 'charges',
    contract_ref: 'BAIL-2023-0008',
    recurrence: 'monthly_recurring',
    origin: 'auto_from_lease',
    amount_ht: 1_200_000,
    vat_applicable: true,
    vat_rate: 18,
    amount_vat: 216_000,
    amount_ttc: 1_416_000,
    partial_payments_received: 0,
    balance_ttc: 1_416_000,
    late_interest: 0,
    late_interest_computed: 0,
    recoverable_amount: 1_416_000,
    probability_pct: 95,
    discount: 0,
    periods: ['2026-03'],
    invoice_ref: 'FAC-2026-0067',
    invoice_date: '2026-03-01',
    original_due_date: '2026-03-31',
    aging_days: 0,
    aging_bracket: '<30',
    expected_date: '2026-03-31',
    reception_account_id: 'acc-001',
    prescription_date: '2031-03-31',
    prescription_alert: false,
    has_installment_plan: false,
    status: 'normal',
    priority: 'normal',
    linked_dispute: false,
    payments: [],
  },
  {
    id: 'rec-003',
    reference: 'CRE-2026-0003',
    company_id: 'mock-company',
    debtor_id: 'dbt-003',
    debtor_name: 'Groupe Carré d\'Or',
    nature: 'entry_fee',
    recurrence: 'one_time',
    origin: 'manual',
    amount_ht: 15_000_000,
    vat_applicable: true,
    vat_rate: 18,
    amount_vat: 2_700_000,
    amount_ttc: 17_700_000,
    partial_payments_received: 8_850_000,
    balance_ttc: 8_850_000,
    late_interest: 442_500,
    late_interest_rate: 10,
    late_interest_computed: 442_500,
    recoverable_amount: 5_000_000,
    probability_pct: 55,
    discount: 3_850_000,
    discount_reason: 'Provision pour créance douteuse - procédure contentieuse engagée',
    periods: ['2025-10'],
    invoice_ref: 'FAC-2025-0198',
    invoice_date: '2025-10-01',
    original_due_date: '2025-11-30',
    aging_days: 110,
    aging_bracket: '>90',
    expected_date: '2026-06-30',
    reception_account_id: 'acc-002',
    prescription_date: '2030-11-30',
    prescription_alert: false,
    has_installment_plan: false,
    status: 'litigation',
    status_reason: 'Mise en demeure restée sans effet. Dossier transmis au cabinet Me Touré.',
    priority: 'high',
    responsible_id: 'usr-003',
    next_action: 'formal_notice',
    next_action_date: '2026-03-25',
    reminder_template: 'lawyer_letter',
    linked_dispute: true,
    payments: [
      { date: '2025-10-15', amount: 8_850_000, method: 'Chèque', account: 'BIAO-CI - Compte courant', balance_after: 8_850_000, recorded_by: 'N\'Guessan Marc' },
    ],
  },
];

const mockPayables: PayableEntry[] = [
  {
    id: 'pay-001',
    reference: 'DET-2026-0001',
    company_id: 'mock-company',
    creditor_id: 'crd-001',
    creditor_name: 'SNEDAI - Services Numériques',
    nature: 'supplier_invoice',
    sub_nature: 'Maintenance informatique',
    purchase_order_ref: 'BC-2026-0034',
    cost_center: 'DSI',
    budget_line_ref: 'BUD-IT-2026',
    budget_consumed: 12_500_000,
    budget_remaining: 7_500_000,
    po_amount: 3_800_000,
    delivery_amount: 3_800_000,
    invoice_amount_ht: 3_800_000,
    po_variance: 0,
    delivery_variance: 0,
    matching_status: 'conforming',
    vat_deductible: 18,
    amount_vat: 684_000,
    amount_ttc: 4_484_000,
    invoice_currency: 'XOF',
    payments_made: 0,
    balance_remaining: 4_484_000,
    has_retention: true,
    retention_rate: 5,
    retention_amount: 224_200,
    net_payable_now: 4_259_800,
    late_penalties: 0,
    has_early_discount: true,
    discount_amount: 114_000,
    final_net_amount: 4_145_800,
    service_periods: ['2026-03'],
    invoice_date: '2026-03-10',
    receipt_date: '2026-03-12',
    due_date: '2026-04-12',
    current_delay: 0,
    planned_payment_date: '2026-04-10',
    priority: 'normal',
    disbursement_account_id: 'acc-001',
    status: 'approved',
    doa_required_roles: ['Trésorier', 'DAF'],
    doa_progress: [
      { role: 'Trésorier', status: 'approved', date: '2026-03-14', name: 'Bamba Seydou' },
      { role: 'DAF', status: 'approved', date: '2026-03-15', name: 'Koné Aminata' },
    ],
    is_urgent: false,
    has_letter_of_exchange: false,
    invoice_file: 'facture_snedai_mars2026.pdf',
    po_file: 'bc_034_snedai.pdf',
    delivery_file: 'bl_034_snedai.pdf',
    notes: 'Contrat de maintenance annuel. Paiement à 30 jours. Escompte 3% si paiement sous 10 jours.',
    payments: [],
  },
  {
    id: 'pay-002',
    reference: 'DET-2026-0002',
    company_id: 'mock-company',
    creditor_id: 'crd-002',
    creditor_name: 'Direction Générale des Impôts',
    nature: 'tax',
    sub_nature: 'TVA collectée T1 2026',
    budget_consumed: 45_000_000,
    budget_remaining: 15_000_000,
    invoice_amount_ht: 8_750_000,
    po_variance: 0,
    delivery_variance: 0,
    matching_status: 'conforming',
    amount_vat: 0,
    amount_ttc: 8_750_000,
    invoice_currency: 'XOF',
    payments_made: 0,
    balance_remaining: 8_750_000,
    has_retention: false,
    retention_amount: 0,
    net_payable_now: 8_750_000,
    late_penalties: 0,
    has_early_discount: false,
    final_net_amount: 8_750_000,
    service_periods: ['2026-01', '2026-02', '2026-03'],
    invoice_date: '2026-03-15',
    receipt_date: '2026-03-15',
    due_date: '2026-04-15',
    current_delay: 0,
    planned_payment_date: '2026-04-14',
    priority: 'urgent',
    disbursement_account_id: 'acc-001',
    status: 'to_approve',
    doa_required_roles: ['DAF', 'DG'],
    doa_progress: [
      { role: 'DAF', status: 'pending', name: 'Koné Aminata' },
      { role: 'DG', status: 'pending', name: 'Ouattara Ibrahim' },
    ],
    is_urgent: true,
    urgent_reason: 'Obligation fiscale - risque de pénalité en cas de retard',
    has_letter_of_exchange: false,
    notes: 'Déclaration TVA trimestrielle. Délai impératif 15 avril.',
    payments: [],
  },
  {
    id: 'pay-003',
    reference: 'DET-2026-0003',
    company_id: 'mock-company',
    creditor_id: 'crd-003',
    creditor_name: 'Bolloré Transport & Logistics',
    nature: 'supplier_invoice',
    sub_nature: 'Transport de matériaux',
    purchase_order_ref: 'BC-2026-0028',
    cost_center: 'Logistique',
    budget_line_ref: 'BUD-LOG-2026',
    budget_consumed: 22_000_000,
    budget_remaining: 8_000_000,
    po_amount: 6_200_000,
    delivery_amount: 6_500_000,
    invoice_amount_ht: 6_500_000,
    po_variance: 300_000,
    delivery_variance: 0,
    matching_status: 'po_variance',
    vat_deductible: 18,
    amount_vat: 1_170_000,
    amount_ttc: 7_670_000,
    invoice_currency: 'XOF',
    payments_made: 3_835_000,
    balance_remaining: 3_835_000,
    has_retention: false,
    retention_amount: 0,
    net_payable_now: 3_835_000,
    retention_release_date: undefined,
    late_penalties: 76_700,
    has_early_discount: false,
    final_net_amount: 3_911_700,
    service_periods: ['2026-02'],
    invoice_date: '2026-02-28',
    receipt_date: '2026-03-02',
    due_date: '2026-03-02',
    current_delay: 18,
    planned_payment_date: '2026-03-25',
    priority: 'urgent',
    disbursement_account_id: 'acc-002',
    status: 'scheduled',
    doa_required_roles: ['Trésorier', 'DAF'],
    doa_progress: [
      { role: 'Trésorier', status: 'approved', date: '2026-03-05', name: 'Bamba Seydou' },
      { role: 'DAF', status: 'approved', date: '2026-03-06', name: 'Koné Aminata' },
    ],
    is_urgent: false,
    has_letter_of_exchange: true,
    loe_ref: 'LC-2026-0012',
    loe_issue_date: '2026-03-05',
    loe_due_date: '2026-03-25',
    loe_bank: 'SGBCI',
    loe_status: 'accepted',
    invoice_file: 'facture_bollore_fev2026.pdf',
    po_file: 'bc_028_bollore.pdf',
    delivery_file: 'bl_028_bollore.pdf',
    notes: 'Écart BC/Facture de 300 000 FCFA validé par le responsable logistique (surcoût carburant). Pénalité de retard applicable.',
    payments: [
      { date: '2026-03-10', amount: 3_835_000, account: 'BIAO-CI - Compte courant', reference: 'VIR-2026-0089', retention_deducted: 0, recorded_by: 'Bamba Seydou' },
    ],
  },
];
