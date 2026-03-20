import { supabase } from '@/config/supabase';
import type {
  OpeningBalanceEntry,
  OpeningBalanceHeader,
  BankOpeningBalance,
  TaxOpeningBalance,
  OpeningInvestment,
  OpeningLoan,
  PriorReceivable,
  PriorPayable,
  ApprovalStep,
  FullOpeningBalanceData,
} from '../types';

export const openingBalanceService = {
  async getOpeningBalances(companyId: string, fiscalYear?: number) {
    let query = supabase
      .from('opening_balances')
      .select('*, bank_accounts(id, bank_name, account_name, currency)')
      .eq('company_id', companyId);

    if (fiscalYear) {
      query = query.eq('fiscal_year', fiscalYear);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async setOpeningBalances(
    companyId: string,
    fiscalYear: number,
    entries: OpeningBalanceEntry[]
  ) {
    const rows = entries.map((entry) => ({
      company_id: companyId,
      fiscal_year: fiscalYear,
      account_id: entry.account_id,
      balance: entry.balance,
      as_of_date: entry.as_of_date,
    }));

    const { data, error } = await supabase
      .from('opening_balances')
      .upsert(rows, { onConflict: 'company_id,account_id,fiscal_year' })
      .select();
    if (error) throw error;
    return data;
  },

  async getBankAccounts(companyId: string) {
    const { data, error } = await supabase
      .from('bank_accounts')
      .select('*')
      .eq('company_id', companyId)
      .eq('is_active', true)
      .order('bank_name');
    if (error) throw error;
    return data;
  },

  async saveFullOpeningBalance(
    _companyId: string,
    _data: FullOpeningBalanceData
  ): Promise<{ success: boolean }> {
    // TODO: Implement full persistence
    return { success: true };
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Mock data generators
  // ─────────────────────────────────────────────────────────────────────────

  async getDefaultHeader(companyId: string): Promise<OpeningBalanceHeader> {
    return {
      company_id: companyId,
      opening_date: '2026-01-01',
      fiscal_year: 2026,
      opening_type: 'fiscal_year_start',
      certified_by: '',
      notes: '',
    };
  },

  async getBankOpeningBalances(_companyId: string): Promise<BankOpeningBalance[]> {
    return [
      {
        account_id: 'acc-sgbci-001',
        accounting_balance: 145_800_000,
        bank_balance: 148_250_000,
        variance: 2_450_000,
        variance_reason: 'Chèques émis non encore débités (3 chèques)',
        checks_issued_pending: 2_450_000,
        checks_received_pending: 850_000,
        transfers_out_pending: 0,
        transfers_in_pending: 1_200_000,
        available_balance: 147_850_000,
        statement_date: '2025-12-31',
      },
      {
        account_id: 'acc-biao-001',
        accounting_balance: 67_500_000,
        bank_balance: 67_500_000,
        variance: 0,
        checks_issued_pending: 0,
        checks_received_pending: 0,
        transfers_out_pending: 0,
        transfers_in_pending: 0,
        available_balance: 67_500_000,
        statement_date: '2025-12-31',
      },
      {
        account_id: 'acc-boa-001',
        accounting_balance: 32_100_000,
        bank_balance: 33_600_000,
        variance: 1_500_000,
        variance_reason: 'Virement reçu non comptabilisé',
        checks_issued_pending: 0,
        checks_received_pending: 0,
        transfers_out_pending: 500_000,
        transfers_in_pending: 2_000_000,
        available_balance: 35_100_000,
        statement_date: '2025-12-31',
      },
    ];
  },

  async getTaxOpeningBalance(_companyId: string): Promise<TaxOpeningBalance> {
    return {
      vat_collected_undeclared: 8_750_000,
      vat_deductible_pending: 3_200_000,
      corporate_tax_prepaid: 15_000_000,
      corporate_tax_remaining: 12_500_000,
      other_tax_liabilities: 2_800_000,
      tax_receivables: 4_500_000,
    };
  },

  async getOpeningInvestments(_companyId: string): Promise<OpeningInvestment[]> {
    return [
      {
        id: 'inv-001',
        instrument: 'term_deposit',
        institution: 'SGBCI',
        amount: 50_000_000,
        rate: 5.25,
        start_date: '2025-09-01',
        maturity_date: '2026-03-01',
        accrued_interest: 875_000,
        repatriation_account_id: 'acc-sgbci-001',
      },
      {
        id: 'inv-002',
        instrument: 'treasury_bill',
        institution: 'BCEAO',
        amount: 100_000_000,
        rate: 6.50,
        start_date: '2025-07-15',
        maturity_date: '2026-07-15',
        accrued_interest: 2_979_167,
        repatriation_account_id: 'acc-biao-001',
      },
      {
        id: 'inv-003',
        instrument: 'money_market',
        institution: 'BOA Capital',
        amount: 25_000_000,
        rate: 4.00,
        start_date: '2025-11-01',
        maturity_date: '2026-05-01',
        accrued_interest: 166_667,
        repatriation_account_id: 'acc-boa-001',
      },
    ];
  },

  async getOpeningLoans(_companyId: string): Promise<OpeningLoan[]> {
    return [
      {
        id: 'loan-001',
        reference: 'PRET-SGBCI-2024-0045',
        lender: 'SGBCI',
        initial_capital: 500_000_000,
        outstanding_capital: 375_000_000,
        next_payment_date: '2026-01-31',
        next_payment_amount: 14_583_333,
      },
      {
        id: 'loan-002',
        reference: 'PRET-BOA-2025-0012',
        lender: 'BOA Côte d\'Ivoire',
        initial_capital: 200_000_000,
        outstanding_capital: 180_000_000,
        next_payment_date: '2026-02-15',
        next_payment_amount: 5_555_556,
      },
    ];
  },

  async getPriorReceivables(_companyId: string): Promise<PriorReceivable[]> {
    return [
      {
        id: 'recv-001',
        debtor_name: 'Société Immobilière du Plateau',
        nature: 'rent',
        periods: ['2025-11', '2025-12'],
        invoice_ref: 'FAC-2025-0234',
        amount_ht: 12_711_864,
        vat_rate: 18,
        amount_ttc: 15_000_000,
        partial_payments: 0,
        balance_ttc: 15_000_000,
        late_interest: 0,
        late_interest_rate: 10,
        recoverable_amount: 15_000_000,
        probability_pct: 95,
        status: 'normal',
        original_due_date: '2025-12-05',
        expected_date: '2026-01-15',
        has_installment_plan: false,
        prescription_date: '2030-12-05',
        reception_account_id: 'acc-sgbci-001',
        notes: 'Locataire régulier, paiement attendu janvier',
      },
      {
        id: 'recv-002',
        debtor_name: 'SODECI',
        nature: 'charges',
        periods: ['2025-12'],
        invoice_ref: 'FAC-2025-0267',
        amount_ht: 2_966_102,
        vat_rate: 18,
        amount_ttc: 3_500_000,
        partial_payments: 300_000,
        balance_ttc: 3_200_000,
        late_interest: 53_333,
        late_interest_rate: 10,
        recoverable_amount: 3_253_333,
        probability_pct: 80,
        status: 'late',
        original_due_date: '2025-11-30',
        expected_date: '2026-02-28',
        has_installment_plan: false,
        prescription_date: '2030-11-30',
        reception_account_id: 'acc-sgbci-001',
        notes: 'Retard de 30 jours, relance effectuée',
      },
      {
        id: 'recv-003',
        debtor_name: 'Groupe Awa International',
        nature: 'deposit',
        periods: ['2025-S2'],
        invoice_ref: 'FAC-2025-0198',
        amount_ht: 21_186_441,
        vat_rate: 18,
        amount_ttc: 25_000_000,
        partial_payments: 0,
        balance_ttc: 25_000_000,
        late_interest: 0,
        recoverable_amount: 0,
        probability_pct: 0,
        status: 'irrecoverable',
        original_due_date: '2025-06-30',
        expected_date: '2025-11-30',
        has_installment_plan: false,
        prescription_date: '2030-06-30',
        notes: 'Société en liquidation judiciaire - provision 100%',
      },
      {
        id: 'recv-004',
        debtor_name: 'Entreprise Koffi & Fils',
        nature: 'regularization',
        periods: ['2025-10', '2025-11', '2025-12'],
        invoice_ref: 'FAC-2025-0245',
        amount_ht: 7_203_390,
        vat_rate: 18,
        amount_ttc: 8_500_000,
        partial_payments: 2_500_000,
        balance_ttc: 6_000_000,
        late_interest: 125_000,
        late_interest_rate: 10,
        recoverable_amount: 6_125_000,
        probability_pct: 50,
        status: 'disputed',
        original_due_date: '2025-10-15',
        expected_date: '2026-03-31',
        has_installment_plan: false,
        prescription_date: '2030-10-15',
        linked_dispute: true,
        notes: 'Litige en cours sur le montant des charges',
      },
      {
        id: 'recv-005',
        debtor_name: 'Pharmacie du Commerce',
        nature: 'rent',
        periods: ['2025-10', '2025-11', '2025-12'],
        invoice_ref: 'FAC-2025-0251',
        amount_ht: 5_084_746,
        vat_rate: 18,
        amount_ttc: 6_000_000,
        partial_payments: 2_000_000,
        balance_ttc: 4_000_000,
        late_interest: 200_000,
        late_interest_rate: 10,
        recoverable_amount: 4_200_000,
        probability_pct: 70,
        status: 'litigation',
        original_due_date: '2025-09-30',
        expected_date: '2026-06-30',
        has_installment_plan: true,
        installment_schedule: [
          { date: '2026-02-28', amount: 1_400_000 },
          { date: '2026-04-30', amount: 1_400_000 },
          { date: '2026-06-30', amount: 1_400_000 },
        ],
        prescription_date: '2030-09-30',
        reception_account_id: 'acc-biao-001',
        notes: 'Procédure contentieuse, plan d\'échéancement proposé',
      },
    ];
  },

  async getPriorPayables(_companyId: string): Promise<PriorPayable[]> {
    return [
      {
        id: 'pay-001',
        creditor_name: 'SODECI - Eau',
        nature: 'supplier_invoice',
        invoice_ref: 'FSOD-2025-4521',
        amount_ht: 2_372_881,
        vat_deductible: 427_119,
        amount_ttc: 2_800_000,
        payments_made: 0,
        balance_remaining: 2_800_000,
        has_retention: false,
        original_due_date: '2025-12-31',
        current_delay: 0,
        late_penalties: 0,
        planned_payment_date: '2026-01-10',
        priority: 'urgent',
        disbursement_account_id: 'acc-sgbci-001',
        notes: 'Facture eau Q4 2025',
      },
      {
        id: 'pay-002',
        creditor_name: 'Prestataire Entretien ABC',
        nature: 'supplier_invoice',
        invoice_ref: 'FABC-2025-0089',
        amount_ht: 3_813_559,
        vat_deductible: 686_441,
        amount_ttc: 4_500_000,
        payments_made: 0,
        balance_remaining: 4_500_000,
        has_retention: true,
        retention_amount: 450_000,
        original_due_date: '2025-12-15',
        current_delay: 16,
        late_penalties: 18_750,
        planned_payment_date: '2026-01-20',
        priority: 'normal',
        disbursement_account_id: 'acc-biao-001',
        notes: 'Retenue de garantie 10% - mainlevée mars 2026',
      },
      {
        id: 'pay-003',
        creditor_name: 'Personnel - Salaires Décembre',
        nature: 'salary',
        amount_ht: 18_500_000,
        amount_ttc: 18_500_000,
        payments_made: 0,
        balance_remaining: 18_500_000,
        has_retention: false,
        original_due_date: '2025-12-31',
        current_delay: 0,
        late_penalties: 0,
        planned_payment_date: '2026-01-05',
        priority: 'urgent',
        disbursement_account_id: 'acc-sgbci-001',
        notes: 'Salaires et charges sociales décembre 2025',
      },
      {
        id: 'pay-004',
        creditor_name: 'Fournisseur Matériel IT',
        nature: 'capex',
        invoice_ref: 'FIT-2025-0034',
        amount_ht: 10_169_492,
        vat_deductible: 1_830_508,
        amount_ttc: 12_000_000,
        payments_made: 3_000_000,
        balance_remaining: 9_000_000,
        has_retention: false,
        original_due_date: '2025-11-30',
        current_delay: 31,
        late_penalties: 75_000,
        planned_payment_date: '2026-02-15',
        priority: 'deferrable',
        disbursement_account_id: 'acc-boa-001',
        notes: 'Litige sur conformité livraison partielle',
      },
      {
        id: 'pay-005',
        creditor_name: 'DGI - Impôts locaux',
        nature: 'tax',
        amount_ht: 7_200_000,
        amount_ttc: 7_200_000,
        payments_made: 0,
        balance_remaining: 7_200_000,
        has_retention: false,
        original_due_date: '2026-01-31',
        current_delay: 0,
        late_penalties: 0,
        planned_payment_date: '2026-01-31',
        priority: 'urgent',
        disbursement_account_id: 'acc-sgbci-001',
        notes: 'Impôt foncier et patente 2026',
      },
      {
        id: 'pay-006',
        creditor_name: 'Ancien locataire Diallo',
        nature: 'deposit_return',
        amount_ht: 3_000_000,
        amount_ttc: 3_000_000,
        payments_made: 0,
        balance_remaining: 3_000_000,
        has_retention: false,
        original_due_date: '2026-01-15',
        current_delay: 0,
        late_penalties: 0,
        planned_payment_date: '2026-01-15',
        priority: 'normal',
        disbursement_account_id: 'acc-biao-001',
        notes: 'Restitution caution après état des lieux',
      },
      {
        id: 'pay-007',
        creditor_name: 'SGBCI - Emprunt',
        nature: 'loan_repayment',
        amount_ht: 14_583_333,
        amount_ttc: 14_583_333,
        payments_made: 0,
        balance_remaining: 14_583_333,
        has_retention: false,
        original_due_date: '2026-01-31',
        current_delay: 0,
        late_penalties: 0,
        planned_payment_date: '2026-01-31',
        priority: 'urgent',
        disbursement_account_id: 'acc-sgbci-001',
        notes: 'Échéance mensuelle prêt PRET-SGBCI-2024-0045',
      },
    ];
  },

  async getApprovalSteps(_companyId: string): Promise<ApprovalStep[]> {
    return [
      {
        role: 'tresorier',
        label: 'Trésorier',
        status: 'pending',
      },
      {
        role: 'daf',
        label: 'Directeur Administratif et Financier',
        status: 'pending',
      },
      {
        role: 'dg',
        label: 'Directeur Général / DGA',
        status: 'pending',
      },
    ];
  },
};
