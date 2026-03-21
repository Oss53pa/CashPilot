import { supabase } from '@/config/supabase';
import type {
  Proph3tForecast,
  Proph3tAnomaly,
  Proph3tTenantScore,
  Proph3tAlert,
  Proph3tNarrative,
  Proph3tRecommendation,
  Proph3tWhatIfSession,
  Proph3tFraudAlert,
  Proph3tPerformanceLog,
  Proph3tModelConfig,
  AlertStatus,
  ForecastScenario,
  FraudStatus,
} from '@/types/proph3t';
import type {
  UncertaintyDistribution,
  CalibrationData,
  UncertaintyDecomposition,
  ProbabilityQuery,
  FanChartPoint,
} from '../components/uncertainty/uncertainty-types';
import type {
  AnomalyExplanation,
} from '../components/explanations/anomaly-explanation-types';
import type {
  CausalGraph,
  CausalDecomposition,
  CausalIntervention,
  GrangerCausalityResult,
} from '../components/causal/causal-types';
import type {
  FederatedConfig,
  FederatedPerformance,
  FederatedAuditEntry,
} from '../components/federated/federated-types';

// ============================================================================
// FORECASTS
// ============================================================================

export async function getForecasts(
  companyId: string,
  options?: {
    scenario?: ForecastScenario;
    category?: string;
    fromDate?: string;
    toDate?: string;
    limit?: number;
  }
) {
  let query = supabase
    .from('proph3t_forecasts')
    .select('*')
    .eq('company_id', companyId)
    .order('forecast_date', { ascending: true });

  if (options?.scenario) query = query.eq('scenario', options.scenario);
  if (options?.category) query = query.eq('category', options.category);
  if (options?.fromDate) query = query.gte('forecast_date', options.fromDate);
  if (options?.toDate) query = query.lte('forecast_date', options.toDate);
  if (options?.limit) query = query.limit(options.limit);

  const { data, error } = await query;
  if (error) throw error;
  return data as Proph3tForecast[];
}

// ============================================================================
// ANOMALIES
// ============================================================================

export async function getAnomalies(
  companyId: string,
  options?: { status?: string; limit?: number }
) {
  let query = supabase
    .from('proph3t_anomalies')
    .select('*')
    .eq('company_id', companyId)
    .order('detected_at', { ascending: false });

  if (options?.status) query = query.eq('status', options.status);
  if (options?.limit) query = query.limit(options.limit);

  const { data, error } = await query;
  if (error) throw error;
  return data as Proph3tAnomaly[];
}

// ============================================================================
// TENANT SCORES
// ============================================================================

export async function getLatestTenantScores(companyId: string) {
  const { data, error } = await supabase
    .from('latest_tenant_scores')
    .select('*')
    .eq('company_id', companyId)
    .order('score', { ascending: true });

  if (error) throw error;
  return data as Proph3tTenantScore[];
}

export async function getTenantScoreHistory(
  companyId: string,
  counterpartyId: string,
  limit = 12
) {
  const { data, error } = await supabase
    .from('proph3t_tenant_scores')
    .select('*')
    .eq('company_id', companyId)
    .eq('counterparty_id', counterpartyId)
    .order('scored_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data as Proph3tTenantScore[];
}

// ============================================================================
// ALERTS
// ============================================================================

export async function getAlerts(
  companyId: string,
  options?: { status?: AlertStatus; priority?: string; limit?: number }
) {
  let query = supabase
    .from('proph3t_alerts')
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false });

  if (options?.status) query = query.eq('status', options.status);
  if (options?.priority) query = query.eq('priority', options.priority);
  if (options?.limit) query = query.limit(options.limit);

  const { data, error } = await query;
  if (error) throw error;
  return data as Proph3tAlert[];
}

