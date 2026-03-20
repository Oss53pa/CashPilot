-- ============================================================================
-- Migration 011 — Proph3t pg_cron Schedules & PostgreSQL Triggers
-- Orchestration for automated AI pipeline execution
-- ============================================================================

-- Requires extensions (created in migration 001):
--   pg_cron (for scheduled tasks)
--   pg_net (for HTTP calls from PostgreSQL to Edge Functions)

-- ============================================================================
-- PG_CRON SCHEDULED TASKS
-- ============================================================================

-- Note: In production, replace the URL with your actual Supabase project URL.
-- The service_role_key should be stored in app.settings or vault.

-- ─────────────────────────────────────────────────────────────
-- DAILY — Forecast recalculation (06:00 UTC = 06:00 Abidjan)
-- ─────────────────────────────────────────────────────────────
SELECT cron.schedule(
  'proph3t-daily-forecast',
  '0 6 * * *',
  $$
  SELECT net.http_post(
    url := current_setting('app.supabase_url') || '/functions/v1/proph3t-forecast',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.service_role_key')
    ),
    body := jsonb_build_object(
      'scope', 'all_active_companies',
      'horizon_days', ARRAY[7, 30],
      'triggered_by', 'pg_cron'
    )
  );
  $$
);

-- ─────────────────────────────────────────────────────────────
-- DAILY — Evening alert check (18:00 UTC)
-- ─────────────────────────────────────────────────────────────
SELECT cron.schedule(
  'proph3t-evening-alert-check',
  '0 18 * * *',
  $$
  SELECT net.http_post(
    url := current_setting('app.supabase_url') || '/functions/v1/proph3t-alert-engine',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.service_role_key')
    ),
    body := jsonb_build_object(
      'scope', 'all_active_companies',
      'triggered_by', 'pg_cron'
    )
  );
  $$
);

-- ─────────────────────────────────────────────────────────────
-- WEEKLY — Monday 05:00 UTC: Tenant behavior scoring
-- ─────────────────────────────────────────────────────────────
SELECT cron.schedule(
  'proph3t-weekly-behavior-score',
  '0 5 * * 1',
  $$
  SELECT net.http_post(
    url := current_setting('app.supabase_url') || '/functions/v1/proph3t-behavior-score',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.service_role_key')
    ),
    body := jsonb_build_object(
      'scope', 'all_active_companies',
      'triggered_by', 'pg_cron'
    )
  );
  $$
);

-- ─────────────────────────────────────────────────────────────
-- WEEKLY — Monday 06:00 UTC: Full forecast (all horizons)
-- ─────────────────────────────────────────────────────────────
SELECT cron.schedule(
  'proph3t-weekly-full-forecast',
  '0 6 * * 1',
  $$
  SELECT net.http_post(
    url := current_setting('app.supabase_url') || '/functions/v1/proph3t-forecast',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.service_role_key')
    ),
    body := jsonb_build_object(
      'scope', 'all_active_companies',
      'horizon_days', ARRAY[7, 30, 90, 365],
      'triggered_by', 'pg_cron'
    )
  );
  $$
);

-- ─────────────────────────────────────────────────────────────
-- WEEKLY — Monday 07:00 UTC: Narrative generation
-- ─────────────────────────────────────────────────────────────
SELECT cron.schedule(
  'proph3t-weekly-narrative',
  '0 7 * * 1',
  $$
  SELECT net.http_post(
    url := current_setting('app.supabase_url') || '/functions/v1/proph3t-narrative',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.service_role_key')
    ),
    body := jsonb_build_object(
      'scope', 'all_active_companies',
      'triggered_by', 'pg_cron'
    )
  );
  $$
);

-- ─────────────────────────────────────────────────────────────
-- MONTHLY — 1st at 02:00 UTC: Model retraining
-- ─────────────────────────────────────────────────────────────
SELECT cron.schedule(
  'proph3t-monthly-retrain',
  '0 2 1 * *',
  $$
  SELECT net.http_post(
    url := current_setting('app.supabase_url') || '/functions/v1/proph3t-retrain',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.service_role_key')
    ),
    body := jsonb_build_object(
      'scope', 'all_active_companies',
      'triggered_by', 'pg_cron'
    )
  );
  $$
);

