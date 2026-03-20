// ============================================================================
// Proph3t Treasury Engine — TypeScript Types
// ============================================================================

// --- Model types ---

export type ModelType = 'wma' | 'holt_winters' | 'arima' | 'sarima' | 'prophet' | 'lstm' | 'ensemble';

export type ForecastScenario = 'base' | 'optimistic' | 'pessimistic';

export interface Proph3tModelConfig {
  id: string;
  tenant_id: string;
  company_id: string;
  category: string;
  model_type: ModelType;
  model_params: Record<string, unknown>;
  history_months: number;
  backtest_mape: number;
  backtest_mae: number;
  backtest_rmse: number | null;
  backtest_bias: number | null;
  is_active: boolean;
  trained_at: string;
  model_path: string | null;
}

// --- Forecasts ---

export interface Proph3tForecast {
  id: string;
  tenant_id: string;
  company_id: string;
  counterparty_id: string | null;
  account_id: string | null;
  category: string;
  forecast_date: string;
  horizon: number;
  amount_central: number;
  amount_lower_80: number | null;
  amount_upper_80: number | null;
  amount_lower_95: number | null;
  amount_upper_95: number | null;
  probability: number;
  model_used: ModelType;
  model_mape: number | null;
  confidence_score: number | null;
  history_months: number | null;
  scenario: ForecastScenario;
  is_realized: boolean;
  realized_amount: number | null;
  realized_date: string | null;
  error_amount: number | null;
  error_pct: number | null;
  generated_at: string;
  generated_by_run: string | null;
}

export interface ForecastPoint {
  date: string;
  central: number;
  lower80: number;
  upper80: number;
  lower95: number;
  upper95: number;
}

export interface ForecastSummary {
  current_position: number;
  forecast_7d: ForecastPoint;
  forecast_30d: ForecastPoint;
  forecast_90d: ForecastPoint;
  forecast_365d: ForecastPoint;
  model_used: ModelType;
  model_mape: number;
}

// --- Anomalies ---

export type AnomalySeverity = 'normal' | 'watch' | 'alert' | 'critical';

export interface AnomalyFeatureContribution {
  feature: string;
  value: number;
  contribution: number;
  description: string;
}

export interface Proph3tAnomaly {
  id: string;
  tenant_id: string;
  company_id: string;
  cash_flow_id: string | null;
  payment_request_id: string | null;
  anomaly_score: number;
  severity: AnomalySeverity;
  features: Record<string, number>;
  top_reasons: AnomalyFeatureContribution[];
  human_readable: string;
  status: 'open' | 'investigated' | 'cleared' | 'confirmed_fraud';
  investigated_by: string | null;
  investigation_note: string | null;
  resolved_at: string | null;
  detected_at: string;
}

// --- Tenant Scores ---

export type ScoreClassification = 'excellent' | 'good' | 'watch' | 'at_risk' | 'critical';
export type ScoreTrend = 'improving' | 'stable' | 'degrading' | 'critical_degradation';
export type RecommendedAction = 'none' | 'monitor' | 'preventive_contact' | 'formal_notice' | 'legal_procedure';

export interface Proph3tTenantScore {
  id: string;
  tenant_id: string;
  company_id: string;
  counterparty_id: string;
  score: number;
  raw_probability: number;
  classification: ScoreClassification;
  trend: ScoreTrend;
  delta_4weeks: number | null;
  recommended_action: RecommendedAction;
  features_snapshot: Record<string, number>;
  shap_values: Record<string, number> | null;
  top_risk_factors: AnomalyFeatureContribution[] | null;
  model_version: string;
  scored_at: string;
}

// --- Alerts ---

export type AlertPriority = 'critical' | 'high' | 'medium' | 'low';
export type AlertCategory = 'liquidity' | 'receivables' | 'accounts' | 'debt' | 'investment' | 'fraud';
export type AlertStatus = 'open' | 'acknowledged' | 'actioned' | 'resolved' | 'dismissed';