export async function updateAlertStatus(
  alertId: string,
  status: AlertStatus,
  actionTaken?: string
) {
  const updates: Record<string, unknown> = { status };
  if (actionTaken) updates.action_taken = actionTaken;
  if (status === 'resolved') updates.resolved_at = new Date().toISOString();

  const { error } = await supabase
    .from('proph3t_alerts')
    .update(updates)
    .eq('id', alertId);

  if (error) throw error;
}

// ============================================================================
// NARRATIVES
// ============================================================================

export async function getLatestNarrative(companyId: string) {
  const { data, error } = await supabase
    .from('proph3t_narratives')
    .select('*')
    .eq('company_id', companyId)
    .order('generated_at', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
  return data as Proph3tNarrative | null;
}

export async function getNarrativeHistory(companyId: string, limit = 10) {
  const { data, error } = await supabase
    .from('proph3t_narratives')
    .select('*')
    .eq('company_id', companyId)
    .order('generated_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data as Proph3tNarrative[];
}

// ============================================================================
// RECOMMENDATIONS
// ============================================================================

export async function getRecommendations(companyId: string, alertId?: string) {
  let query = supabase
    .from('proph3t_recommendations')
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false });

  if (alertId) query = query.eq('alert_id', alertId);

  const { data, error } = await query;
  if (error) throw error;
  return data as Proph3tRecommendation[];
}

// ============================================================================
// WHAT-IF
// ============================================================================

export async function runWhatIf(
  companyId: string,
  query: string,
  language: 'fr' | 'en' = 'fr'
) {
  const { data, error } = await supabase.functions.invoke('proph3t-whatif', {
    body: { company_id: companyId, query, language },
  });

  if (error) throw error;
  return data as Proph3tWhatIfSession;
}

export async function getWhatIfHistory(companyId: string, limit = 20) {
  const { data, error } = await supabase
    .from('proph3t_whatif_sessions')
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data as Proph3tWhatIfSession[];
}

// ============================================================================
// FRAUD
// ============================================================================

export async function getFraudAlerts(
  companyId: string,
  options?: { status?: string; limit?: number }
) {
  let query = supabase
    .from('proph3t_fraud_alerts')
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false });

  if (options?.status) query = query.eq('status', options.status);
  if (options?.limit) query = query.limit(options.limit);

  const { data, error } = await query;
  if (error) throw error;
  return data as Proph3tFraudAlert[];
}

export async function updateFraudAlertStatus(
  alertId: string,
  status: FraudStatus,
  investigationNotes?: string
) {
  const updates: Record<string, unknown> = { status };
  if (investigationNotes) updates.investigation_notes = investigationNotes;
  if (status === 'cleared' || status === 'confirmed') updates.resolved_at = new Date().toISOString();

  const { error } = await supabase
    .from('proph3t_fraud_alerts')
    .update(updates)
    .eq('id', alertId);

  if (error) throw error;
}

export async function updateAnomalyStatus(
  anomalyId: string,
  status: 'open' | 'investigated' | 'cleared' | 'confirmed_fraud',
  investigationNote?: string
) {
  const updates: Record<string, unknown> = { status };
  if (investigationNote) updates.investigation_note = investigationNote;
  if (status === 'cleared' || status === 'confirmed_fraud') updates.resolved_at = new Date().toISOString();

  const { error } = await supabase
    .from('proph3t_anomalies')
    .update(updates)
    .eq('id', anomalyId);

  if (error) throw error;
}

// ============================================================================
// PERFORMANCE
// ============================================================================

export async function getPerformanceLogs(
  companyId: string,
  options?: { category?: string; modelUsed?: string; limit?: number }
) {
  let query = supabase
    .from('proph3t_performance_log')
    .select('*')
    .eq('company_id', companyId)
    .eq('is_realized', true)
    .order('run_date', { ascending: false });

  if (options?.category) query = query.eq('category', options.category);
  if (options?.modelUsed) query = query.eq('model_used', options.modelUsed);
  if (options?.limit) query = query.limit(options.limit);

  const { data, error } = await query;
  if (error) throw error;
  return data as Proph3tPerformanceLog[];
}

