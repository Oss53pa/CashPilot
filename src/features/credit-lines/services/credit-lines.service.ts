import { supabase } from '@/config/supabase';
import type { CreditLine, CreditLineFormData } from '../types';

export const creditLinesService = {
  async list(companyId: string): Promise<CreditLine[]> {
    const { data, error } = await supabase
      .from('credit_lines')
      .select('*')
      .eq('company_id', companyId)
      .order('bank_name');

    if (error) throw error;
    return data ?? [];
  },

  async getById(id: string): Promise<CreditLine> {
    const { data, error } = await supabase
      .from('credit_lines')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async create(companyId: string, formData: CreditLineFormData): Promise<CreditLine> {
    const { data, error } = await supabase
      .from('credit_lines')
      .insert({
        ...formData,
        company_id: companyId,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, formData: Partial<CreditLineFormData>): Promise<CreditLine> {
    const { data, error } = await supabase
      .from('credit_lines')
      .update(formData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('credit_lines')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};
