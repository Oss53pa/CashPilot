import { supabase } from '@/config/supabase';
import type { BankAccount } from '@/types/database';
import type {
  BankAccountFormData,
  BankStatement,
  BankTransaction,
  MatchResult,
  ImportFormat,
  AlertRule,
  ActiveAlert,
  ImportFormatConfig,
} from '../types';

export interface BalanceSummary {
  currency: string;
  total_balance: number;
  account_count: number;
}

// --- Mock data generators ---

const MOCK_BANK_FORMATS: ImportFormatConfig[] = [
  { bank_name: 'SGBCI', default_format: 'mt940', supported_formats: ['mt940', 'csv', 'excel'] },
  { bank_name: 'BICICI', default_format: 'mt940', supported_formats: ['mt940', 'camt053', 'csv'] },
  { bank_name: 'Ecobank', default_format: 'csv', supported_formats: ['csv', 'excel'] },
  { bank_name: 'SIB', default_format: 'mt940', supported_formats: ['mt940', 'csv'] },
  { bank_name: 'NSIA Banque', default_format: 'camt053', supported_formats: ['camt053', 'csv', 'excel'] },
  { bank_name: 'BOA', default_format: 'csv', supported_formats: ['csv', 'excel'] },
];

function generateMockStatements(accountId: string): BankStatement[] {
  return [
    {
      id: 'stmt-001',
      account_id: accountId,
      file_name: 'releve_sgbci_mars_2026.mt940',
      format: 'mt940',
      upload_date: '2026-03-18T10:30:00Z',
      period_start: '2026-03-01',
      period_end: '2026-03-15',
      transaction_count: 47,
      matched_count: 38,
      unmatched_count: 4,
      status: 'completed',
    },
    {
      id: 'stmt-002',
      account_id: accountId,
      file_name: 'releve_sgbci_fev_2026.mt940',
      format: 'mt940',
      upload_date: '2026-03-02T08:15:00Z',
      period_start: '2026-02-01',
      period_end: '2026-02-28',
      transaction_count: 63,
      matched_count: 61,
      unmatched_count: 0,
      status: 'completed',
    },
    {
      id: 'stmt-003',
      account_id: accountId,
      file_name: 'releve_sgbci_jan_2026.csv',
      format: 'csv',
      upload_date: '2026-02-03T14:00:00Z',
      period_start: '2026-01-01',
      period_end: '2026-01-31',
      transaction_count: 55,
      matched_count: 55,
      unmatched_count: 0,
      status: 'completed',
    },
  ];
}