export async function getActiveModelConfigs(companyId: string) {
  const { data, error } = await supabase
    .from('proph3t_model_config')
    .select('*')
    .eq('company_id', companyId)
    .eq('is_active', true)
    .order('category');

  if (error) throw error;
  return data as Proph3tModelConfig[];
}

// ============================================================================
// EDGE FUNCTION TRIGGERS (manual)
// ============================================================================

export async function triggerForecast(companyId: string, horizonDays: number[] = [7, 30]) {
  const { data, error } = await supabase.functions.invoke('proph3t-forecast', {
    body: { company_id: companyId, horizon_days: horizonDays },
  });
  if (error) throw error;
  return data;
}

export async function triggerBehaviorScore(companyId: string) {
  const { data, error } = await supabase.functions.invoke('proph3t-behavior-score', {
    body: { company_id: companyId },
  });
  if (error) throw error;
  return data;
}

export async function triggerNarrative(companyId: string) {
  const { data, error } = await supabase.functions.invoke('proph3t-narrative', {
    body: { company_id: companyId },
  });
  if (error) throw error;
  return data;
}

// ============================================================================
// UNCERTAINTY QUANTIFICATION (Extension 5)
// ============================================================================

function generateDensityPoints(central: number, stdDev: number, count = 50): { x: number; y: number }[] {
  const points: { x: number; y: number }[] = [];
  const minX = central - 4 * stdDev;
  const maxX = central + 4 * stdDev;
  const step = (maxX - minX) / (count - 1);
  for (let i = 0; i < count; i++) {
    const x = minX + i * step;
    const z = (x - central) / stdDev;
    const y = (1 / (stdDev * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * z * z);
    points.push({ x: Math.round(x), y });
  }
  return points;
}

export async function getUncertaintyDistribution(
  _companyId: string,
  _forecastId: string
): Promise<UncertaintyDistribution> {
  const central = 130_000_000;
  const stdDev = 8_000_000;
  const aleatoricVar = 0.6 * stdDev * stdDev;
  const epistemicVar = 0.4 * stdDev * stdDev;

  return {
    forecast_id: _forecastId || 'fc-001',
    target_date: '2026-04-15',
    central,
    mean: central + 200_000,
    median: central - 100_000,
    std_dev: stdDev,
    percentiles: {
      p5: central - 1.645 * stdDev,
      p10: central - 1.282 * stdDev,
      p25: central - 0.674 * stdDev,
      p50: central,
      p75: central + 0.674 * stdDev,
      p90: central + 1.282 * stdDev,
      p95: central + 1.645 * stdDev,
    },
    density_points: generateDensityPoints(central, stdDev),
    aleatoric_variance: aleatoricVar,
    epistemic_variance: epistemicVar,
    total_variance: aleatoricVar + epistemicVar,
    credible_interval_80: [central - 1.282 * stdDev, central + 1.282 * stdDev],
    credible_interval_95: [central - 1.96 * stdDev, central + 1.96 * stdDev],
    mc_dropout_samples: 200,
  };
}

export async function getFanChartData(
  _companyId: string
): Promise<FanChartPoint[]> {
  const baseDate = new Date('2026-03-21');
  const points: FanChartPoint[] = [];
  const baseCentral = 130_000_000;

  for (let i = 0; i <= 30; i++) {
    const d = new Date(baseDate);
    d.setDate(d.getDate() + i);
    const label = d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
    const growth = i * 600_000;
    const noise = Math.sin(i * 0.4) * 2_000_000;
    const central = baseCentral + growth + noise;
    const spread80 = 5_000_000 + i * 400_000;
    const spread95 = 8_000_000 + i * 700_000;

    points.push({
      date: label,
      central: Math.round(central),
      ci80_lower: Math.round(central - spread80),
      ci80_upper: Math.round(central + spread80),
      ci95_lower: Math.round(central - spread95),
      ci95_upper: Math.round(central + spread95),
    });
  }
  return points;
}

export async function getCalibrationData(
  _companyId: string
): Promise<CalibrationData> {
  return {
    expected_coverage: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9],
    actual_coverage: [0.08, 0.18, 0.28, 0.42, 0.51, 0.58, 0.72, 0.79, 0.91],
    ece: 0.032,
    is_well_calibrated: true,
  };
}

