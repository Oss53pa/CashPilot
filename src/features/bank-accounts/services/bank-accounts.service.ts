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
    file: File,
    format: ImportFormat,
  ): Promise<BankStatement> {
    // Upload file and process via edge function
    const fileName = `statements/${accountId}/${Date.now()}_${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from('bank-statements')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data, error } = await supabase.functions.invoke('process-bank-statement', {
      body: { account_id: accountId, file_name: fileName, format },
    });

    if (error) throw error;
    return data as BankStatement;
  },

  async getStatements(accountId: string): Promise<BankStatement[]> {
    const { data, error } = await supabase
      .from('bank_statements')
      .select('*')
      .eq('account_id', accountId)
      .order('upload_date', { ascending: false });

    if (error) throw error;
    return (data ?? []) as BankStatement[];
  },

  async getTransactions(statementId: string): Promise<BankTransaction[]> {
    const { data, error } = await supabase
      .from('bank_transactions')
      .select('*')
      .eq('statement_id', statementId)
      .order('date', { ascending: false });

    if (error) throw error;
    return (data ?? []) as BankTransaction[];
  },

  async matchTransactions(statementId: string): Promise<MatchResult[]> {
    const { data, error } = await supabase.functions.invoke('match-bank-transactions', {
      body: { statement_id: statementId },
    });

    if (error) throw error;
    return (data ?? []) as MatchResult[];
  },

  async confirmMatch(transactionId: string, flowId: string): Promise<void> {
    const { error } = await supabase
      .from('bank_transactions')
      .update({ matched_flow_id: flowId, match_status: 'matched', match_confidence: 1.0 })
      .eq('id', transactionId);

    if (error) throw error;
  },

  // --- Alert Rules ---

  async getAlertRules(accountId: string): Promise<AlertRule[]> {
    const { data, error } = await supabase
      .from('bank_alert_rules')
      .select('*')
      .eq('account_id', accountId)
      .order('type');

    if (error) throw error;
    return (data ?? []) as AlertRule[];
  },

  async createAlertRule(input: Omit<AlertRule, 'id'>): Promise<AlertRule> {
    const { data, error } = await supabase
      .from('bank_alert_rules')
      .insert(input)
      .select()
      .single();

    if (error) throw error;
    return data as AlertRule;
  },

  async updateAlertRule(id: string, input: Partial<AlertRule>): Promise<AlertRule> {
    const { data, error } = await supabase
      .from('bank_alert_rules')
      .update(input)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as AlertRule;
  },

  async deleteAlertRule(id: string): Promise<void> {
    const { error } = await supabase
      .from('bank_alert_rules')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async getActiveAlerts(companyId: string): Promise<ActiveAlert[]> {
    const { data, error } = await supabase
      .from('bank_active_alerts')
      .select('*')
      .eq('company_id', companyId)
      .order('triggered_at', { ascending: false });

    if (error) throw error;
    return (data ?? []) as ActiveAlert[];
  },

  async getBankFormats(): Promise<ImportFormatConfig[]> {
    const { data, error } = await supabase
      .from('bank_import_formats')
      .select('*')
      .order('bank_name');

    if (error) throw error;
    return (data ?? []) as ImportFormatConfig[];
  },
};