function generateMockTransactions(statementId: string): BankTransaction[] {
  return [
    {
      id: 'txn-001',
      statement_id: statementId,
      date: '2026-03-15',
      value_date: '2026-03-15',
      amount: -12500000,
      reference: 'VIR-2026-03-0147',
      description: 'Paiement facture SOGECI BTP - Travaux facade',
      counterparty_name: 'SOGECI BTP',
      match_status: 'matched',
      match_confidence: 1.0,
      matched_flow_id: 'flow-001',
    },
    {
      id: 'txn-002',
      statement_id: statementId,
      date: '2026-03-14',
      value_date: '2026-03-14',
      amount: 45000000,
      reference: 'ENC-2026-03-0089',
      description: 'Encaissement loyer Tour Ivoire - Mars 2026',
      counterparty_name: 'SCI TOUR IVOIRE',
      match_status: 'matched',
      match_confidence: 1.0,
      matched_flow_id: 'flow-002',
    },
    {
      id: 'txn-003',
      statement_id: statementId,
      date: '2026-03-13',
      value_date: '2026-03-13',
      amount: -8750000,
      reference: 'VIR-2026-03-0142',
      description: 'Reglement SODECI - Eau bureaux Plateau',
      counterparty_name: 'SODECI',
      match_status: 'probable',
      match_confidence: 0.78,
      matched_flow_id: 'flow-003',
    },
    {
      id: 'txn-004',
      statement_id: statementId,
      date: '2026-03-12',
      value_date: '2026-03-12',
      amount: -3200000,
      reference: 'PRE-2026-03-0055',
      description: 'Prelevement CIE electricite',
      counterparty_name: 'CIE',
      match_status: 'probable',
      match_confidence: 0.65,
      matched_flow_id: 'flow-004',
    },
    {
      id: 'txn-005',
      statement_id: statementId,
      date: '2026-03-11',
      value_date: '2026-03-11',
      amount: -1850000,
      reference: 'CHQ-2026-03-8812',
      description: 'Cheque n.8812 - Fournitures bureau',
      counterparty_name: 'PAPETERIE ABIDJAN',
      match_status: 'unmatched',
      match_confidence: 0,
      matched_flow_id: null,
    },
    {
      id: 'txn-006',
      statement_id: statementId,
      date: '2026-03-10',
      value_date: '2026-03-10',
      amount: 22000000,
      reference: 'ENC-2026-03-0076',
      description: 'Versement client SIFCA - Contrat maintenance',
      counterparty_name: 'SIFCA SA',
      match_status: 'matched',
      match_confidence: 0.95,
      matched_flow_id: 'flow-005',
    },
    {
      id: 'txn-007',
      statement_id: statementId,
      date: '2026-03-08',
      value_date: '2026-03-09',
      amount: -5400000,
      reference: 'VIR-2026-03-0138',
      description: 'Salaires Mars 2026 - Acompte',
      counterparty_name: 'PERSONNEL',
      match_status: 'unmatched',
      match_confidence: 0,
      matched_flow_id: null,
    },
    {
      id: 'txn-008',
      statement_id: statementId,
      date: '2026-03-07',
      value_date: '2026-03-07',
      amount: -750000,
      reference: 'COM-2026-03-0012',
      description: 'Commission bancaire - Gestion compte',
      counterparty_name: 'SGBCI',
      match_status: 'probable',
      match_confidence: 0.55,
      matched_flow_id: 'flow-006',
    },
    {
      id: 'txn-009',
      statement_id: statementId,
      date: '2026-03-05',
      value_date: '2026-03-05',
      amount: 15500000,
      reference: 'ENC-2026-03-0062',
      description: 'Paiement Orange CI - Contrat telecom',
      counterparty_name: 'ORANGE CI',
      match_status: 'matched',
      match_confidence: 1.0,
      matched_flow_id: 'flow-007',
    },
    {
      id: 'txn-010',
      statement_id: statementId,
      date: '2026-03-03',
      value_date: '2026-03-03',
      amount: -2100000,
      reference: 'VIR-2026-03-0125',
      description: 'Assurance locaux NSIA - Prime Q1',
      counterparty_name: 'NSIA ASSURANCES',
      match_status: 'unmatched',
      match_confidence: 0,
      matched_flow_id: null,
    },
  ];
}

function generateMockAlertRules(accountId: string): AlertRule[] {
  return [
    {
      id: 'alert-001',
      account_id: accountId,
      type: 'min_balance',
      threshold: 5000000,
      enabled: true,
    },
    {
      id: 'alert-002',
      account_id: accountId,
      type: 'max_balance',
      threshold: 500000000,
      enabled: true,
    },
    {
      id: 'alert-003',
      account_id: accountId,
      type: 'forecast_deficit',
      threshold: 30,
      enabled: true,
    },
    {
      id: 'alert-004',
      account_id: accountId,
      type: 'no_import',
      threshold: 7,
      enabled: false,
    },
  ];
}

function generateMockActiveAlerts(): ActiveAlert[] {
  return [
    {
      id: 'active-alert-001',
      rule: { id: 'alert-001', account_id: 'acc-1', type: 'min_balance', threshold: 5000000, enabled: true },
      account_name: 'Compte Courant Exploitation',
      bank_name: 'SGBCI',
      message: 'Solde actuel (3 250 000 FCFA) inferieur au seuil minimum (5 000 000 FCFA)',
      triggered_at: '2026-03-18T08:00:00Z',
      severity: 'critical',
    },
    {
      id: 'active-alert-002',
      rule: { id: 'alert-003', account_id: 'acc-2', type: 'forecast_deficit', threshold: 30, enabled: true },
      account_name: 'Compte Projet Cocody',
      bank_name: 'BICICI',
      message: 'Deficit previsionnel de -12 500 000 FCFA dans les 30 prochains jours',
      triggered_at: '2026-03-17T14:30:00Z',
      severity: 'warning',
    },
  ];
}