export async function getUncertaintyDecomposition(
  _companyId: string
): Promise<UncertaintyDecomposition[]> {
  return [
    {
      horizon: 'J+7',
      aleatoric_pct: 75,
      epistemic_pct: 25,
      description_aleatoric: 'Variabilite inherente des flux quotidiens',
      description_epistemic: 'Incertitude sur les parametres du modele Holt-Winters',
    },
    {
      horizon: 'J+30',
      aleatoric_pct: 60,
      epistemic_pct: 40,
      description_aleatoric: 'Saisonnalite et cycles de paiement non previsibles',
      description_epistemic: 'Manque de donnees sur les nouveaux fournisseurs',
    },
    {
      horizon: 'J+90',
      aleatoric_pct: 45,
      epistemic_pct: 55,
      description_aleatoric: 'Volatilite macroeconomique et evenements externes',
      description_epistemic: 'Incertitude structurelle du modele Prophet sur horizon long',
    },
    {
      horizon: 'J+365',
      aleatoric_pct: 35,
      epistemic_pct: 65,
      description_aleatoric: 'Chocs exogenes imprevisibles (reglementation, marche)',
      description_epistemic: "Extrapolation au-dela des donnees d'entrainement",
    },
  ];
}

export async function queryProbability(
  _companyId: string,
  _date: string,
  threshold: number
): Promise<ProbabilityQuery> {
  const central = 130_000_000;
  const stdDev = 8_000_000;
  const z = (threshold - central) / stdDev;
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989422804 * Math.exp(-0.5 * z * z);
  const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  const probability = z > 0 ? 1 - p : p;

  return {
    date: _date,
    threshold,
    probability: Math.round(probability * 1000) / 10,
  };
}

// ============================================================================
// ANOMALY EXPLANATIONS (Extension 3)
// ============================================================================

export async function getAnomalyExplanation(
  _anomalyId: string
): Promise<AnomalyExplanation> {
  return {
    anomaly_id: _anomalyId,
    transaction_id: 'TXN-2026-0487',
    transaction_description: 'Paiement de 8 400 000 FCFA a GLOBAL SERVICES INTL — fournisseur non reference',
    anomaly_score: 0.87,
    anomaly_features: [
      { name: 'Montant', value: '8 400 000 FCFA', contribution: 0.35 },
      { name: 'Fournisseur inconnu', value: 'Oui', contribution: 0.28 },
      { name: 'Jour du mois', value: '28', contribution: 0.18 },
      { name: 'Heure', value: '22h45', contribution: 0.12 },
      { name: 'Compte source', value: 'SGBCI Exploitation', contribution: 0.07 },
    ],
    counterfactuals: [
      {
        id: 'cf-001',
        anomaly_id: _anomalyId,
        type: 'minimal',
        label: 'Contrefactuel minimal',
        description_fr: 'Pour etre considere comme normal, le montant aurait du etre entre 1 800 000 et 2 400 000 FCFA.',
        description_en: 'To be considered normal, the amount should have been between 1,800,000 and 2,400,000 FCFA.',
        changed_features: [
          { feature: 'Montant', original: '8 400 000 FCFA', counterfactual: '2 100 000 FCFA' },
        ],
        confidence: 0.92,
      },
      {
        id: 'cf-002',
        anomaly_id: _anomalyId,
        type: 'contextual',
        label: 'Contrefactuel contextuel',
        description_fr: 'Ce fournisseur paie habituellement entre le 1er et le 15 du mois — cette transaction est le 28.',
        description_en: 'This vendor usually pays between the 1st and 15th — this transaction is on the 28th.',
        changed_features: [
          { feature: 'Jour du mois', original: '28', counterfactual: '1-15' },
          { feature: 'Fournisseur', original: 'GLOBAL SERVICES INTL (non ref.)', counterfactual: 'Fournisseur reference' },
        ],
        confidence: 0.85,
      },
      {
        id: 'cf-003',
        anomaly_id: _anomalyId,
        type: 'actionable',
        label: 'Contrefactuel actionnable',
        description_fr: 'Verifiez si le bon de commande BC-2026-0087 correspond a ce montant. Si oui, reclassez en CAPEX.',
        description_en: 'Check if purchase order BC-2026-0087 matches this amount. If so, reclassify as CAPEX.',
        changed_features: [
          { feature: 'Bon de commande', original: 'Absent', counterfactual: 'BC-2026-0087 valide' },
          { feature: 'Classification', original: 'Non classifie', counterfactual: 'CAPEX' },
        ],
        confidence: 0.78,
      },
    ],
    user_feedback: null,
    generated_at: '2026-03-21T10:30:00Z',
  };
}

