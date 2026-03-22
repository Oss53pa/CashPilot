-- ============================================================================
-- Migration: Harmonize RLS Policies
--
-- Problem: Migrations 012-017 used Pattern B (current_setting('app.tenant_id'))
-- while 001-002, 010 used Pattern A (helper functions). Pattern B requires
-- manual session variable management and does NOT work with Supabase auth
-- out of the box. Pattern A (helper functions querying user_profiles /
-- user_company_access) is the correct, portable pattern.
--
-- This migration:
--   1. Creates improved, standardized auth helper functions
--   2. Drops every Pattern-B policy and replaces it with Pattern-A
--   3. Adds performance indexes on frequently-queried columns
-- ============================================================================

-- ============================================================================
-- 1. STANDARDIZED AUTH HELPER FUNCTIONS
-- ============================================================================

-- auth_tenant_id: returns the tenant_id for the currently authenticated user
-- Preferred over get_user_tenant_id() because it has a clearer name.
-- We keep get_user_tenant_id() as an alias for backward compatibility.
CREATE OR REPLACE FUNCTION auth_tenant_id() RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER
AS $$ SELECT tenant_id FROM user_profiles WHERE id = auth.uid() $$;

-- auth_user_company_ids: returns an array of company_ids the user can access
CREATE OR REPLACE FUNCTION auth_user_company_ids() RETURNS UUID[]
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT COALESCE(
    ARRAY(SELECT company_id FROM user_company_access WHERE user_id = auth.uid()),
    '{}'::UUID[]
  )
$$;

-- auth_has_company_access: checks if the user can access a specific company
CREATE OR REPLACE FUNCTION auth_has_company_access(p_company_id UUID) RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_company_access
    WHERE user_id = auth.uid() AND company_id = p_company_id
  )
$$;

-- Increment annotation replies_count (used by annotations service)
CREATE OR REPLACE FUNCTION increment_annotation_replies(annotation_id UUID)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  UPDATE annotations
  SET replies_count = COALESCE(replies_count, 0) + 1
  WHERE id = annotation_id;
END;
$$;


-- ============================================================================
-- 2. DROP PATTERN-B POLICIES AND REPLACE WITH PATTERN-A
-- ============================================================================
-- Every table below was using:
--   tenant_id = (current_setting('app.tenant_id', true))::UUID
-- We replace with:
--   tenant_id = auth_tenant_id() AND company_id = ANY(auth_user_company_ids())
-- ============================================================================

-- ----- documents -----
DROP POLICY IF EXISTS "documents_tenant_isolation" ON documents;
CREATE POLICY "documents_tenant_company_isolation" ON documents
  FOR ALL USING (
    tenant_id = auth_tenant_id()
    AND company_id = ANY(auth_user_company_ids())
  );

-- ----- exchange_rates (no company_id, tenant-level only) -----
DROP POLICY IF EXISTS "exchange_rates_tenant_isolation" ON exchange_rates;
CREATE POLICY "exchange_rates_tenant_isolation_v2" ON exchange_rates
  FOR ALL USING (
    tenant_id = auth_tenant_id()
  );

-- ----- notification_log -----
DROP POLICY IF EXISTS "notification_log_tenant_isolation" ON notification_log;
CREATE POLICY "notification_log_tenant_company_isolation" ON notification_log
  FOR ALL USING (
    tenant_id = auth_tenant_id()
    AND company_id = ANY(auth_user_company_ids())
  );

-- ----- bank_statements -----
DROP POLICY IF EXISTS "bank_statements_tenant_isolation" ON bank_statements;
CREATE POLICY "bank_statements_tenant_company_isolation" ON bank_statements
  FOR ALL USING (
    tenant_id = auth_tenant_id()
    AND company_id = ANY(auth_user_company_ids())
  );

-- ----- bank_transactions -----
DROP POLICY IF EXISTS "bank_transactions_tenant_isolation" ON bank_transactions;
CREATE POLICY "bank_transactions_tenant_company_isolation" ON bank_transactions
  FOR ALL USING (
    tenant_id = auth_tenant_id()
    AND company_id = ANY(auth_user_company_ids())
  );

