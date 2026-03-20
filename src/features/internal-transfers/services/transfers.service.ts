import { supabase } from '@/config/supabase';
import type { InternalTransfer } from '@/types/database';
import type { InternalTransferFormData } from '../types';

export const transfersService = {
  async list(companyId: string): Promise<InternalTransfer[]> {
    try {
      const { data, error } = await supabase
        .from('internal_transfers')
        .select('*')
        .eq('company_id', companyId)
        .order('execution_date', { ascending: false });

      if (error) throw error;
      return data ?? [];
    } catch {
      return [];
    }
  },

  async getById(id: string): Promise<InternalTransfer | null> {
    try {
      const { data, error } = await supabase
        .from('internal_transfers')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch {
      return null;
    }
  },

  async create(companyId: string, userId: string, formData: InternalTransferFormData): Promise<InternalTransfer> {
    const { data, error } = await supabase
      .from('internal_transfers')
      .insert({
        ...formData,
        company_id: companyId,
        created_by: userId,
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, formData: Partial<InternalTransferFormData>): Promise<InternalTransfer> {
    const { data, error } = await supabase
      .from('internal_transfers')
      .update(formData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('internal_transfers')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async execute(id: string): Promise<InternalTransfer> {
    const { data, error } = await supabase
      .from('internal_transfers')
      .update({ status: 'executed' })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async cancel(id: string): Promise<InternalTransfer> {
    const { data, error } = await supabase
      .from('internal_transfers')
      .update({ status: 'cancelled' })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};
