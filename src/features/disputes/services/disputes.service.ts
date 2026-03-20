import { supabase } from '@/config/supabase';
import type { DisputeFile } from '@/types/database';
import type { DisputeFileFormData, ExitScenario, DisputeDashboard } from '../types';

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

  // Exit Scenarios (mock data)
  async getExitScenarios(disputeId: string): Promise<ExitScenario[]> {
    const mockScenarios: Record<string, ExitScenario[]> = {
      default: [
        { id: 'es-1', dispute_id: disputeId, label: 'Gain total', probability_pct: 30, expected_amount: 15_000_000, expected_date: '2026-09-15', description: 'Jugement entierement favorable' },
        { id: 'es-2', dispute_id: disputeId, label: 'Transaction amiable', probability_pct: 45, expected_amount: 8_500_000, expected_date: '2026-06-30', description: 'Accord negociation avec contrepartie' },
        { id: 'es-3', dispute_id: disputeId, label: 'Perte partielle', probability_pct: 20, expected_amount: 3_000_000, expected_date: '2026-12-01', description: 'Condamnation partielle - recuperation minimale' },
        { id: 'es-4', dispute_id: disputeId, label: 'Perte totale', probability_pct: 5, expected_amount: 0, expected_date: '2026-12-01', description: 'Deboutement complet' },
      ],
    };
    return mockScenarios.default;
  },

  async createExitScenario(data: Omit<ExitScenario, 'id'>): Promise<ExitScenario> {
    return {
      id: `es-${Date.now()}`,
      ...data,
    };
  },

  async deleteExitScenario(_id: string): Promise<void> {
    // mock delete
  },

  // Dashboard (mock data)
  async getDisputeDashboard(_companyId: string): Promise<DisputeDashboard> {
    return {
      active_count: 7,
      total_litigated: 85_000_000,
      total_provisions: 32_500_000,
      expected_net_value: 48_750_000,
      upcoming_hearings: [
        { dispute_id: 'd-1', reference: 'LIT-2026-001', hearing_date: '2026-03-25', court: 'Tribunal de Commerce Abidjan', days_until: 5 },
        { dispute_id: 'd-2', reference: 'LIT-2026-003', hearing_date: '2026-04-02', court: 'Tribunal de Grande Instance Dakar', days_until: 13 },
        { dispute_id: 'd-3', reference: 'ARB-2026-001', hearing_date: '2026-04-10', court: 'CCJA Abidjan', days_until: 21 },
        { dispute_id: 'd-4', reference: 'LIT-2025-012', hearing_date: '2026-04-15', court: 'Cour d\'Appel Douala', days_until: 26 },
      ],
    };
  },
};