-- ----- doa_rules -----
DROP POLICY IF EXISTS "doa_rules_tenant_isolation" ON doa_rules;
CREATE POLICY "doa_rules_tenant_company_isolation" ON doa_rules
  FOR ALL USING (
    tenant_id = auth_tenant_id()
    AND company_id = ANY(auth_user_company_ids())
  );

-- ----- doa_delegations -----
DROP POLICY IF EXISTS "doa_delegations_tenant_isolation" ON doa_delegations;
CREATE POLICY "doa_delegations_tenant_company_isolation" ON doa_delegations
  FOR ALL USING (
    tenant_id = auth_tenant_id()
    AND company_id = ANY(auth_user_company_ids())
  );

-- ----- cash_counts -----
DROP POLICY IF EXISTS "cash_counts_tenant_isolation" ON cash_counts;
CREATE POLICY "cash_counts_tenant_company_isolation" ON cash_counts
  FOR ALL USING (
    tenant_id = auth_tenant_id()
    AND company_id = ANY(auth_user_company_ids())
  );

-- ----- payment_delay_config -----
DROP POLICY IF EXISTS "payment_delay_config_tenant" ON payment_delay_config;
CREATE POLICY "payment_delay_config_tenant_company_isolation" ON payment_delay_config
  FOR ALL USING (
    tenant_id = auth_tenant_id()
    AND company_id = ANY(auth_user_company_ids())
  );

-- ----- payment_delay_audit -----
DROP POLICY IF EXISTS "payment_delay_audit_tenant" ON payment_delay_audit;
CREATE POLICY "payment_delay_audit_tenant_company_isolation" ON payment_delay_audit
  FOR ALL USING (
    tenant_id = auth_tenant_id()
    AND company_id = ANY(auth_user_company_ids())
  );

-- ----- fixed_payment_dates -----
DROP POLICY IF EXISTS "fixed_payment_dates_tenant" ON fixed_payment_dates;
CREATE POLICY "fixed_payment_dates_tenant_company_isolation" ON fixed_payment_dates
  FOR ALL USING (
    tenant_id = auth_tenant_id()
    AND company_id = ANY(auth_user_company_ids())
  );

-- ----- reminder_config -----
DROP POLICY IF EXISTS "reminder_config_tenant" ON reminder_config;
CREATE POLICY "reminder_config_tenant_company_isolation" ON reminder_config
  FOR ALL USING (
    tenant_id = auth_tenant_id()
    AND company_id = ANY(auth_user_company_ids())
  );

-- ----- reminders -----
DROP POLICY IF EXISTS "reminders_tenant" ON reminders;
CREATE POLICY "reminders_tenant_company_isolation" ON reminders
  FOR ALL USING (
    tenant_id = auth_tenant_id()
    AND company_id = ANY(auth_user_company_ids())
  );

-- ----- tenant_applications -----
DROP POLICY IF EXISTS "tenant_applications_tenant" ON tenant_applications;
CREATE POLICY "tenant_applications_tenant_company_isolation" ON tenant_applications
  FOR ALL USING (
    tenant_id = auth_tenant_id()
    AND company_id = ANY(auth_user_company_ids())
  );

-- ----- lease_endings -----
DROP POLICY IF EXISTS "lease_endings_tenant" ON lease_endings;
CREATE POLICY "lease_endings_tenant_company_isolation" ON lease_endings
  FOR ALL USING (
    tenant_id = auth_tenant_id()
    AND company_id = ANY(auth_user_company_ids())
  );

-- ----- lease_franchises -----
DROP POLICY IF EXISTS "lease_franchises_tenant" ON lease_franchises;
CREATE POLICY "lease_franchises_tenant_company_isolation" ON lease_franchises
  FOR ALL USING (
    tenant_id = auth_tenant_id()
    AND company_id = ANY(auth_user_company_ids())
  );

-- ----- rent_revisions -----
DROP POLICY IF EXISTS "rent_revisions_tenant" ON rent_revisions;
CREATE POLICY "rent_revisions_tenant_company_isolation" ON rent_revisions
  FOR ALL USING (
    tenant_id = auth_tenant_id()
    AND company_id = ANY(auth_user_company_ids())
  );

-- ----- vacant_units -----
DROP POLICY IF EXISTS "vacant_units_tenant" ON vacant_units;
CREATE POLICY "vacant_units_tenant_company_isolation" ON vacant_units
  FOR ALL USING (
    tenant_id = auth_tenant_id()
    AND company_id = ANY(auth_user_company_ids())
  );

