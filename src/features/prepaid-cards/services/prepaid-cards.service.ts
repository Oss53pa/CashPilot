import { supabase } from '@/config/supabase';
import type { PrepaidCard, PrepaidCardFormData } from '../types';

export const prepaidCardsService = {
  async list(companyId: string): Promise<PrepaidCard[]> {
    const { data, error } = await supabase
      .from('prepaid_cards')
      .select('*')
      .eq('company_id', companyId)
      .order('holder_name');

    if (error) throw error;
    return data ?? [];
  },

  async getById(id: string): Promise<PrepaidCard> {
    const { data, error } = await supabase
      .from('prepaid_cards')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async create(companyId: string, formData: PrepaidCardFormData): Promise<PrepaidCard> {
    const { data, error } = await supabase
      .from('prepaid_cards')
      .insert({
        ...formData,
        company_id: companyId,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, formData: Partial<PrepaidCardFormData>): Promise<PrepaidCard> {
    const { data, error } = await supabase
      .from('prepaid_cards')
      .update(formData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('prepaid_cards')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};