-- ─────────────────────────────────────────────────────────────
-- MONTHLY — 1st at 03:00 UTC: Model selection (after retrain)
-- ─────────────────────────────────────────────────────────────
SELECT cron.schedule(
  'proph3t-monthly-model-select',
  '0 3 1 * *',
  $$
  SELECT net.http_post(
    url := current_setting('app.supabase_url') || '/functions/v1/proph3t-model-select',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.service_role_key')
    ),
    body := jsonb_build_object(
      'scope', 'all_active_companies',
      'triggered_by', 'pg_cron'
    )
  );
  $$
);

-- ============================================================================
-- POSTGRESQL TRIGGERS — Real-time detection on INSERT
-- ============================================================================

-- ─────────────────────────────────────────────────────────────
-- Trigger on cash_flows INSERT → anomaly scan + fraud check
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION trigger_proph3t_cash_flow_analysis()
RETURNS TRIGGER AS $$
BEGIN
  -- Anomaly scan (async, non-blocking)
  PERFORM net.http_post(
    url := current_setting('app.supabase_url') || '/functions/v1/proph3t-anomaly-scan',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.service_role_key')
    ),
    body := jsonb_build_object(
      'cash_flow_id', NEW.id,
      'tenant_id', NEW.tenant_id,
      'company_id', NEW.company_id
    )
  );

  -- Fraud check (async, non-blocking)
  PERFORM net.http_post(
    url := current_setting('app.supabase_url') || '/functions/v1/proph3t-fraud-check',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.service_role_key')
    ),
    body := jsonb_build_object(
      'transaction_id', NEW.id,
      'transaction_type', 'cash_flow',
      'tenant_id', NEW.tenant_id,
      'company_id', NEW.company_id
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER proph3t_on_cash_flow_insert
  AFTER INSERT ON cash_flows
  FOR EACH ROW
  EXECUTE FUNCTION trigger_proph3t_cash_flow_analysis();

-- ─────────────────────────────────────────────────────────────
-- Trigger on payment_requests INSERT → fraud check only
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION trigger_proph3t_payment_fraud()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM net.http_post(
    url := current_setting('app.supabase_url') || '/functions/v1/proph3t-fraud-check',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.service_role_key')
    ),
    body := jsonb_build_object(
      'transaction_id', NEW.id,
      'transaction_type', 'payment_request',
      'tenant_id', NEW.tenant_id,
      'company_id', NEW.company_id
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER proph3t_on_payment_request_insert
  AFTER INSERT ON payment_requests
  FOR EACH ROW
  EXECUTE FUNCTION trigger_proph3t_payment_fraud();

-- ─────────────────────────────────────────────────────────────
-- Trigger on proph3t_forecasts INSERT → run alert engine
-- (debounced: only triggers if no alert engine run in last hour)
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION trigger_proph3t_post_forecast_alerts()
RETURNS TRIGGER AS $$
DECLARE
  last_alert_run TIMESTAMPTZ;
BEGIN
  -- Check if alert engine ran recently (within 1 hour)
  SELECT MAX(created_at) INTO last_alert_run
  FROM proph3t_alerts
  WHERE company_id = NEW.company_id
    AND created_at > NOW() - INTERVAL '1 hour';

  -- Only trigger if no recent alert engine run
  IF last_alert_run IS NULL THEN
    PERFORM net.http_post(
      url := current_setting('app.supabase_url') || '/functions/v1/proph3t-alert-engine',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.service_role_key')
      ),
      body := jsonb_build_object(
        'tenant_id', NEW.tenant_id,
        'company_id', NEW.company_id
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER proph3t_on_forecast_insert
  AFTER INSERT ON proph3t_forecasts
  FOR EACH ROW
  EXECUTE FUNCTION trigger_proph3t_post_forecast_alerts();
