import { supabase } from '@/config/supabase';
import type { DisputeFile } from '@/types/database';
import type { DisputeFileFormData, ExitScenario, DisputeDashboard } from '../types';

export const disputesService = {
  async list(companyId: string): Promise<DisputeFile[]> {
    const { data, error } = await supabase
      .from('dispute_files')
      .select('*')
      .eq('company_id', companyId)
      .order('opened_date', { ascending: false });

    if (error) throw error;
    return data ?? [];
  },

  async getById(id: string): Promise<DisputeFile | null> {
    const { data, error } = await supabase
      .from('dispute_files')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
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

  // Exit Scenarios
  async getExitScenarios(disputeId: string): Promise<ExitScenario[]> {
    const { data, error } = await supabase
      .from('exit_scenarios')
      .select('*')
      .eq('dispute_id', disputeId)
      .order('probability_pct', { ascending: false });

    if (error) throw error;
    return (data ?? []) as ExitScenario[];
  },

  async createExitScenario(scenarioData: Omit<ExitScenario, 'id'>): Promise<ExitScenario> {
    const { data, error } = await supabase
      .from('exit_scenarios')
      .insert(scenarioData)
      .select()
      .single();

    if (error) throw error;
    return data as ExitScenario;
  },

  async deleteExitScenario(id: string): Promise<void> {
    const { error } = await supabase
      .from('exit_scenarios')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Dashboard — computed from real dispute data
  async getDisputeDashboard(companyId: string): Promise<DisputeDashboard> {
    const { data: disputes, error } = await supabase
      .from('dispute_files')
      .select('*')
      .eq('company_id', companyId)
      .in('status', ['open', 'in_progress']);

    if (error) throw error;

    const activeDisputes = disputes ?? [];
    const activeCount = activeDisputes.length;
    const totalLitigated = activeDisputes.reduce((sum, d) => sum + d.amount_disputed, 0);
    const totalProvisions = activeDisputes.reduce((sum, d) => sum + d.amount_provision, 0);

    // Expected net value: sum of (amount * probability) for each dispute
    const expectedNetValue = activeDisputes.reduce((sum, d) => {
      const probability = (d.probability ?? 50) / 100;
      return sum + d.amount_disputed * probability;
    }, 0);

    // Upcoming hearings
    const today = new Date();
    const upcomingHearings = activeDisputes
      .filter((d) => d.next_hearing && new Date(d.next_hearing) >= today)
      .map((d) => {
        const hearingDate = new Date(d.next_hearing!);
        const daysUntil = Math.ceil(
          (hearingDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
        );
        return {
          dispute_id: d.id,
          reference: d.reference,
          hearing_date: d.next_hearing!,
          court: d.court ?? '',
          days_until: daysUntil,
        };
      })
      .sort((a, b) => a.days_until - b.days_until);

    return {
      active_count: activeCount,
      total_litigated: totalLitigated,
      total_provisions: totalProvisions,
      expected_net_value: Math.round(expectedNetValue),
      upcoming_hearings: upcomingHearings,
    };
  },
};
