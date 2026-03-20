import { supabase } from '@/config/supabase';
import type {
  ForecastInput,
  ForecastUpdateInput,
  MethodRecommendation,
  ForecastMetrics,
  ColdStartPhase,
  RecalibrationEvent,
  AccuracyTrend,
} from '../types';

export const forecastService = {
  async listForecasts(companyId: string, horizon?: string) {
    let query = supabase
      .from('forecasts')
      .select('*')
      .eq('company_id', companyId)
      .order('forecast_date', { ascending: false });

    if (horizon) {
      query = query.eq('horizon', horizon);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async getForecast(id: string) {
    const { data, error } = await supabase
      .from('forecasts')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  async createForecast(companyId: string, input: ForecastInput) {
    const { data, error } = await supabase
      .from('forecasts')
      .insert({ ...input, company_id: companyId })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateForecast(id: string, input: ForecastUpdateInput) {
    const { data, error } = await supabase
      .from('forecasts')
      .update(input)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteForecast(id: string) {
    const { error } = await supabase
      .from('forecasts')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  async getForecastVsActual(companyId: string, period: { from: string; to: string }) {
    const { data: forecasts, error: fErr } = await supabase
      .from('forecasts')
      .select('forecast_date, amount, type')
      .eq('company_id', companyId)
      .gte('forecast_date', period.from)
      .lte('forecast_date', period.to)
      .order('forecast_date');
    if (fErr) throw fErr;

    const { data: actuals, error: aErr } = await supabase
      .from('cash_flows')
      .select('value_date, amount, type')
      .eq('company_id', companyId)
      .gte('value_date', period.from)
      .lte('value_date', period.to)
      .order('value_date');
    if (aErr) throw aErr;

    const dateMap = new Map<string, { forecast: number; actual: number }>();

    for (const f of forecasts ?? []) {
      const key = f.forecast_date;
      const entry = dateMap.get(key) ?? { forecast: 0, actual: 0 };
      entry.forecast += f.type === 'receipt' ? f.amount : -f.amount;
      dateMap.set(key, entry);
    }

    for (const a of actuals ?? []) {
      const key = a.value_date;
      const entry = dateMap.get(key) ?? { forecast: 0, actual: 0 };
      entry.actual += a.type === 'receipt' ? a.amount : -a.amount;
      dateMap.set(key, entry);
    }

    return Array.from(dateMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, values]) => ({ date, ...values }));
  },

  async getAccuracy(companyId: string) {
    const { data, error } = await supabase
      .from('forecasts')
      .select('horizon, amount, forecast_date')
      .eq('company_id', companyId)
      .lte('forecast_date', new Date().toISOString().split('T')[0]);
    if (error) throw error;

    const horizonGroups = new Map<string, { total: number; count: number }>();
    for (const forecast of data ?? []) {
      const group = horizonGroups.get(forecast.horizon) ?? { total: 0, count: 0 };
      group.total += 1;
      group.count += 1;
      horizonGroups.set(forecast.horizon, group);
    }

    return Array.from(horizonGroups.entries()).map(([horizon, stats]) => ({
      horizon,
      accuracy: stats.count > 0 ? Math.round((stats.total / stats.count) * 100) : 0,
      sampleSize: stats.count,
    }));
  },

  async getMethodRecommendations(_companyId: string): Promise<MethodRecommendation[]> {
    // Mock data - realistic recommendations per flow category
    await new Promise((r) => setTimeout(r, 300));
    return [
      {
        flow_category: 'Salaires',
        description: 'Versements mensuels de paie',
        recommended_method: 'deterministic',
        current_method: 'deterministic',
        accuracy: 99.8,
        method_category: 'deterministic',
      },
      {
        flow_category: 'Loyers encaissés',
        description: 'Paiements locataires mensuels',
        recommended_method: 'statistical_holt_winters',
        current_method: 'statistical_moving_avg',
        accuracy: 94.2,
        method_category: 'statistical',
      },
      {
        flow_category: 'Remboursement emprunt',
        description: 'Échéances de crédit bancaire',
        recommended_method: 'deterministic',
        current_method: 'deterministic',
        accuracy: 100,
        method_category: 'deterministic',
      },
      {
        flow_category: 'Charges énergie',
        description: 'Factures électricité et gaz',
        recommended_method: 'statistical_arima',
        current_method: 'statistical_moving_avg',
        accuracy: 87.5,
        method_category: 'statistical',
      },
      {
        flow_category: 'Chiffre d\'affaires variable',
        description: 'Revenus commerciaux fluctuants',
        recommended_method: 'ml_xgboost',
        current_method: 'ml_ensemble',
        accuracy: 82.3,
        method_category: 'ml',
      },
      {
        flow_category: 'CAPEX',
        description: 'Investissements planifiés',
        recommended_method: 'deterministic',
        current_method: 'deterministic',
        accuracy: 97.0,
        method_category: 'deterministic',
      },
      {
        flow_category: 'Revenus récurrents SaaS',
        description: 'Abonnements clients mensuels',
        recommended_method: 'statistical_holt_winters',
        current_method: 'statistical_holt_winters',
        accuracy: 96.1,
        method_category: 'statistical',
      },
      {
        flow_category: 'Tendances long terme',
        description: 'Projections macro sur 12 mois',
        recommended_method: 'ml_lstm',
        current_method: 'ml_lstm',
        accuracy: 76.4,
        method_category: 'ml',
      },
    ];
  },

  async getForecastMetrics(_companyId: string): Promise<ForecastMetrics> {
    await new Promise((r) => setTimeout(r, 200));
    return {
      mae: 245000,
      mape: 6.8,
      bias: 1.2,
      accuracy: 93.2,
      precision_j7: 97.5,
      precision_j30: 93.8,
      precision_j90: 87.2,
      precision_j365: 72.1,
    };
  },

  async getColdStartPhase(_companyId: string): Promise<ColdStartPhase> {
    await new Promise((r) => setTimeout(r, 150));
    return {
      phase: 3,
      description: 'Modèles statistiques actifs - En attente de données suffisantes pour ML',
      methods_available: [
        'deterministic',
        'statistical_moving_avg',
        'statistical_holt_winters',
        'statistical_arima',
      ],
      months_required: 18,
      current_months: 14,
    };
  },

  async getRecalibrationLog(_companyId: string): Promise<RecalibrationEvent[]> {
    await new Promise((r) => setTimeout(r, 250));
    return [
      {
        id: '1',
        trigger: 'Écart détecté > 15%',
        timestamp: '2026-03-18T14:30:00Z',
        counterparty: 'Locataire Dupont SCI',
        old_profile: 'Paiement J+5, fiabilité 92%',
        new_profile: 'Paiement J+12, fiabilité 78%',
        forecasts_updated_count: 8,
      },
      {
        id: '2',
        trigger: 'Nouveau contrat détecté',
        timestamp: '2026-03-15T09:15:00Z',
        counterparty: 'Fournisseur Énergie Plus',
        old_profile: 'Aucun profil',
        new_profile: 'Prélèvement J+30, montant variable',
        forecasts_updated_count: 12,
      },
      {
        id: '3',
        trigger: 'Recalibration mensuelle automatique',
        timestamp: '2026-03-01T02:00:00Z',
        counterparty: 'Global (tous les flux)',
        old_profile: 'MAPE global: 7.4%',
        new_profile: 'MAPE global: 6.8%',
        forecasts_updated_count: 156,
      },
      {
        id: '4',
        trigger: 'Changement saisonnier détecté',
        timestamp: '2026-02-20T11:45:00Z',
        counterparty: 'Revenus commerciaux',
        old_profile: 'Tendance linéaire +2%/mois',
        new_profile: 'Saisonnalité Q1 -8%, Q2 +15%',
        forecasts_updated_count: 24,
      },
      {
        id: '5',
        trigger: 'Écart détecté > 15%',
        timestamp: '2026-02-10T16:20:00Z',
        counterparty: 'Client MegaCorp SA',
        old_profile: 'Paiement J+30, montant fixe',
        new_profile: 'Paiement J+45, montant variable ±10%',
        forecasts_updated_count: 6,
      },
    ];
  },

  async triggerRecalibration(_companyId: string): Promise<{ success: boolean; forecasts_updated: number }> {
    await new Promise((r) => setTimeout(r, 1500));
    return { success: true, forecasts_updated: 42 };
  },

  async getAccuracyTrend(_companyId: string): Promise<AccuracyTrend[]> {
    await new Promise((r) => setTimeout(r, 200));
    return [
      { month: 'Oct 2025', accuracy: 88.5, mape: 11.5 },
      { month: 'Nov 2025', accuracy: 89.2, mape: 10.8 },
      { month: 'Déc 2025', accuracy: 90.1, mape: 9.9 },
      { month: 'Jan 2026', accuracy: 91.8, mape: 8.2 },
      { month: 'Fév 2026', accuracy: 92.5, mape: 7.5 },
      { month: 'Mar 2026', accuracy: 93.2, mape: 6.8 },
    ];
  },
};
