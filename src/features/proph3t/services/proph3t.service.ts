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
