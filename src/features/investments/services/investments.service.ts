import { supabase } from '@/config/supabase';
import type { Investment, InvestmentFormData, PortfolioSummary, SurplusDetection, PlacementSuggestion } from '../types';

export const investmentsService = {
  async list(companyId: string): Promise<Investment[]> {
    const { data, error } = await supabase
      .from('investments')
      .select('*')
      .eq('company_id', companyId)
      .order('maturity_date');

    if (error) throw error;
    return data ?? [];
  },

  async getById(id: string): Promise<Investment> {
    const { data, error } = await supabase
      .from('investments')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async create(companyId: string, formData: InvestmentFormData): Promise<Investment> {
    const { data, error } = await supabase
      .from('investments')
      .insert({
        ...formData,
        company_id: companyId,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, formData: Partial<InvestmentFormData>): Promise<Investment> {
    const { data, error } = await supabase
      .from('investments')
      .update(formData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('investments')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async getPortfolioSummary(companyId: string): Promise<PortfolioSummary> {
    const { data, error } = await supabase
      .from('investments')
      .select('*')
      .eq('company_id', companyId);

    if (error) throw error;

    const investments = data ?? [];
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const totalInvested = investments.reduce((sum, inv) => sum + inv.amount, 0);

    const weightedAvgRate =
      totalInvested > 0
        ? investments.reduce((sum, inv) => sum + inv.interest_rate * inv.amount, 0) / totalInvested
        : 0;

    const maturingWithin30Days = investments.filter(
      (inv) => new Date(inv.maturity_date) <= thirtyDaysFromNow && new Date(inv.maturity_date) >= now,
    ).length;

    const typeMap = new Map<string, number>();
    investments.forEach((inv) => {
      const existing = typeMap.get(inv.type) ?? 0;
      typeMap.set(inv.type, existing + inv.amount);
    });

    const byType = Array.from(typeMap.entries()).map(([name, value]) => ({
      name: name.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      value,
    }));

    return {
      total_invested: totalInvested,
      weighted_avg_rate: Math.round(weightedAvgRate * 100) / 100,
      maturing_within_30_days: maturingWithin30Days,
      by_type: byType,
    };
  },

  async getSurplusDetection(_companyId: string): Promise<SurplusDetection[]> {
    // Mock data in FCFA
    return [
      {
        account: 'Compte Courant SGBCI',
        current_balance: 285000000,
        max_threshold: 150000000,
        excess_amount: 135000000,
      },
      {
        account: 'Compte Courant BIAO',
        current_balance: 92000000,
        max_threshold: 80000000,
        excess_amount: 12000000,
      },
    ];
  },

  async getPlacementSuggestions(_companyId: string): Promise<PlacementSuggestion[]> {
    // Mock data
    return [
      {
        instrument: 'DAT (Depot a Terme)',
        rate: 5.25,
        term: '3 mois',
        recommended: false,
      },
      {
        instrument: 'DAT (Depot a Terme)',
        rate: 6.0,
        term: '6 mois',
        recommended: true,
      },
      {
        instrument: 'Bon du Tresor',
        rate: 5.75,
        term: '12 mois',
        recommended: false,
      },
      {
        instrument: 'OPCVM Monetaire',
        rate: 4.5,
        term: 'Liquide (J+1)',
        recommended: false,
      },
    ];
  },
};
