import { supabase } from '@/config/supabase';
import type {
  Transfer,
  TransferFormData,
  TransferFilters,
  TransferSummary,
  TransitAccount,
  IntercompanyFlow,
} from '../types';

export const transfersService = {
  async getTransfers(companyId: string, filters?: TransferFilters): Promise<Transfer[]> {
    let query = supabase
      .from('internal_transfers')
      .select('*')
      .eq('company_id', companyId)
      .order('transfer_date', { ascending: false });

    if (filters?.transfer_type) {
      query = query.eq('transfer_type', filters.transfer_type);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.date_from) {
      query = query.gte('transfer_date', filters.date_from);
    }
    if (filters?.date_to) {
      query = query.lte('transfer_date', filters.date_to);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data ?? [];
  },

  async getTransferById(id: string): Promise<Transfer> {
    const { data, error } = await supabase
      .from('internal_transfers')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async createTransfer(companyId: string, formData: TransferFormData, userId: string): Promise<Transfer> {
    const { data, error } = await supabase
      .from('internal_transfers')
      .insert({
        ...formData,
        company_id: companyId,
        initiated_by: userId,
        status: 'draft',
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateTransfer(id: string, formData: Partial<TransferFormData>): Promise<Transfer> {
    const { data, error } = await supabase
      .from('internal_transfers')
      .update(formData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async validateTransfer(id: string, userId: string): Promise<Transfer> {
    const { data, error } = await supabase
      .from('internal_transfers')
      .update({
        status: 'validated',
        validated_by: userId,
        validation_date: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async completeTransfer(id: string): Promise<Transfer> {
    const { data, error } = await supabase
      .from('internal_transfers')
      .update({
        status: 'completed',
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async cancelTransfer(id: string): Promise<Transfer> {
    const { data, error } = await supabase
      .from('internal_transfers')
      .update({
        status: 'cancelled',
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getTransitBalance(companyId: string): Promise<TransitAccount> {
    const { data, error } = await supabase
      .from('internal_transfers')
      .select('*')
      .eq('company_id', companyId)
      .eq('status', 'in_transit');

    if (error) throw error;

    const transfers = data ?? [];
    const totalInTransit = transfers.reduce((sum, t) => sum + t.amount, 0);
    const oldestDate = transfers.length > 0
      ? transfers.reduce((oldest, t) =>
          t.transfer_date < oldest ? t.transfer_date : oldest,
        transfers[0].transfer_date)
      : null;

    return {
      total_in_transit: totalInTransit,
      count_in_transit: transfers.length,
      oldest_transfer_date: oldestDate,
      currency: transfers.length > 0 ? transfers[0].currency : 'XOF',
    };
  },

  async getIntercompanyFlows(tenantId: string): Promise<IntercompanyFlow[]> {
    const { data, error } = await supabase
      .from('internal_transfers')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('transfer_type', 'intercompany')
      .in('status', ['validated', 'in_transit', 'completed']);

    if (error) throw error;

    const transfers = data ?? [];
    const flowMap = new Map<string, IntercompanyFlow>();

    for (const t of transfers) {
      if (!t.from_company_id || !t.to_company_id) continue;
      const key = `${t.from_company_id}-${t.to_company_id}`;
      const existing = flowMap.get(key);
      if (existing) {
        existing.total_amount += t.amount;
        existing.transfer_count += 1;
      } else {
        flowMap.set(key, {
          from_company_id: t.from_company_id,
          to_company_id: t.to_company_id,
          total_amount: t.amount,
          currency: t.currency,
          transfer_count: 1,
        });
      }
    }

    return Array.from(flowMap.values());
  },

  async getTransferSummary(companyId: string): Promise<TransferSummary> {
    const { data, error } = await supabase
      .from('internal_transfers')
      .select('*')
      .eq('company_id', companyId);

    if (error) throw error;

    const transfers = data ?? [];
    const today = new Date().toISOString().split('T')[0];

    const inTransit = transfers.filter((t) => t.status === 'in_transit');
    const pendingValidation = transfers.filter((t) => t.status === 'pending_validation');
    const completedToday = transfers.filter(
      (t) => t.status === 'completed' && t.updated_at?.startsWith(today),
    );

    return {
      total_transfers: transfers.length,
      in_transit_count: inTransit.length,
      in_transit_amount: inTransit.reduce((sum, t) => sum + t.amount, 0),
      pending_validation_count: pendingValidation.length,
      completed_today: completedToday.length,
    };
  },
};
