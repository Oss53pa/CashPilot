import { supabase } from '@/config/supabase';
import type { CashFlow } from '@/types/database';
import type { CashFlowFormData, MonthlySummary, ReceivableEntry, PayableEntry } from '../types';

export const cashFlowService = {
  async list(companyId: string): Promise<CashFlow[]> {
    const { data, error } = await supabase
      .from('cash_flows')
      .select('*')
      .eq('company_id', companyId)
      .order('operation_date', { ascending: false });

    if (error) throw error;
    return data ?? [];
  },

  async listByType(companyId: string, type: 'receipt' | 'disbursement'): Promise<CashFlow[]> {
    const { data, error } = await supabase
      .from('cash_flows')
      .select('*')
      .eq('company_id', companyId)
      .eq('type', type)
      .order('operation_date', { ascending: false });

    if (error) throw error;
    return data ?? [];
  },

  async getById(id: string): Promise<CashFlow | null> {
    const { data, error } = await supabase
      .from('cash_flows')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code === 'PGRST116') return null;
    if (error) throw error;
    return data;
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

  // ── Receivables (Creances) ──
  async listReceivables(companyId: string): Promise<ReceivableEntry[]> {
    const { data, error } = await supabase
      .from('receivables')
      .select('*')
      .eq('company_id', companyId)
      .order('invoice_date', { ascending: false });

    if (error) throw error;
    return (data ?? []) as ReceivableEntry[];
  },

  async getReceivable(id: string): Promise<ReceivableEntry | null> {
    const { data, error } = await supabase
      .from('receivables')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code === 'PGRST116') return null;
    if (error) throw error;
    return data as ReceivableEntry;
  },

  async createReceivable(companyId: string, input: Partial<ReceivableEntry>): Promise<ReceivableEntry> {
    const { data, error } = await supabase
      .from('receivables')
      .insert({ ...input, company_id: companyId })
      .select()
      .single();

    if (error) throw error;
    return data as ReceivableEntry;
  },

  async updateReceivable(id: string, input: Partial<ReceivableEntry>): Promise<ReceivableEntry> {
    const { data, error } = await supabase
      .from('receivables')
      .update(input)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as ReceivableEntry;
  },

  async deleteReceivable(id: string): Promise<void> {
    const { error } = await supabase
      .from('receivables')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // ── Payables (Dettes) ──
  async listPayables(companyId: string): Promise<PayableEntry[]> {
    const { data, error } = await supabase
      .from('payables')
      .select('*')
      .eq('company_id', companyId)
      .order('invoice_date', { ascending: false });

    if (error) throw error;
    return (data ?? []) as PayableEntry[];
  },

  async getPayable(id: string): Promise<PayableEntry | null> {
    const { data, error } = await supabase
      .from('payables')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code === 'PGRST116') return null;
    if (error) throw error;
    return data as PayableEntry;
  },

  async createPayable(companyId: string, input: Partial<PayableEntry>): Promise<PayableEntry> {
    const { data, error } = await supabase
      .from('payables')
      .insert({ ...input, company_id: companyId })
      .select()
      .single();

    if (error) throw error;
    return data as PayableEntry;
  },

  async updatePayable(id: string, input: Partial<PayableEntry>): Promise<PayableEntry> {
    const { data, error } = await supabase
      .from('payables')
      .update(input)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as PayableEntry;
  },

  async deletePayable(id: string): Promise<void> {
    const { error } = await supabase
      .from('payables')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async getMonthlySummary(
    companyId: string,
    type: 'receipt' | 'disbursement',
    year: number,
    month: number,
  ): Promise<MonthlySummary> {
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
  },
};
