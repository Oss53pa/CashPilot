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
    return data ?? [];
  },

  async setOpeningBalances(
    companyId: string,
    fiscalYear: number,
    entries: OpeningBalanceEntry[],
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
    return data ?? [];
  },

  async getBankAccounts(companyId: string) {
    const { data, error } = await supabase
      .from('bank_accounts')
      .select('*')
      .eq('company_id', companyId)
      .eq('is_active', true)
      .order('bank_name');
    if (error) throw error;
    return data ?? [];
  },

  async saveFullOpeningBalance(
    companyId: string,
    fullData: FullOpeningBalanceData,
  ): Promise<{ success: boolean }> {
    // Save header
    const { error: headerError } = await supabase
      .from('opening_balance_headers')
      .upsert(
        {
          company_id: companyId,
          opening_date: fullData.header.opening_date,
          fiscal_year: fullData.header.fiscal_year,
          opening_type: fullData.header.opening_type,
          certified_by: fullData.header.certified_by ?? null,
          notes: fullData.header.notes ?? null,
        },
        { onConflict: 'company_id,fiscal_year' },
      );
    if (headerError) throw headerError;

    // Save bank balances
    if (fullData.bank_balances.length > 0) {
      const bankRows = fullData.bank_balances.map((b) => ({
        company_id: companyId,
        fiscal_year: fullData.header.fiscal_year,
        account_id: b.account_id,
        accounting_balance: b.accounting_balance,
        bank_balance: b.bank_balance,
        variance: b.variance,
        variance_reason: b.variance_reason ?? null,
        checks_issued_pending: b.checks_issued_pending,
        checks_received_pending: b.checks_received_pending,
        transfers_out_pending: b.transfers_out_pending,
        transfers_in_pending: b.transfers_in_pending,
        available_balance: b.available_balance,
        statement_date: b.statement_date,
      }));

      const { error } = await supabase
        .from('opening_bank_balances')
        .upsert(bankRows, { onConflict: 'company_id,fiscal_year,account_id' });
      if (error) throw error;
    }

    return { success: true };
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Data loaders — query real Supabase tables
  // ─────────────────────────────────────────────────────────────────────────

  async getDefaultHeader(companyId: string): Promise<OpeningBalanceHeader> {
    const currentYear = new Date().getFullYear();

    const { data } = await supabase
      .from('opening_balance_headers')
      .select('*')
      .eq('company_id', companyId)
      .eq('fiscal_year', currentYear)
      .maybeSingle();

    if (data) {
      return {
        company_id: data.company_id,
        opening_date: data.opening_date,
        fiscal_year: data.fiscal_year,
        opening_type: data.opening_type,
        certified_by: data.certified_by ?? '',
        notes: data.notes ?? '',
      };
    }

    return {
      company_id: companyId,
      opening_date: `${currentYear}-01-01`,
      fiscal_year: currentYear,
      opening_type: 'fiscal_year_start',
      certified_by: '',
      notes: '',
    };
  },

  async getBankOpeningBalances(companyId: string): Promise<BankOpeningBalance[]> {
    const currentYear = new Date().getFullYear();

    // Try to load from opening_bank_balances table
    const { data: savedBalances } = await supabase
      .from('opening_bank_balances')
      .select('*')
      .eq('company_id', companyId)
      .eq('fiscal_year', currentYear);

    if (savedBalances && savedBalances.length > 0) {
      return savedBalances as BankOpeningBalance[];
    }

    // Fallback: build from bank_accounts with zero variances
    const accounts = await this.getBankAccounts(companyId);
    return accounts.map((a) => ({
      account_id: a.id,
      accounting_balance: a.initial_balance ?? 0,
      bank_balance: a.initial_balance ?? 0,
      variance: 0,
      checks_issued_pending: 0,
      checks_received_pending: 0,
      transfers_out_pending: 0,
      transfers_in_pending: 0,
      available_balance: a.initial_balance ?? 0,
      statement_date: `${currentYear - 1}-12-31`,
    }));
  },

  async getTaxOpeningBalance(companyId: string): Promise<TaxOpeningBalance> {
    // Query tax obligations for the company to compute opening tax position
    const { data: taxObligations } = await supabase
      .from('tax_obligations')
      .select('type, amount, status')
      .eq('company_id', companyId);

    const obligations = taxObligations ?? [];

    const vatCollected = obligations
      .filter((t) => t.type === 'vat' && t.status === 'upcoming')
      .reduce((s, t) => s + t.amount, 0);
    const corporateTaxPrepaid = obligations
      .filter((t) => t.type === 'corporate_tax' && t.status === 'paid')
      .reduce((s, t) => s + t.amount, 0);
    const corporateTaxRemaining = obligations
      .filter((t) => t.type === 'corporate_tax' && t.status === 'upcoming')
      .reduce((s, t) => s + t.amount, 0);
    const otherTax = obligations
      .filter((t) => !['vat', 'corporate_tax'].includes(t.type) && t.status === 'upcoming')
      .reduce((s, t) => s + t.amount, 0);

    return {
      vat_collected_undeclared: vatCollected,
      vat_deductible_pending: 0,
      corporate_tax_prepaid: corporateTaxPrepaid,
      corporate_tax_remaining: corporateTaxRemaining,
      other_tax_liabilities: otherTax,
      tax_receivables: 0,
    };
  },

  async getOpeningInvestments(companyId: string): Promise<OpeningInvestment[]> {
    const { data, error } = await supabase
      .from('investments')
      .select('*')
      .eq('company_id', companyId)
      .eq('status', 'active')
      .order('maturity_date', { ascending: true });

    if (error) throw error;

    return (data ?? []).map((inv) => {
      // Compute accrued interest
      const startDate = new Date(inv.start_date);
      const now = new Date();
      const daysElapsed = Math.max(0, (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const accruedInterest = Math.round(inv.amount * (inv.interest_rate / 100) * (daysElapsed / 365));

      return {
        id: inv.id,
        instrument: inv.type as OpeningInvestment['instrument'],
        institution: inv.institution,
        amount: inv.amount,
        rate: inv.interest_rate,
        start_date: inv.start_date,
        maturity_date: inv.maturity_date,
        accrued_interest: accruedInterest,
        repatriation_account_id: '', // Would need a field on the investments table
      };
    });
  },

  async getOpeningLoans(companyId: string): Promise<OpeningLoan[]> {
    const { data, error } = await supabase
      .from('debt_contracts')
      .select('*')
      .eq('company_id', companyId)
      .eq('status', 'active')
      .order('maturity_date', { ascending: true });

    if (error) throw error;

    return (data ?? []).map((loan) => {
      // Estimate next payment
      const freq = loan.payment_frequency;
      const monthsToAdd = freq === 'monthly' ? 1 : freq === 'quarterly' ? 3 : freq === 'semi_annual' ? 6 : 12;
      const now = new Date();
      const nextPaymentDate = new Date(now.getFullYear(), now.getMonth() + monthsToAdd, 1);
      const monthlyRate = loan.interest_rate / 100 / 12;
      const paymentAmount = loan.outstanding_amount > 0
        ? Math.round(loan.outstanding_amount * monthlyRate * monthsToAdd + loan.outstanding_amount / 60)
        : 0;

      return {
        id: loan.id,
        reference: loan.contract_reference,
        lender: loan.lender,
        initial_capital: loan.principal_amount,
        outstanding_capital: loan.outstanding_amount,
        next_payment_date: nextPaymentDate.toISOString().split('T')[0],
        next_payment_amount: paymentAmount,
      };
    });
  },

  async getPriorReceivables(companyId: string): Promise<PriorReceivable[]> {
    // Query from a prior_receivables table if it exists, otherwise return empty
    const { data, error } = await supabase
      .from('prior_receivables')
      .select('*')
      .eq('company_id', companyId)
      .order('original_due_date', { ascending: true });

    if (error) {
      // Table may not exist yet; return empty
      return [];
    }
    return (data ?? []) as PriorReceivable[];
  },

  async getPriorPayables(companyId: string): Promise<PriorPayable[]> {
    // Query from a prior_payables table if it exists, otherwise return empty
    const { data, error } = await supabase
      .from('prior_payables')
      .select('*')
      .eq('company_id', companyId)
      .order('original_due_date', { ascending: true });

    if (error) {
      // Table may not exist yet; return empty
      return [];
    }
    return (data ?? []) as PriorPayable[];
  },

  async getApprovalSteps(companyId: string): Promise<ApprovalStep[]> {
    // Query from opening_balance_approvals table if it exists
    const { data, error } = await supabase
      .from('opening_balance_approvals')
      .select('*')
      .eq('company_id', companyId)
      .order('role', { ascending: true });

    if (error) {
      // Table may not exist yet; return default steps
      return [
        { role: 'tresorier', label: 'Trésorier', status: 'pending' },
        { role: 'daf', label: 'Directeur Administratif et Financier', status: 'pending' },
        { role: 'dg', label: 'Directeur Général / DGA', status: 'pending' },
      ];
    }

    if ((data ?? []).length === 0) {
      return [
        { role: 'tresorier', label: 'Trésorier', status: 'pending' },
        { role: 'daf', label: 'Directeur Administratif et Financier', status: 'pending' },
        { role: 'dg', label: 'Directeur Général / DGA', status: 'pending' },
      ];
    }

    return (data ?? []) as ApprovalStep[];
  },
};