export interface Proph3tAlert {
  id: string;
  tenant_id: string;
  company_id: string;
  rule_id: string;
  category: AlertCategory;
  priority: AlertPriority;
  title: string;
  summary: string;
  details: Record<string, unknown>;
  causes: Record<string, unknown>[] | null;
  remediation_options: RemediationOption[] | null;
  breach_date: string | null;
  breach_amount: number | null;
  probability: number | null;
  status: AlertStatus;
  actioned_by: string | null;
  action_taken: string | null;
  resolved_at: string | null;
  notification_sent: boolean;
  created_at: string;
}

// --- Narratives ---

export type NarrativeSentiment = 'positive' | 'neutral' | 'warning' | 'critical';

export interface NarrativeSection {
  title: string;
  content: string;
  sentiment: NarrativeSentiment;
  data_points: { label: string; value: string | number }[];
}

export interface Proph3tNarrative {
  id: string;
  tenant_id: string;
  company_id: string;
  period_start: string;
  period_end: string;
  scope: 'company' | 'group';
  sections: NarrativeSection[];
  full_text: string;
  sentiment: NarrativeSentiment;
  key_metrics: Record<string, unknown>;
  language: 'fr' | 'en';
  generated_at: string;
}

// --- Recommendations ---

export interface RemediationOption {
  action: string;
  description: string;
  amount: number;
  cost: number;
  delay_days: number;
  impact: string;
  probability_of_success: number;
  warning?: string;
  steps: string[] | Record<string, unknown>[];
  composite_score?: number;
}

export interface Proph3tRecommendation {
  id: string;
  tenant_id: string;
  company_id: string;
  alert_id: string | null;
  options: RemediationOption[];
  selected_option: string | null;
  selected_by: string | null;
  selected_at: string | null;
  outcome: string | null;
  created_at: string;
}

// --- What-If ---

export type WhatIfIntent =
  | 'position_if_no_payment'
  | 'position_if_investment'
  | 'max_capex_budget'
  | 'credit_line_impact'
  | 'scenario_comparison'
  | 'days_of_cash'
  | 'break_even_date'
  | 'stress_test';

export interface Proph3tWhatIfSession {
  id: string;
  tenant_id: string;
  company_id: string;
  user_id: string | null;
  query_text: string;
  intent_detected: WhatIfIntent;
  confidence: number;
  result: Record<string, unknown>;
  narrative: string;
  execution_ms: number | null;
  created_at: string;
}

// --- Fraud ---

export type FraudRuleId =
  | 'payment_smurfing'
  | 'ghost_vendor'
  | 'duplicate_payment'
  | 'rib_change_then_payment'
  | 'cash_register_manipulation'
  | 'unauthorized_transfer'
  | 'off_hours_transaction'
  | 'excess_cash_not_deposited';

export type FraudSeverity = 'medium' | 'high' | 'critical';
export type FraudStatus = 'open' | 'investigating' | 'cleared' | 'confirmed';

export interface Proph3tFraudAlert {
  id: string;
  tenant_id: string;
  company_id: string;
  rule_id: FraudRuleId;
  severity: FraudSeverity;
  fraud_score: number;
  cash_flow_id: string | null;
  payment_request_id: string | null;
  evidence: Record<string, unknown>;
  message: string;
  transaction_blocked: boolean;
  status: FraudStatus;
  investigated_by: string | null;
  investigation_notes: string | null;
  resolved_at: string | null;
  created_at: string;
}

// --- Performance ---

export interface Proph3tPerformanceLog {
  id: string;
  tenant_id: string;
  company_id: string;
  run_date: string;
  horizon_days: number;
  category: string;
  model_used: ModelType;
  predicted_amount: number;
  actual_amount: number | null;
  error_amount: number | null;
  error_pct: number | null;
  is_realized: boolean;
  execution_ms: number | null;
  error_message: string | null;
  created_at: string;
}
