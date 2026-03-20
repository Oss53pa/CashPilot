import { supabase } from '@/config/supabase';
import type {
  Scenario,
  ScenarioFormData,
  StressTest,
  StressTestResult,
  WhatIfParameters,
  WhatIfResult,
} from '../types';

export const scenariosService = {
  async list(companyId: string): Promise<Scenario[]> {
    try {
      const { data, error } = await supabase
        .from('scenarios')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data ?? [];
    } catch {
      return [];
    }
  },

  async getById(id: string): Promise<Scenario | null> {
    try {
      const { data, error } = await supabase
        .from('scenarios')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch {
      return null;
    }
  },

  async create(companyId: string, userId: string, formData: ScenarioFormData): Promise<Scenario> {
    const { data, error } = await supabase
      .from('scenarios')
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

  async update(id: string, formData: Partial<ScenarioFormData>): Promise<Scenario> {
    const { data, error } = await supabase
      .from('scenarios')
      .update(formData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('scenarios')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async runScenario(id: string): Promise<Scenario> {
    try {
      const scenario = await scenariosService.getById(id);
      if (!scenario) throw new Error('Scenario not found');

      // Fetch base forecast data
      const { data: forecasts, error } = await supabase
        .from('forecasts')
        .select('*')
        .eq('id', scenario.base_forecast_id);

      if (error) throw error;

      // Apply adjustments to forecast amounts
      const resultData: Record<string, number> = {};
      for (const forecast of forecasts ?? []) {
        let adjustedAmount = forecast.amount;
        const adjustment = scenario.adjustments.find(
          (adj) => adj.category === forecast.category,
        );
        if (adjustment) {
          adjustedAmount = forecast.amount * (1 + adjustment.percentage_change / 100);
        }
        resultData[forecast.category] = (resultData[forecast.category] ?? 0) + adjustedAmount;
      }

      // Store result
      const { data: updated, error: updateError } = await supabase
        .from('scenarios')
        .update({ result_data: resultData })
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;
      return updated;
    } catch {
      throw new Error('Failed to run scenario');
    }
  },

  async generateAutoScenarios(_companyId: string): Promise<{
    base: { name: string; net_position: number };
    optimistic: { name: string; net_position: number; delta: number };
    pessimistic: { name: string; net_position: number; delta: number };
  }> {
    await new Promise((r) => setTimeout(r, 800));
    return {
      base: { name: 'Scenario de base', net_position: 45_000_000 },
      optimistic: { name: 'Scenario optimiste', net_position: 62_500_000, delta: 17_500_000 },
      pessimistic: { name: 'Scenario pessimiste', net_position: 28_200_000, delta: -16_800_000 },
    };
  },

  async runStressTest(stressTest: StressTest): Promise<StressTestResult> {
    await new Promise((r) => setTimeout(r, 1200));

    const results: Record<string, StressTestResult> = {
      tenant_loss: {
        stress_test_id: stressTest.id,
        stress_test_name: stressTest.name,
        position_under_stress: 18_500_000,
        days_to_threshold: 68,
        severity: 'high',
        available_levers: [
          {
            name: 'Activation ligne de credit',
            description: 'Tirage sur la ligne de credit revolving disponible',
            estimated_impact: 15_000_000,
          },
          {
            name: 'Report CAPEX Q2',
            description: 'Reporter les investissements prevus au Q2',
            estimated_impact: 8_500_000,
          },
          {
            name: 'Acceleration recouvrement',
            description: 'Intensifier le suivi des creances clients',
            estimated_impact: 3_200_000,
          },
        ],
      },
      mass_delay: {
        stress_test_id: stressTest.id,
        stress_test_name: stressTest.name,
        position_under_stress: 22_300_000,
        days_to_threshold: 45,
        severity: 'high',
        available_levers: [
          {
            name: 'Negociation delais fournisseurs',
            description: 'Obtenir un report de 30 jours sur les paiements fournisseurs',
            estimated_impact: 12_000_000,
          },
          {
            name: 'Escompte commercial',
            description: 'Escompter les factures clients aupres de la banque',
            estimated_impact: 7_500_000,
          },
        ],
      },
      charge_shock: {
        stress_test_id: stressTest.id,
        stress_test_name: stressTest.name,
        position_under_stress: 32_000_000,
        days_to_threshold: 92,
        severity: 'medium',
        available_levers: [
          {
            name: 'Reduction charges discretionnaires',
            description: 'Geler les depenses non essentielles',
            estimated_impact: 5_000_000,
          },
          {
            name: 'Tirage ligne de credit',
            description: 'Utilisation partielle de la ligne de credit',
            estimated_impact: 10_000_000,
          },
        ],
      },
      bank_blockage: {
        stress_test_id: stressTest.id,
        stress_test_name: stressTest.name,
        position_under_stress: 12_800_000,
        days_to_threshold: 21,
        severity: 'critical',
        available_levers: [
          {
            name: 'Transfert vers autre banque',
            description: 'Activer les comptes secondaires et rediriger les flux',
            estimated_impact: 20_000_000,
          },
          {
            name: 'Action juridique urgente',
            description: 'Mise en demeure et procedure de deblocage',
            estimated_impact: 0,
          },
        ],
      },
      fx_shock: {
        stress_test_id: stressTest.id,
        stress_test_name: stressTest.name,
        position_under_stress: 38_500_000,
        days_to_threshold: 120,
        severity: 'medium',
        available_levers: [
          {
            name: 'Couverture de change',
            description: 'Mise en place de forwards ou options de change',
            estimated_impact: 4_500_000,
          },
          {
            name: 'Renegociation contrats',
            description: 'Renegocier les contrats en devise avec clause d\'indexation',
            estimated_impact: 2_800_000,
          },
        ],
      },
      credit_revocation: {
        stress_test_id: stressTest.id,
        stress_test_name: stressTest.name,
        position_under_stress: 8_200_000,
        days_to_threshold: 15,
        severity: 'critical',
        available_levers: [
          {
            name: 'Recherche financement alternatif',
            description: 'Contacter d\'autres etablissements bancaires en urgence',
            estimated_impact: 12_000_000,
          },
          {
            name: 'Cession d\'actifs non strategiques',
            description: 'Vente rapide d\'actifs mobilisables',
            estimated_impact: 6_000_000,
          },
          {
            name: 'Plan d\'austerite immediat',
            description: 'Gel total des depenses non critiques',
            estimated_impact: 4_500_000,
          },
        ],
      },
    };

    return results[stressTest.type] ?? results.charge_shock;
  },

  async runWhatIf(parameters: WhatIfParameters): Promise<WhatIfResult> {
    await new Promise((r) => setTimeout(r, 600));

    const basePosition = 45_000_000;
    const months = [
      'Avr 2026', 'Mai 2026', 'Jun 2026', 'Jul 2026',
      'Aou 2026', 'Sep 2026', 'Oct 2026', 'Nov 2026',
      'Dec 2026', 'Jan 2027', 'Fev 2027', 'Mar 2027',
    ];

    const baseData = months.map((month, i) => ({
      month,
      position: basePosition + (i * 1_200_000) + (Math.sin(i * 0.8) * 3_000_000),
    }));

    const revenueMultiplier = 1 + parameters.revenue_change / 100;
    const recoveryEffect = (parameters.recovery_rate - 85) / 100;
    const delayEffect = -parameters.payment_delay_adjustment * 150_000;
    const expenseEffect = -parameters.additional_expense;
    const capexShift = parameters.capex_timing_shift;

    const projectedData = months.map((month, i) => {
      let position = baseData[i].position;
      position *= revenueMultiplier;
      position += recoveryEffect * 2_000_000;
      position += delayEffect;
      if (i === 0) position += expenseEffect;
      // CAPEX shift effect: if shifted forward, save now, pay later
      if (capexShift > 0 && i < capexShift) {
        position += 2_500_000;
      } else if (capexShift > 0 && i === capexShift) {
        position -= 2_500_000 * capexShift;
      }
      return { month, position: Math.round(position) };
    });

    const avgBase = baseData.reduce((s, d) => s + d.position, 0) / baseData.length;
    const avgProjected = projectedData.reduce((s, d) => s + d.position, 0) / projectedData.length;

    return {
      parameters,
      projected_data: projectedData,
      base_data: baseData,
      net_impact: Math.round(avgProjected - avgBase),
    };
  },
};