-- ----- aged_balance_snapshots -----
DROP POLICY IF EXISTS "aged_snapshots_tenant" ON aged_balance_snapshots;
CREATE POLICY "aged_snapshots_tenant_company_isolation" ON aged_balance_snapshots
  FOR ALL USING (
    tenant_id = auth_tenant_id()
    AND company_id = ANY(auth_user_company_ids())
  );

-- ----- dispute_files -----
DROP POLICY IF EXISTS "dispute_files_tenant_isolation" ON dispute_files;
CREATE POLICY "dispute_files_tenant_company_isolation" ON dispute_files
  FOR ALL USING (
    tenant_id = auth_tenant_id()
    AND company_id = ANY(auth_user_company_ids())
  );


-- ============================================================================
-- 3. PERFORMANCE INDEXES
-- ============================================================================
-- Add composite indexes for the most common query patterns.
-- Many already exist; IF NOT EXISTS prevents errors on duplicates.
-- ============================================================================

-- cash_flows: company + date descending (dashboard queries)
CREATE INDEX IF NOT EXISTS idx_cash_flows_company_date
  ON cash_flows(company_id, flow_date DESC);

-- cash_flows: status filter
CREATE INDEX IF NOT EXISTS idx_cash_flows_status
  ON cash_flows(company_id, status);

-- proph3t_forecasts: company + date (rolling forecast queries)
CREATE INDEX IF NOT EXISTS idx_forecasts_company_date
  ON proph3t_forecasts(company_id, forecast_date);

-- proph3t_forecasts: scenario filter
CREATE INDEX IF NOT EXISTS idx_forecasts_company_scenario
  ON proph3t_forecasts(company_id, scenario, forecast_date);

-- proph3t_alerts: open alerts priority
CREATE INDEX IF NOT EXISTS idx_alerts_company_open
  ON proph3t_alerts(company_id, priority) WHERE status = 'open';

-- bank_accounts: company lookup
CREATE INDEX IF NOT EXISTS idx_bank_accounts_company
  ON bank_accounts(company_id);

-- counterparties: company + status
CREATE INDEX IF NOT EXISTS idx_counterparties_company_status
  ON counterparties(company_id, status);

-- payment_requests: company + status + due_date
CREATE INDEX IF NOT EXISTS idx_payment_requests_company_due
  ON payment_requests(company_id, status, due_date);

-- budgets: company + fiscal year
CREATE INDEX IF NOT EXISTS idx_budgets_company_year
  ON budgets(company_id, fiscal_year);

-- budget_lines: budget + category
CREATE INDEX IF NOT EXISTS idx_budget_lines_budget_cat
  ON budget_lines(budget_id, category, month);

-- debt_contracts: company + status
CREATE INDEX IF NOT EXISTS idx_debt_contracts_company_status
  ON debt_contracts(company_id, status);

-- credit_lines: company + status
CREATE INDEX IF NOT EXISTS idx_credit_lines_company_status
  ON credit_lines(company_id, status);

-- investments: company + maturity
CREATE INDEX IF NOT EXISTS idx_investments_company_maturity
  ON investments(company_id, maturity_date);

-- capex_operations: company + status
CREATE INDEX IF NOT EXISTS idx_capex_company_status
  ON capex_operations(company_id, status);

-- documents: company lookup
CREATE INDEX IF NOT EXISTS idx_documents_company_type
  ON documents(company_id, document_type);

-- reminders: company + status + created_at (already partially exists)
CREATE INDEX IF NOT EXISTS idx_reminders_company_pending
  ON reminders(company_id, status) WHERE status IN ('pending', 'sent');

-- dispute_files: company + status (already partially exists)
CREATE INDEX IF NOT EXISTS idx_dispute_files_company_status
  ON dispute_files(company_id, status);

-- user_company_access: covering index for RLS helper function
CREATE INDEX IF NOT EXISTS idx_user_company_access_rls
  ON user_company_access(user_id, company_id);

-- user_profiles: covering index for auth_tenant_id()
CREATE INDEX IF NOT EXISTS idx_user_profiles_auth
  ON user_profiles(id, tenant_id);
