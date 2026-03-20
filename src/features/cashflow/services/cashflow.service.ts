import { supabase } from '@/config/supabase';
import type { CashFlow } from '@/types/database';
import type { CashFlowFormData, MonthlySummary } from '../types';

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
