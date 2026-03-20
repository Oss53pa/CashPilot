-- ============================================================================
-- Migration 010 — Proph3t Treasury Engine AI Tables
-- All tables for the 8 AI capabilities
-- ============================================================================

-- ============================================================================
-- PROPH3T MODEL CONFIGURATION
-- Stores trained model parameters per company per category
-- ============================================================================
CREATE TABLE proph3t_model_config (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  category        TEXT NOT NULL,
  model_type      TEXT NOT NULL,    -- wma / holt_winters / arima / sarima / prophet / lstm / ensemble
  model_params    JSONB NOT NULL,   -- model-specific parameters (p,d,q for ARIMA, alpha/beta/gamma for HW, etc.)
  history_months  INTEGER NOT NULL,
  backtest_mape   NUMERIC NOT NULL,
  backtest_mae    NUMERIC NOT NULL,
  backtest_rmse   NUMERIC,
  backtest_bias   NUMERIC,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  trained_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  model_path      TEXT,             -- Supabase Storage path for LSTM weights
  UNIQUE(tenant_id, company_id, category, is_active) -- only one active model per category
);

CREATE INDEX idx_proph3t_model_config_lookup
  ON proph3t_model_config(tenant_id, company_id, category) WHERE is_active = TRUE;

-- ============================================================================
-- PROPH3T FORECASTS
-- AI-generated forecasts with confidence intervals
-- ============================================================================
CREATE TABLE proph3t_forecasts (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  company_id        UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  counterparty_id   UUID REFERENCES counterparties(id),
  account_id        UUID REFERENCES bank_accounts(id),
  category          TEXT NOT NULL,
  forecast_date     DATE NOT NULL,
  horizon           INTEGER NOT NULL,           -- days from generation date
  amount_central    BIGINT NOT NULL,            -- central value in centimes
  amount_lower_80   BIGINT,                     -- 80% CI lower bound
  amount_upper_80   BIGINT,                     -- 80% CI upper bound
  amount_lower_95   BIGINT,                     -- 95% CI lower bound
  amount_upper_95   BIGINT,                     -- 95% CI upper bound
  probability       NUMERIC NOT NULL DEFAULT 1.0,
  model_used        TEXT NOT NULL,              -- wma / holt_winters / arima / sarima / prophet / lstm / ensemble
  model_mape        NUMERIC,                    -- historical MAPE of the model used
  confidence_score  NUMERIC,                    -- 0-1 confidence score
  history_months    INTEGER,                    -- months of history available at generation time
  scenario          TEXT NOT NULL DEFAULT 'base', -- base / optimistic / pessimistic
  -- Realization tracking
  is_realized       BOOLEAN NOT NULL DEFAULT FALSE,
  realized_amount   BIGINT,
  realized_date     DATE,
  error_amount      BIGINT,                     -- realized_amount - amount_central
  error_pct         NUMERIC,                    -- |error| / |amount_central|
  -- Metadata
  generated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  generated_by_run  UUID                        -- reference to the forecast run
);

CREATE INDEX idx_proph3t_forecasts_lookup
  ON proph3t_forecasts(tenant_id, company_id, forecast_date, scenario);
CREATE INDEX idx_proph3t_forecasts_counterparty
  ON proph3t_forecasts(tenant_id, company_id, counterparty_id, forecast_date);
CREATE INDEX idx_proph3t_forecasts_run
  ON proph3t_forecasts(generated_by_run);

