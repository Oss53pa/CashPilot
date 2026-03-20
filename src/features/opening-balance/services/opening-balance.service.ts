import { supabase } from '@/config/supabase';
import type { OpeningBalanceEntry, PriorReceivable, PriorPayable } from '../types';

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

  async getPriorReceivables(_companyId: string): Promise<PriorReceivable[]> {
    // Mock data in FCFA
    return [
      {
        id: 'recv-001',
        counterparty: 'Soci\u00e9t\u00e9 Immobili\u00e8re du Plateau',
        nature: 'loyer',
        period: '2025-T4',
        gross_amount: 15000000,
        recoverable_amount: 15000000,
        status: 'normal',
        expected_date: '2026-01-15',
        probability_pct: 95,
        notes: 'Locataire r\u00e9gulier',
      },
      {
        id: 'recv-002',
        counterparty: 'SODECI',
        nature: 'charges',
        period: '2025-12',
        gross_amount: 3500000,
        recoverable_amount: 3200000,
        status: 'late',
        expected_date: '2026-02-28',
        probability_pct: 80,
        notes: 'Retard de 30 jours',
      },
      {
        id: 'recv-003',
        counterparty: 'Groupe Awa',
        nature: 'pas_de_porte',
        period: '2025-S2',
        gross_amount: 25000000,
        recoverable_amount: 0,
        status: 'irrecoverable',
        expected_date: '2025-11-30',
        probability_pct: 0,
        notes: 'Soci\u00e9t\u00e9 en liquidation judiciaire',
      },
      {
        id: 'recv-004',
        counterparty: 'Entreprise Koffi & Fils',
        nature: 'autre',
        period: '2025-12',
        gross_amount: 8500000,
        recoverable_amount: 6000000,
        status: 'disputed',
        expected_date: '2026-03-31',
        probability_pct: 50,
        notes: 'Litige en cours sur le montant',
      },
    ];
  },

  async getPriorPayables(_companyId: string): Promise<PriorPayable[]> {
    // Mock data in FCFA
    return [
      {
        id: 'pay-001',
        counterparty: 'SODECI - Eau',
        nature: 'energy',
        amount_due: 2800000,
        original_due_date: '2025-12-31',
        planned_payment_date: '2026-01-10',
        status: 'to_pay',
        disbursement_account: 'Compte Courant SGBCI',
      },
      {
        id: 'pay-002',
        counterparty: 'Prestataire Entretien ABC',
        nature: 'maintenance',
        amount_due: 4500000,
        original_due_date: '2025-12-15',
        planned_payment_date: '2026-01-20',
        status: 'late',
        disbursement_account: 'Compte Courant BIAO',
      },
      {
        id: 'pay-003',
        counterparty: 'Salaires Novembre',
        nature: 'personnel',
        amount_due: 18500000,
        original_due_date: '2025-12-05',
        planned_payment_date: '2026-01-05',
        status: 'to_pay',
        disbursement_account: 'Compte Courant SGBCI',
      },
      {
        id: 'pay-004',
        counterparty: 'Fournisseur Mat\u00e9riel IT',
        nature: 'capex',
        amount_due: 12000000,
        original_due_date: '2025-11-30',
        planned_payment_date: '2026-02-15',
        status: 'disputed',
        disbursement_account: 'Compte Courant BOA',
      },
      {
        id: 'pay-005',
        counterparty: 'DGI - Imp\u00f4ts',
        nature: 'fiscal',
        amount_due: 7200000,
        original_due_date: '2026-01-31',
        planned_payment_date: '2026-01-31',
        status: 'to_pay',
        disbursement_account: 'Compte Courant SGBCI',
      },
    ];
  },
};