// ============================================================================
// CAUSAL AI (Extension 6) — Mock data
// ============================================================================

export async function getCausalGraph(_companyId: string): Promise<CausalGraph> {
  return {
    last_updated: '2026-03-20T06:00:00Z',
    min_history_months: 24,
    nodes: [
      { id: 'loyers_fixes', label: 'Loyers fixes', category: 'revenue', x: 100, y: 80 },
      { id: 'charges_locatives', label: 'Charges locatives', category: 'expense', x: 300, y: 60 },
      { id: 'capex', label: 'CAPEX', category: 'expense', x: 500, y: 80 },
      { id: 'salaires', label: 'Salaires', category: 'expense', x: 300, y: 200 },
      { id: 'energie', label: 'Energie', category: 'expense', x: 500, y: 200 },
      { id: 'tva', label: 'TVA', category: 'expense', x: 700, y: 60 },
      { id: 'score_locataires', label: 'Score locataires', category: 'external', x: 100, y: 320 },
      { id: 'taux_occupation', label: "Taux d'occupation", category: 'external', x: 300, y: 340 },
      { id: 'saisonnalite', label: 'Saisonnalite', category: 'external', x: 500, y: 340 },
      { id: 'position_tresorerie', label: 'Position tresorerie', category: 'position', x: 400, y: 460 },
      { id: 'service_dette', label: 'Service dette', category: 'expense', x: 700, y: 200 },
      { id: 'revenus_annexes', label: 'Revenus annexes', category: 'revenue', x: 100, y: 200 },
    ],
    edges: [
      { source: 'score_locataires', target: 'loyers_fixes', strength: 0.82, direction: 'causes', confidence: 0.91, lag_days: 45, description: 'Un score locataire bas entraine des retards de paiement des loyers' },
      { source: 'saisonnalite', target: 'energie', strength: 0.75, direction: 'causes', confidence: 0.88, lag_days: 0, description: 'La saisonnalite impacte directement les couts energetiques' },
      { source: 'taux_occupation', target: 'loyers_fixes', strength: 0.93, direction: 'causes', confidence: 0.95, lag_days: 0, description: "Le taux d'occupation determine directement les revenus locatifs" },
      { source: 'capex', target: 'position_tresorerie', strength: 0.88, direction: 'causes', confidence: 0.92, lag_days: 0, description: 'Les investissements CAPEX reduisent la position de tresorerie' },
      { source: 'loyers_fixes', target: 'position_tresorerie', strength: 0.91, direction: 'causes', confidence: 0.94, lag_days: 5, description: 'Les loyers encaisses alimentent la tresorerie' },
      { source: 'salaires', target: 'position_tresorerie', strength: 0.85, direction: 'causes', confidence: 0.96, lag_days: 0, description: 'Les salaires sont un decaissement recurrent majeur' },
      { source: 'tva', target: 'position_tresorerie', strength: 0.7, direction: 'causes', confidence: 0.89, lag_days: 30, description: 'Le reglement TVA impacte la tresorerie avec un decalage mensuel' },
      { source: 'service_dette', target: 'position_tresorerie', strength: 0.78, direction: 'causes', confidence: 0.93, lag_days: 0, description: 'Le service de la dette est un decaissement fixe' },
      { source: 'charges_locatives', target: 'position_tresorerie', strength: 0.55, direction: 'causes', confidence: 0.82, lag_days: 15, description: 'Les charges locatives refacturees impactent la tresorerie' },
      { source: 'revenus_annexes', target: 'position_tresorerie', strength: 0.45, direction: 'causes', confidence: 0.78, lag_days: 10, description: 'Les revenus annexes (parking, publicite) completent la tresorerie' },
      { source: 'energie', target: 'charges_locatives', strength: 0.65, direction: 'causes', confidence: 0.84, lag_days: 0, description: "L'energie est une composante majeure des charges locatives" },
      { source: 'taux_occupation', target: 'charges_locatives', strength: 0.6, direction: 'causes', confidence: 0.80, lag_days: 0, description: "Le taux d'occupation module les charges refacturables" },
      { source: 'score_locataires', target: 'taux_occupation', strength: 0.58, direction: 'causes', confidence: 0.76, lag_days: 90, description: 'Les locataires a risque augmentent le taux de vacance a moyen terme' },
      { source: 'capex', target: 'taux_occupation', strength: 0.52, direction: 'prevents', confidence: 0.71, lag_days: 180, description: "Les investissements CAPEX ameliorent le taux d'occupation a long terme" },
      { source: 'saisonnalite', target: 'revenus_annexes', strength: 0.48, direction: 'causes', confidence: 0.73, lag_days: 0, description: 'La saisonnalite impacte les revenus annexes (parking, evenements)' },
    ],
  };
}