export const bankAccountsService = {
  async list(companyId: string): Promise<BankAccount[]> {
    const { data, error } = await supabase
      .from('bank_accounts')
      .select('*')
      .eq('company_id', companyId)
      .order('bank_name');

    if (error) throw error;
    return data ?? [];
  },

  async getById(id: string): Promise<BankAccount> {
    const { data, error } = await supabase
      .from('bank_accounts')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async create(companyId: string, formData: BankAccountFormData): Promise<BankAccount> {
    const { data, error } = await supabase
      .from('bank_accounts')
      .insert({
        ...formData,
        company_id: companyId,
        current_balance: formData.initial_balance,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, formData: Partial<BankAccountFormData>): Promise<BankAccount> {
    const { data, error } = await supabase
      .from('bank_accounts')
      .update(formData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('bank_accounts')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async getBalanceSummary(companyId: string): Promise<BalanceSummary[]> {
    const { data, error } = await supabase
      .from('bank_accounts')
      .select('currency, current_balance')
      .eq('company_id', companyId)
      .eq('is_active', true);

    if (error) throw error;

    const summaryMap = new Map<string, BalanceSummary>();

    (data ?? []).forEach((account) => {
      const existing = summaryMap.get(account.currency);
      if (existing) {
        existing.total_balance += account.current_balance;
        existing.account_count += 1;
      } else {
        summaryMap.set(account.currency, {
          currency: account.currency,
          total_balance: account.current_balance,
          account_count: 1,
        });
      }
    });

    return Array.from(summaryMap.values());
  },

  // --- Statement Import ---

  async importStatement(
    accountId: string,
    _file: File,
    format: ImportFormat,
  ): Promise<BankStatement> {
    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const now = new Date().toISOString();
    return {
      id: `stmt-${Date.now()}`,
      account_id: accountId,
      file_name: _file.name,
      format,
      upload_date: now,
      period_start: '2026-03-01',
      period_end: '2026-03-15',
      transaction_count: 47,
      matched_count: 38,
      unmatched_count: 4,
      status: 'completed',
    };
  },

  async getStatements(accountId: string): Promise<BankStatement[]> {
    // Mock: return realistic statements
    await new Promise((resolve) => setTimeout(resolve, 300));
    return generateMockStatements(accountId);
  },

  async getTransactions(statementId: string): Promise<BankTransaction[]> {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return generateMockTransactions(statementId);
  },

  async matchTransactions(statementId: string): Promise<MatchResult[]> {
    await new Promise((resolve) => setTimeout(resolve, 800));
    const transactions = generateMockTransactions(statementId);
    return transactions
      .filter((t) => t.match_status !== 'unmatched')
      .map((t) => ({
        transaction_id: t.id,
        flow_id: t.matched_flow_id!,
        match_type:
          t.match_confidence >= 0.95
            ? 'exact_ref' as const
            : t.match_confidence >= 0.75
              ? 'exact_amount_counterparty' as const
              : t.match_confidence >= 0.6
                ? 'amount_date_range' as const
                : 'approx_amount_counterparty' as const,
        confidence: t.match_confidence,
      }));
  },

  async confirmMatch(transactionId: string, flowId: string): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 200));
    console.log(`Match confirmed: transaction ${transactionId} -> flow ${flowId}`);
  },

  // --- Alert Rules ---

  async getAlertRules(accountId: string): Promise<AlertRule[]> {
    await new Promise((resolve) => setTimeout(resolve, 200));
    return generateMockAlertRules(accountId);
  },

  async createAlertRule(data: Omit<AlertRule, 'id'>): Promise<AlertRule> {
    await new Promise((resolve) => setTimeout(resolve, 200));
    return { ...data, id: `alert-${Date.now()}` };
  },

  async updateAlertRule(id: string, data: Partial<AlertRule>): Promise<AlertRule> {
    await new Promise((resolve) => setTimeout(resolve, 200));
    const rules = generateMockAlertRules('');
    const existing = rules[0];
    return { ...existing, ...data, id };
  },

  async deleteAlertRule(id: string): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 200));
    console.log(`Alert rule ${id} deleted`);
  },

  async getActiveAlerts(_companyId: string): Promise<ActiveAlert[]> {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return generateMockActiveAlerts();
  },

  getBankFormats(): ImportFormatConfig[] {
    return MOCK_BANK_FORMATS;
  },
};
