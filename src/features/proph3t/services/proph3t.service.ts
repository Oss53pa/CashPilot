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
  return (data ?? []) as Proph3tForecast[];
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
  return (data ?? []) as Proph3tAnomaly[];
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
  return (data ?? []) as Proph3tTenantScore[];
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
  return (data ?? []) as Proph3tTenantScore[];
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
  return (data ?? []) as Proph3tAlert[];
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

  if (error && error.code !== 'PGRST116') throw error;
  return (data as Proph3tNarrative) ?? null;
}

export async function getNarrativeHistory(companyId: string, limit = 10) {
  const { data, error } = await supabase
    .from('proph3t_narratives')
    .select('*')
    .eq('company_id', companyId)
    .order('generated_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as Proph3tNarrative[];
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
  return (data ?? []) as Proph3tRecommendation[];
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
  return (data ?? []) as Proph3tWhatIfSession[];
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
  return (data ?? []) as Proph3tFraudAlert[];
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
  return (data ?? []) as Proph3tPerformanceLog[];
}

export async function getActiveModelConfigs(companyId: string) {
  const { data, error } = await supabase
    .from('proph3t_model_config')
    .select('*')
    .eq('company_id', companyId)
    .eq('is_active', true)
    .order('category');

  if (error) throw error;
  return (data ?? []) as Proph3tModelConfig[];
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

export async function getUncertaintyDistribution(
  companyId: string,
  forecastId: string
): Promise<UncertaintyDistribution> {
  const { data, error } = await supabase
    .from('proph3t_uncertainty_distributions')
    .select('*')
    .eq('company_id', companyId)
    .eq('forecast_id', forecastId)
    .single();

  if (error && error.code === 'PGRST116') {
    // Return empty structure when no data
    return {
      forecast_id: forecastId,
      target_date: '',
      central: 0,
      mean: 0,
      median: 0,
      std_dev: 0,
      percentiles: { p5: 0, p10: 0, p25: 0, p50: 0, p75: 0, p90: 0, p95: 0 },
      density_points: [],
      aleatoric_variance: 0,
      epistemic_variance: 0,
      total_variance: 0,
      credible_interval_80: [0, 0],
      credible_interval_95: [0, 0],
      mc_dropout_samples: 0,
    };
  }
  if (error) throw error;
  return data as UncertaintyDistribution;
}

export async function getFanChartData(
  companyId: string
): Promise<FanChartPoint[]> {
  const { data, error } = await supabase
    .from('proph3t_fan_chart')
    .select('*')
    .eq('company_id', companyId)
    .order('date', { ascending: true });

  if (error) throw error;
  return (data ?? []) as FanChartPoint[];
}

export async function getCalibrationData(
  companyId: string
): Promise<CalibrationData> {
  const { data, error } = await supabase
    .from('proph3t_calibration')
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code === 'PGRST116') {
    return {
      expected_coverage: [],
      actual_coverage: [],
      ece: 0,
      is_well_calibrated: false,
    };
  }
  if (error) throw error;
  return data as CalibrationData;
}

export async function getUncertaintyDecomposition(
  companyId: string
): Promise<UncertaintyDecomposition[]> {
  const { data, error } = await supabase
    .from('proph3t_uncertainty_decomposition')
    .select('*')
    .eq('company_id', companyId)
    .order('horizon');

  if (error) throw error;
  return (data ?? []) as UncertaintyDecomposition[];
}

export async function queryProbability(
  companyId: string,
  date: string,
  threshold: number
): Promise<ProbabilityQuery> {
  const { data, error } = await supabase
    .from('proph3t_probability_queries')
    .select('*')
    .eq('company_id', companyId)
    .eq('date', date)
    .eq('threshold', threshold)
    .single();

  if (error && error.code === 'PGRST116') {
    // Compute via edge function if not cached
    const { data: result, error: fnError } = await supabase.functions.invoke('proph3t-probability', {
      body: { company_id: companyId, date, threshold },
    });
    if (fnError) throw fnError;
    return result as ProbabilityQuery;
  }
  if (error) throw error;
  return data as ProbabilityQuery;
}

// ============================================================================
// ANOMALY EXPLANATIONS (Extension 3)
// ============================================================================

export async function getAnomalyExplanation(
  anomalyId: string
): Promise<AnomalyExplanation> {
  const { data, error } = await supabase
    .from('proph3t_anomaly_explanations')
    .select('*')
    .eq('anomaly_id', anomalyId)
    .single();

  if (error && error.code === 'PGRST116') {
    return {
      anomaly_id: anomalyId,
      transaction_id: '',
      transaction_description: '',
      anomaly_score: 0,
      anomaly_features: [],
      counterfactuals: [],
      user_feedback: null,
      generated_at: '',
    };
  }
  if (error) throw error;
  return data as AnomalyExplanation;
}

// ============================================================================
// CAUSAL AI (Extension 6)
// ============================================================================

export async function getCausalGraph(companyId: string): Promise<CausalGraph> {
  const { data, error } = await supabase
    .from('proph3t_causal_graphs')
    .select('*')
    .eq('company_id', companyId)
    .order('last_updated', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code === 'PGRST116') {
    return { last_updated: '', min_history_months: 0, nodes: [], edges: [] };
  }
  if (error) throw error;
  return data as CausalGraph;
}

export async function getCausalDecomposition(companyId: string, period: string): Promise<CausalDecomposition> {
  const { data, error } = await supabase
    .from('proph3t_causal_decompositions')
    .select('*')
    .eq('company_id', companyId)
    .eq('period', period)
    .single();

  if (error && error.code === 'PGRST116') {
    return { period, total_variation: 0, causes: [], residual_pct: 0, residual_amount: 0 };
  }
  if (error) throw error;
  return data as CausalDecomposition;
}

export async function getCausalInterventions(companyId: string): Promise<CausalIntervention[]> {
  const { data, error } = await supabase
    .from('proph3t_causal_interventions')
    .select('*')
    .eq('company_id', companyId)
    .order('confidence', { ascending: false });

  if (error) throw error;
  return (data ?? []) as CausalIntervention[];
}

export async function getGrangerResults(companyId: string): Promise<GrangerCausalityResult[]> {
  const { data, error } = await supabase
    .from('proph3t_granger_results')
    .select('*')
    .eq('company_id', companyId)
    .order('p_value', { ascending: true });

  if (error) throw error;
  return (data ?? []) as GrangerCausalityResult[];
}

// ============================================================================
// FEDERATED LEARNING (Extension 4)
// ============================================================================

export async function getFederatedConfig(tenantId: string): Promise<FederatedConfig> {
  const { data, error } = await supabase
    .from('proph3t_federated_config')
    .select('*')
    .eq('tenant_id', tenantId)
    .single();

  if (error && error.code === 'PGRST116') {
    return {
      is_opted_in: false,
      opted_in_at: '',
      total_participants: 0,
      global_model_version: '',
      last_aggregation: '',
      next_aggregation: '',
      privacy_level: 'high',
    };
  }
  if (error) throw error;
  return data as FederatedConfig;
}

export async function toggleFederatedLearning(tenantId: string, optIn: boolean): Promise<void> {
  const { error } = await supabase
    .from('proph3t_federated_config')
    .upsert({
      tenant_id: tenantId,
      is_opted_in: optIn,
      opted_in_at: optIn ? new Date().toISOString() : null,
    }, { onConflict: 'tenant_id' });

  if (error) throw error;
}

export async function getFederatedPerformance(tenantId: string): Promise<FederatedPerformance[]> {
  const { data, error } = await supabase
    .from('proph3t_federated_performance')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('metric');

  if (error) throw error;
  return (data ?? []) as FederatedPerformance[];
}

export async function getFederatedAuditLog(tenantId: string): Promise<FederatedAuditEntry[]> {
  const { data, error } = await supabase
    .from('proph3t_federated_audit')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('date', { ascending: false });

  if (error) throw error;
  return (data ?? []) as FederatedAuditEntry[];
}