export async function getCausalDecomposition(_companyId: string, _period: string): Promise<CausalDecomposition> {
  return {
    period: 'Mars 2026',
    total_variation: -28_400_000,
    causes: [
      {
        label: 'CAPEX - Renovation Centre Commercial Plateau',
        amount: -12_780_000,
        pct: 45,
        type: 'direct',
        confidence: 0.92,
        description: 'Decaissement lie aux travaux de renovation du Centre Commercial Plateau, phase 2',
        children: [
          { label: 'Travaux gros oeuvre', amount: -8_200_000, pct: 29, type: 'root_cause', confidence: 0.95, description: 'Facture entreprise BTP Konan & Fils' },
          { label: 'Equipements techniques', amount: -4_580_000, pct: 16, type: 'root_cause', confidence: 0.90, description: 'Climatisation et electricite' },
        ],
      },
      {
        label: 'Retards locataires',
        amount: -9_088_000,
        pct: 32,
        type: 'direct',
        confidence: 0.87,
        description: 'Retards de paiement cumules de 3 locataires categories C et D',
        children: [
          { label: 'CARREFOUR Market (+12j)', amount: -4_200_000, pct: 15, type: 'root_cause', confidence: 0.91, description: 'Retard recurrent, en cours de relance' },
          { label: 'MTN Boutique (+18j)', amount: -2_888_000, pct: 10, type: 'root_cause', confidence: 0.85, description: 'Retard inhabituel, contact en cours' },
          { label: 'Jumia CI (impaye)', amount: -2_000_000, pct: 7, type: 'root_cause', confidence: 0.82, description: 'Score comportemental chute a 42, risque eleve' },
        ],
      },
      {
        label: 'Echeance TVA Fevrier',
        amount: -4_260_000,
        pct: 15,
        type: 'direct',
        confidence: 0.95,
        description: 'Reglement TVA de fevrier 2026, echeance le 25 mars',
      },
    ],
    residual_pct: 8,
    residual_amount: -2_272_000,
  };
}