-- ============================================================================
-- PROPH3T ANOMALIES
-- Detected anomalies on cash flow transactions
-- ============================================================================
CREATE TABLE proph3t_anomalies (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  company_id          UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  cash_flow_id        UUID REFERENCES cash_flows(id),
  payment_request_id  UUID REFERENCES payment_requests(id),
  anomaly_score       NUMERIC NOT NULL,                -- 0.0 to 1.0
  severity            TEXT NOT NULL,                    -- normal / watch / alert / critical
  features            JSONB NOT NULL,                   -- computed feature values
  top_reasons         JSONB NOT NULL,                   -- top 3 contributing features
  human_readable      TEXT NOT NULL,                    -- human-readable explanation
  status              TEXT NOT NULL DEFAULT 'open',     -- open / investigated / cleared / confirmed_fraud
  investigated_by     UUID REFERENCES auth.users(id),
  investigation_note  TEXT,
  resolved_at         TIMESTAMPTZ,
  detected_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_proph3t_anomalies_lookup
  ON proph3t_anomalies(tenant_id, company_id, detected_at);
CREATE INDEX idx_proph3t_anomalies_severity
  ON proph3t_anomalies(tenant_id, company_id, severity) WHERE status = 'open';

-- ============================================================================
-- PROPH3T TENANT SCORES
-- Behavioral scoring of tenants (counterparties)
-- ============================================================================
CREATE TABLE proph3t_tenant_scores (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  company_id          UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  counterparty_id     UUID NOT NULL REFERENCES counterparties(id) ON DELETE CASCADE,
  score               INTEGER NOT NULL,                -- 0 to 100
  raw_probability     NUMERIC NOT NULL,                -- raw XGBoost probability
  classification      TEXT NOT NULL,                   -- excellent / good / watch / at_risk / critical
  trend               TEXT NOT NULL,                   -- improving / stable / degrading / critical_degradation
  delta_4weeks        INTEGER,                         -- score change over 4 weeks
  recommended_action  TEXT NOT NULL,                   -- none / monitor / preventive_contact / formal_notice / legal_procedure
  features_snapshot   JSONB NOT NULL,                  -- features at scoring time
  shap_values         JSONB,                           -- SHAP values for explainability
  top_risk_factors    JSONB,                           -- top 3 risk factors
  model_version       TEXT NOT NULL,                   -- XGBoost model version
  scored_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_proph3t_tenant_scores_lookup
  ON proph3t_tenant_scores(tenant_id, company_id, counterparty_id, scored_at DESC);

-- View for latest score per counterparty
CREATE VIEW latest_tenant_scores AS
SELECT DISTINCT ON (tenant_id, company_id, counterparty_id)
  *
FROM proph3t_tenant_scores
ORDER BY tenant_id, company_id, counterparty_id, scored_at DESC;

-- ============================================================================
-- PROPH3T ALERTS
-- Predictive alerts generated by the alert engine
-- ============================================================================
CREATE TABLE proph3t_alerts (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  company_id          UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  rule_id             TEXT NOT NULL,                    -- liquidity_tension / recovery_risk / account_imbalance / ...
  category            TEXT NOT NULL,                    -- liquidity / receivables / accounts / debt / investment / fraud
  priority            TEXT NOT NULL,                    -- critical / high / medium / low
  title               TEXT NOT NULL,
  summary             TEXT NOT NULL,                    -- one-line summary
  details             JSONB NOT NULL,                   -- full evaluation details
  causes              JSONB,                            -- identified causes
  remediation_options JSONB,                            -- remediation options with estimated impact
  breach_date         DATE,                             -- estimated impact date
  breach_amount       BIGINT,                           -- estimated deficit amount
  probability         NUMERIC,                          -- impact probability
  status              TEXT NOT NULL DEFAULT 'open',     -- open / acknowledged / actioned / resolved / dismissed
  actioned_by         UUID REFERENCES auth.users(id),
  action_taken        TEXT,
  resolved_at         TIMESTAMPTZ,
  notification_sent   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_proph3t_alerts_lookup
  ON proph3t_alerts(tenant_id, company_id, status, priority);
CREATE INDEX idx_proph3t_alerts_rule
  ON proph3t_alerts(tenant_id, company_id, rule_id, created_at DESC);

-- ============================================================================
-- PROPH3T NARRATIVES
-- Weekly auto-generated narrative reports
-- ============================================================================
CREATE TABLE proph3t_narratives (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  company_id    UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  period_start  DATE NOT NULL,
  period_end    DATE NOT NULL,
  scope         TEXT NOT NULL DEFAULT 'company',  -- company / group
  sections      JSONB NOT NULL,                   -- array of {title, content, sentiment, data_points}
  full_text     TEXT NOT NULL,                    -- assembled full text
  sentiment     TEXT NOT NULL,                    -- overall: positive / neutral / warning / critical
  key_metrics   JSONB NOT NULL,                   -- key metrics for the period
  language      TEXT NOT NULL DEFAULT 'fr',        -- fr / en
  generated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_proph3t_narratives_lookup
  ON proph3t_narratives(tenant_id, company_id, period_end DESC);

-- ============================================================================
-- PROPH3T RECOMMENDATIONS
-- Action recommendations per alert
-- ============================================================================
CREATE TABLE proph3t_recommendations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  alert_id        UUID REFERENCES proph3t_alerts(id) ON DELETE CASCADE,
  options         JSONB NOT NULL,                -- array of RemediationOption
  selected_option TEXT,                           -- action chosen by user
  selected_by     UUID REFERENCES auth.users(id),
  selected_at     TIMESTAMPTZ,
  outcome         TEXT,                           -- result after action (user feedback)
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_proph3t_recommendations_alert
  ON proph3t_recommendations(alert_id);

-- ============================================================================
-- PROPH3T WHAT-IF SESSIONS
-- Conversational what-if simulation sessions
-- ============================================================================
CREATE TABLE proph3t_whatif_sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES auth.users(id),
  query_text      TEXT NOT NULL,
  intent_detected TEXT NOT NULL,
  confidence      NUMERIC NOT NULL,
  result          JSONB NOT NULL,
  narrative       TEXT NOT NULL,                  -- natural language response
  execution_ms    INTEGER,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_proph3t_whatif_sessions_user
  ON proph3t_whatif_sessions(tenant_id, company_id, user_id, created_at DESC);

-- ============================================================================
-- PROPH3T FRAUD ALERTS
-- Real-time fraud detection results
-- ============================================================================
CREATE TABLE proph3t_fraud_alerts (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  company_id          UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  rule_id             TEXT NOT NULL,                    -- payment_smurfing / ghost_vendor / duplicate_payment / ...
  severity            TEXT NOT NULL,                    -- medium / high / critical
  fraud_score         NUMERIC NOT NULL,
  cash_flow_id        UUID REFERENCES cash_flows(id),
  payment_request_id  UUID REFERENCES payment_requests(id),
  evidence            JSONB NOT NULL,                   -- detailed evidence
  message             TEXT NOT NULL,                    -- human-readable message
  transaction_blocked BOOLEAN NOT NULL DEFAULT FALSE,
  status              TEXT NOT NULL DEFAULT 'open',     -- open / investigating / cleared / confirmed
  investigated_by     UUID REFERENCES auth.users(id),
  investigation_notes TEXT,
  resolved_at         TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_proph3t_fraud_alerts_lookup
  ON proph3t_fraud_alerts(tenant_id, company_id, status);
CREATE INDEX idx_proph3t_fraud_alerts_tx
  ON proph3t_fraud_alerts(cash_flow_id) WHERE cash_flow_id IS NOT NULL;

-- ============================================================================
-- PROPH3T PERFORMANCE LOG
-- Model performance tracking over time
-- ============================================================================
CREATE TABLE proph3t_performance_log (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  company_id       UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  run_date         DATE NOT NULL,
  horizon_days     INTEGER NOT NULL,
  category         TEXT NOT NULL,
  model_used       TEXT NOT NULL,
  predicted_amount BIGINT NOT NULL,
  actual_amount    BIGINT,                       -- filled when realized data is available
  error_amount     BIGINT,                       -- actual - predicted
  error_pct        NUMERIC,                      -- |error| / |actual|
  is_realized      BOOLEAN NOT NULL DEFAULT FALSE,
  execution_ms     INTEGER,                      -- Edge Function execution time
  error_message    TEXT,                          -- error details if function failed
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_proph3t_performance_log_lookup
  ON proph3t_performance_log(tenant_id, company_id, run_date, category);

-- ============================================================================
-- ROW LEVEL SECURITY — All Proph3t tables
-- ============================================================================

ALTER TABLE proph3t_model_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "proph3t_tenant_isolation" ON proph3t_model_config
  FOR ALL USING (tenant_id = get_user_tenant_id() AND company_id IN (SELECT get_user_company_ids()));

ALTER TABLE proph3t_forecasts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "proph3t_tenant_isolation" ON proph3t_forecasts
  FOR ALL USING (tenant_id = get_user_tenant_id() AND company_id IN (SELECT get_user_company_ids()));

ALTER TABLE proph3t_anomalies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "proph3t_tenant_isolation" ON proph3t_anomalies
  FOR ALL USING (tenant_id = get_user_tenant_id() AND company_id IN (SELECT get_user_company_ids()));

ALTER TABLE proph3t_tenant_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "proph3t_tenant_isolation" ON proph3t_tenant_scores
  FOR ALL USING (tenant_id = get_user_tenant_id() AND company_id IN (SELECT get_user_company_ids()));

ALTER TABLE proph3t_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "proph3t_tenant_isolation" ON proph3t_alerts
  FOR ALL USING (tenant_id = get_user_tenant_id() AND company_id IN (SELECT get_user_company_ids()));

ALTER TABLE proph3t_narratives ENABLE ROW LEVEL SECURITY;
CREATE POLICY "proph3t_tenant_isolation" ON proph3t_narratives
  FOR ALL USING (tenant_id = get_user_tenant_id() AND company_id IN (SELECT get_user_company_ids()));

ALTER TABLE proph3t_recommendations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "proph3t_tenant_isolation" ON proph3t_recommendations
  FOR ALL USING (tenant_id = get_user_tenant_id() AND company_id IN (SELECT get_user_company_ids()));

ALTER TABLE proph3t_whatif_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "proph3t_tenant_isolation" ON proph3t_whatif_sessions
  FOR ALL USING (tenant_id = get_user_tenant_id() AND company_id IN (SELECT get_user_company_ids()));

ALTER TABLE proph3t_fraud_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "proph3t_tenant_isolation" ON proph3t_fraud_alerts
  FOR ALL USING (tenant_id = get_user_tenant_id() AND company_id IN (SELECT get_user_company_ids()));

ALTER TABLE proph3t_performance_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "proph3t_tenant_isolation" ON proph3t_performance_log
  FOR ALL USING (tenant_id = get_user_tenant_id() AND company_id IN (SELECT get_user_company_ids()));

-- ============================================================================
-- ENABLE REALTIME for push notifications
-- ============================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE proph3t_alerts;
ALTER PUBLICATION supabase_realtime ADD TABLE proph3t_fraud_alerts;
ALTER PUBLICATION supabase_realtime ADD TABLE proph3t_anomalies;
ALTER PUBLICATION supabase_realtime ADD TABLE proph3t_forecasts;
