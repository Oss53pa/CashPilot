import { supabase } from '@/config/supabase';
import type { DisputeFile } from '@/types/database';
import type { DisputeFileFormData } from '../types';

export const disputesService = {
  async list(companyId: string): Promise<DisputeFile[]> {
    try {
      const { data, error } = await supabase
        .from('dispute_files')
        .select('*')
        .eq('company_id', companyId)
        .order('opened_date', { ascending: false });

      if (error) throw error;
      return data ?? [];
    } catch {
      return [];
    }
  },

  async getById(id: string): Promise<DisputeFile | null> {
    try {
      const { data, error } = await supabase
        .from('dispute_files')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch {
      return null;
    }
  },

  async create(companyId: string, userId: string, formData: DisputeFileFormData): Promise<DisputeFile> {
    const { data, error } = await supabase
      .from('dispute_files')
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

  async update(id: string, formData: Partial<DisputeFileFormData>): Promise<DisputeFile> {
    const { data, error } = await supabase
      .from('dispute_files')
      .update(formData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('dispute_files')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};