export async function getCausalInterventions(_companyId: string): Promise<CausalIntervention[]> {
  return [
    {
      question: "Si j'avais relance Locataire C (CARREFOUR) 15 jours plus tot ?",
      intervention_variable: 'delai_relance_carrefour',
      intervention_value: '-15 jours',
      estimated_effect: 3_200_000,
      confidence: 0.78,
      explanation: "En relancant CARREFOUR Market 15 jours plus tot, le modele estime une probabilite de 78% d'encaisser 3.2M FCFA avant la fin du mois, reduisant le deficit de 11%.",
    },
    {
      question: 'Si je decale le CAPEX renovation de 30 jours ?',
      intervention_variable: 'date_capex_renovation',
      intervention_value: '+30 jours',
      estimated_effect: 28_000_000,
      confidence: 0.95,
      explanation: 'Le report de 30 jours du decaissement CAPEX libere temporairement 28M FCFA de tresorerie disponible. Impact: evite le passage en negatif du compte ECOBANK au 4 avril.',
    },
    {
      question: "Si le taux d'occupation passe de 87% a 92% ?",
      intervention_variable: 'taux_occupation',
      intervention_value: '92%',
      estimated_effect: 8_500_000,
      confidence: 0.72,
      explanation: "Une amelioration du taux d'occupation de 5 points genererait environ 8.5M FCFA de revenus locatifs supplementaires sur le trimestre, avec un decalage de 30-45 jours.",
    },
    {
      question: 'Si je negocie un echeancier avec Jumia CI (3 mois) ?',
      intervention_variable: 'echeancier_jumia',
      intervention_value: '3 versements mensuels',
      estimated_effect: 1_800_000,
      confidence: 0.65,
      explanation: "Un echeancier sur 3 mois avec Jumia CI permettrait de recuperer environ 1.8M FCFA des 2M impayes, avec un premier versement estime a 600K FCFA dans les 15 jours.",
    },
  ];
}

export async function getGrangerResults(_companyId: string): Promise<GrangerCausalityResult[]> {
  return [
    { source: 'Score locataires', target: 'Retards paiement', lag_days: 45, p_value: 0.002, is_significant: true, description: 'La degradation du score locataire predit significativement les retards de paiement avec un delai de 45 jours' },
    { source: 'Saisonnalite', target: 'Couts energie', lag_days: 0, p_value: 0.001, is_significant: true, description: 'La saisonnalite est un predicteur tres significatif des couts energetiques' },
    { source: "Taux d'occupation", target: 'Revenus locatifs', lag_days: 5, p_value: 0.003, is_significant: true, description: "Les variations du taux d'occupation precedent les variations de revenus locatifs de 5 jours" },
    { source: 'CAPEX', target: 'Position tresorerie', lag_days: 0, p_value: 0.008, is_significant: true, description: 'Les decaissements CAPEX ont un impact causal immediat et significatif sur la position de tresorerie' },
    { source: 'Service dette', target: 'Position tresorerie', lag_days: 0, p_value: 0.012, is_significant: true, description: 'Le service de la dette cause des variations significatives de la position de tresorerie' },
    { source: 'TVA', target: 'Position tresorerie', lag_days: 30, p_value: 0.045, is_significant: true, description: 'Les echeances TVA impactent la tresorerie avec un retard de 30 jours (p < 0.05)' },
    { source: 'Revenus annexes', target: 'Position tresorerie', lag_days: 10, p_value: 0.082, is_significant: false, description: 'Les revenus annexes montrent une tendance causale marginalement significative sur la tresorerie' },
    { source: 'Charges locatives', target: 'Revenus locatifs', lag_days: 15, p_value: 0.156, is_significant: false, description: 'Pas de relation causale significative detectee entre charges locatives et revenus locatifs' },
  ];
}

