import { supabase } from '@/config/supabase';
import type { TaxObligation, SecurityDeposit } from '@/types/database';
import type { TaxObligationFormData, SecurityDepositFormData, VATFlow, ChargeRegularization, PartialPayment } from '../types';

export const fiscalService = {
  // Tax Obligations
  async listTaxObligations(companyId: string): Promise<TaxObligation[]> {
    const { data, error } = await supabase
      .from('tax_obligations')
      .select('*')
      .eq('company_id', companyId)
      .order('due_date', { ascending: true });

    if (error) throw error;
    return data ?? [];
  },

  async getTaxObligation(id: string): Promise<TaxObligation | null> {
    const { data, error } = await supabase
      .from('tax_obligations')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code === 'PGRST116') return null;
    if (error) throw error;
    return data;
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
    const { data, error } = await supabase
      .from('security_deposits')
      .select('*')
      .eq('company_id', companyId)
      .order('deposit_date', { ascending: false });

    if (error) throw error;
    return data ?? [];
  },

  async getSecurityDeposit(id: string): Promise<SecurityDeposit | null> {
    const { data, error } = await supabase
      .from('security_deposits')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code === 'PGRST116') return null;
    if (error) throw error;
    return data;
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

  // VAT Flows
  async getVATFlows(companyId: string): Promise<VATFlow[]> {
    const { data, error } = await supabase
      .from('vat_flows')
      .select('*')
      .eq('company_id', companyId)
      .order('period', { ascending: true });

    if (error) throw error;
    return (data ?? []) as VATFlow[];
  },

  // Charge Regularization
  async getChargeRegularization(companyId: string): Promise<ChargeRegularization[]> {
    const { data, error } = await supabase
      .from('charge_regularizations')
      .select('*')
      .eq('company_id', companyId)
      .order('fiscal_year', { ascending: false });

    if (error) throw error;
    return (data ?? []) as ChargeRegularization[];
  },

  // Partial Payments
  async addPartialPayment(companyId: string, input: Omit<PartialPayment, 'id'>): Promise<PartialPayment> {
    const { data, error } = await supabase
      .from('partial_payments')
      .insert({ ...input, company_id: companyId })
      .select()
      .single();

    if (error) throw error;
    return data as PartialPayment;
  },
};
