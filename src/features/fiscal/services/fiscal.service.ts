import { supabase } from '@/config/supabase';
import type { TaxObligation, SecurityDeposit } from '@/types/database';
import type { TaxObligationFormData, SecurityDepositFormData, VATFlow, ChargeRegularization, PartialPayment } from '../types';

export const fiscalService = {
  // Tax Obligations
  async listTaxObligations(companyId: string): Promise<TaxObligation[]> {
    try {
      const { data, error } = await supabase
        .from('tax_obligations')
        .select('*')
        .eq('company_id', companyId)
        .order('due_date', { ascending: true });

      if (error) throw error;
      return data ?? [];
    } catch {
      return [];
    }
  },

  async getTaxObligation(id: string): Promise<TaxObligation | null> {
    try {
      const { data, error } = await supabase
        .from('tax_obligations')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch {
      return null;
    }
  },

  async createTaxObligation(companyId: string, formData: TaxObligationFormData): Promise<TaxObligation> {
    const { data, error } = await supabase
      .from('tax_obligations')
      .insert({ ...formData, company_id: companyId })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateTaxObligation(id: string, formData: Partial<TaxObligationFormData>): Promise<TaxObligation> {
    const { data, error } = await supabase
      .from('tax_obligations')
      .update(formData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteTaxObligation(id: string): Promise<void> {
    const { error } = await supabase
      .from('tax_obligations')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Security Deposits
  async listSecurityDeposits(companyId: string): Promise<SecurityDeposit[]> {
    try {
      const { data, error } = await supabase
        .from('security_deposits')
        .select('*')
        .eq('company_id', companyId)
        .order('deposit_date', { ascending: false });

      if (error) throw error;
      return data ?? [];
    } catch {
      return [];
    }
  },

  async getSecurityDeposit(id: string): Promise<SecurityDeposit | null> {
    try {
      const { data, error } = await supabase
        .from('security_deposits')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch {
      return null;
    }
  },

  async createSecurityDeposit(companyId: string, formData: SecurityDepositFormData): Promise<SecurityDeposit> {
    const { data, error } = await supabase
      .from('security_deposits')
      .insert({ ...formData, company_id: companyId })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateSecurityDeposit(id: string, formData: Partial<SecurityDepositFormData>): Promise<SecurityDeposit> {
    const { data, error } = await supabase
      .from('security_deposits')
      .update(formData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteSecurityDeposit(id: string): Promise<void> {
    const { error } = await supabase
      .from('security_deposits')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // VAT Flows (mock data)
  async getVATFlows(_companyId: string): Promise<VATFlow[]> {
    const mockFlows: VATFlow[] = [
      { id: '1', period: '2026-01', vat_collected: 4_850_000, vat_deductible: 2_120_000, vat_due: 2_730_000, payment_date: '2026-02-15', status: 'paid' },
      { id: '2', period: '2026-02', vat_collected: 5_200_000, vat_deductible: 2_350_000, vat_due: 2_850_000, payment_date: '2026-03-15', status: 'paid' },
      { id: '3', period: '2026-03', vat_collected: 4_600_000, vat_deductible: 1_980_000, vat_due: 2_620_000, payment_date: null, status: 'declared' },
      { id: '4', period: '2026-04', vat_collected: 5_100_000, vat_deductible: 2_400_000, vat_due: 2_700_000, payment_date: null, status: 'pending' },
      { id: '5', period: '2026-05', vat_collected: 4_750_000, vat_deductible: 2_050_000, vat_due: 2_700_000, payment_date: null, status: 'pending' },
      { id: '6', period: '2026-06', vat_collected: 5_500_000, vat_deductible: 2_600_000, vat_due: 2_900_000, payment_date: null, status: 'pending' },
    ];
    return mockFlows;
  },

  // Charge Regularization (mock data)
  async getChargeRegularization(_companyId: string): Promise<ChargeRegularization[]> {
    const mockRegularizations: ChargeRegularization[] = [
      { id: '1', fiscal_year: 2024, actual_charges: 18_500_000, called_provisions: 19_200_000, balance: -700_000, status: 'regularized' },
      { id: '2', fiscal_year: 2025, actual_charges: 21_300_000, called_provisions: 20_000_000, balance: 1_300_000, status: 'pending' },
    ];
    return mockRegularizations;
  },

  // Partial Payments (mock data)
  async addPartialPayment(_companyId: string, data: Omit<PartialPayment, 'id'>): Promise<PartialPayment> {
    return {
      id: `pp-${Date.now()}`,
      ...data,
    };
  },
};
