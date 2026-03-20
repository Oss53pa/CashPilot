import { supabase } from '@/config/supabase';
import type { BankAccount } from '@/types/database';
import type { CashRegisterFormData, CashCount, CashWithdrawalRequest } from '../types';

export const cashRegistersService = {
  async list(companyId: string, type?: 'cash' | 'mobile_money'): Promise<BankAccount[]> {
    let query = supabase
      .from('bank_accounts')
      .select('*')
      .eq('company_id', companyId)
      .in('account_type', ['cash', 'mobile_money'])
      .order('bank_name');

    if (type) {
      query = query.eq('account_type', type);
    }

    const { data, error } = await query;
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

  async create(companyId: string, formData: CashRegisterFormData): Promise<BankAccount> {
    const { data, error } = await supabase
      .from('bank_accounts')
      .insert({
        company_id: companyId,
        bank_name: formData.name,
        account_name: formData.name,
        account_number: formData.phone_number || `CASH-${Date.now()}`,
        currency: formData.currency,
        account_type: formData.type,
        initial_balance: formData.initial_balance,
        current_balance: formData.initial_balance,
        is_active: formData.is_active,
        iban: null,
        swift_code: null,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, formData: Partial<CashRegisterFormData>): Promise<BankAccount> {
    const updateData: Record<string, unknown> = {};
    if (formData.name !== undefined) {
      updateData.bank_name = formData.name;
      updateData.account_name = formData.name;
    }
    if (formData.currency !== undefined) updateData.currency = formData.currency;
    if (formData.type !== undefined) updateData.account_type = formData.type;
    if (formData.initial_balance !== undefined) updateData.initial_balance = formData.initial_balance;
    if (formData.is_active !== undefined) updateData.is_active = formData.is_active;
    if (formData.phone_number !== undefined) updateData.account_number = formData.phone_number;

    const { data, error } = await supabase
      .from('bank_accounts')
      .update(updateData)
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

  // Cash Counts (mock data)
  async getCashCounts(_companyId: string): Promise<CashCount[]> {
    const mockCounts: CashCount[] = [
      { id: '1', register_id: 'reg-1', count_date: '2026-03-20', theoretical_balance: 2_450_000, physical_balance: 2_450_000, variance: 0, counted_by: 'Amadou Diallo', validated_by: 'Fatou Sow', status: 'validated', notes: null },
      { id: '2', register_id: 'reg-1', count_date: '2026-03-19', theoretical_balance: 3_100_000, physical_balance: 3_095_500, variance: -4_500, counted_by: 'Amadou Diallo', validated_by: 'Fatou Sow', status: 'validated', notes: 'Ecart mineur - erreur de rendu monnaie' },
      { id: '3', register_id: 'reg-2', count_date: '2026-03-20', theoretical_balance: 1_800_000, physical_balance: 1_785_000, variance: -15_000, counted_by: 'Moussa Keita', validated_by: null, status: 'discrepancy', notes: 'Ecart > 10 000 FCFA - alerte declenchee' },
      { id: '4', register_id: 'reg-1', count_date: '2026-03-18', theoretical_balance: 2_800_000, physical_balance: 2_803_000, variance: 3_000, counted_by: 'Amadou Diallo', validated_by: 'Fatou Sow', status: 'validated', notes: 'Surplus minime' },
    ];
    return mockCounts;
  },

  async createCashCount(_companyId: string, data: Omit<CashCount, 'id' | 'variance' | 'status'>): Promise<CashCount> {
    const variance = data.physical_balance - data.theoretical_balance;
    let status: CashCount['status'] = 'pending';
    if (Math.abs(variance) > 10_000) status = 'discrepancy';
    else if (Math.abs(variance) <= 1_000) status = 'validated';

    return {
      id: `cc-${Date.now()}`,
      ...data,
      variance,
      status,
    };
  },

  // Withdrawal Requests (mock data)
  async getWithdrawalRequests(_companyId: string): Promise<CashWithdrawalRequest[]> {
    const mockRequests: CashWithdrawalRequest[] = [
      { id: '1', register_id: 'reg-1', amount: 35_000, reason: 'Achat fournitures bureau', requested_by: 'Amadou Diallo', approved_by: 'Fatou Sow', approval_status: 'approved', justification_due: '2026-03-22', justification_received: true },
      { id: '2', register_id: 'reg-1', amount: 150_000, reason: 'Paiement prestataire nettoyage', requested_by: 'Moussa Keita', approved_by: null, approval_status: 'pending', justification_due: '2026-03-22', justification_received: false },
      { id: '3', register_id: 'reg-2', amount: 350_000, reason: 'Achat materiel informatique', requested_by: 'Amadou Diallo', approved_by: null, approval_status: 'pending', justification_due: '2026-03-22', justification_received: false },
    ];
    return mockRequests;
  },

  async createWithdrawalRequest(_companyId: string, data: Omit<CashWithdrawalRequest, 'id' | 'approved_by' | 'approval_status' | 'justification_received'>): Promise<CashWithdrawalRequest> {
    return {
      id: `wr-${Date.now()}`,
      ...data,
      approved_by: null,
      approval_status: 'pending',
      justification_received: false,
    };
  },

  async approveWithdrawalRequest(id: string, approvedBy: string, approved: boolean): Promise<CashWithdrawalRequest> {
    return {
      id,
      register_id: 'reg-1',
      amount: 0,
      reason: '',
      requested_by: '',
      approved_by: approved ? approvedBy : null,
      approval_status: approved ? 'approved' : 'rejected',
      justification_due: '',
      justification_received: false,
    };
  },
};