// ============================================================================
// FEDERATED LEARNING (Extension 4) — Mock data
// ============================================================================

export async function getFederatedConfig(_tenantId: string): Promise<FederatedConfig> {
  return {
    is_opted_in: true,
    opted_in_at: '2025-11-15T10:30:00Z',
    total_participants: 47,
    global_model_version: 'v2.4',
    last_aggregation: '2026-03-18T02:00:00Z',
    next_aggregation: '2026-03-25T02:00:00Z',
    privacy_level: 'high',
  };
}

export async function toggleFederatedLearning(_tenantId: string, _optIn: boolean): Promise<void> {
  // Mock: no-op
}

export async function getFederatedPerformance(_tenantId: string): Promise<FederatedPerformance[]> {
  return [
    { metric: 'MAPE J+7', local_only: 5.1, with_federated: 4.2, improvement_pct: 17.6 },
    { metric: 'MAPE J+30', local_only: 6.8, with_federated: 5.2, improvement_pct: 23.5 },
    { metric: 'MAPE J+90', local_only: 14.2, with_federated: 11.8, improvement_pct: 16.9 },
    { metric: 'Precision scoring', local_only: 88.5, with_federated: 92.3, improvement_pct: 4.3 },
  ];
}

export async function getFederatedAuditLog(_tenantId: string): Promise<FederatedAuditEntry[]> {
  return [
    { date: '2026-03-18T02:15:00Z', action: 'global_model_received', model_type: 'Ensemble', parameters_count: 0, dp_noise_level: 0, description: 'Modele global v2.4 recu et applique avec succes' },
    { date: '2026-03-18T02:00:00Z', action: 'parameters_shared', model_type: 'Ensemble', parameters_count: 12480, dp_noise_level: 0.15, description: 'Poids du modele ensemble partages avec bruit differentiel epsilon=0.15' },
    { date: '2026-03-11T02:15:00Z', action: 'global_model_received', model_type: 'Ensemble', parameters_count: 0, dp_noise_level: 0, description: 'Modele global v2.3 recu et applique avec succes' },
    { date: '2026-03-11T02:00:00Z', action: 'parameters_shared', model_type: 'Ensemble', parameters_count: 12480, dp_noise_level: 0.15, description: 'Poids du modele ensemble partages avec bruit differentiel epsilon=0.15' },
    { date: '2026-03-04T02:15:00Z', action: 'global_model_received', model_type: 'SARIMA', parameters_count: 0, dp_noise_level: 0, description: 'Modele global SARIMA v1.8 recu et applique' },
    { date: '2026-03-04T02:00:00Z', action: 'parameters_shared', model_type: 'SARIMA', parameters_count: 3200, dp_noise_level: 0.12, description: 'Poids SARIMA partages avec bruit differentiel epsilon=0.12' },
    { date: '2026-02-25T02:15:00Z', action: 'global_model_received', model_type: 'Ensemble', parameters_count: 0, dp_noise_level: 0, description: 'Modele global v2.2 recu et applique' },
    { date: '2026-02-25T02:00:00Z', action: 'parameters_shared', model_type: 'Ensemble', parameters_count: 12480, dp_noise_level: 0.15, description: 'Poids du modele ensemble partages' },
    { date: '2026-02-18T02:00:00Z', action: 'parameters_shared', model_type: 'XGBoost', parameters_count: 8500, dp_noise_level: 0.18, description: 'Poids XGBoost scoring partages avec bruit differentiel epsilon=0.18' },
    { date: '2025-11-15T10:30:00Z', action: 'opted_in', model_type: '-', parameters_count: 0, dp_noise_level: 0, description: "Opt-in au programme d'apprentissage federe de CashPilot" },
  ];
}
