-- ============================================================================
-- Migration 013: DOA Rules, Delegations, User Preferences
-- Source of truth: Document de Reconciliation v1.0
-- ============================================================================

-- DOA Rules (Delegation d'Autorite)
CREATE TABLE IF NOT EXISTS doa_rules (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id               UUID NOT NULL REFERENCES tenants(id),
  company_id              UUID NOT NULL REFERENCES companies(id),
  transaction_type        TEXT NOT NULL,
  amount_min              BIGINT NOT NULL DEFAULT 0,
  amount_max              BIGINT,
  approvers               JSONB NOT NULL,
  approval_deadline_hours INTEGER NOT NULL DEFAULT 24,
  escalation_role         TEXT,
  requires_convention     BOOLEAN DEFAULT FALSE,
  requires_justification  BOOLEAN DEFAULT FALSE,
  can_be_urgent           BOOLEAN DEFAULT TRUE,
  label                   TEXT NOT NULL,
  is_active               BOOLEAN DEFAULT TRUE,
  sort_order              INTEGER DEFAULT 0,
  created_by              UUID REFERENCES auth.users(id),
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE doa_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "doa_rules_tenant_isolation" ON doa_rules
  FOR ALL USING (
    tenant_id = (current_setting('app.tenant_id', true))::UUID
  );

CREATE INDEX idx_doa_rules_lookup ON doa_rules(tenant_id, company_id, transaction_type, is_active);

-- DOA Delegations (temporary authority transfers)
CREATE TABLE IF NOT EXISTS doa_delegations (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL REFERENCES tenants(id),
  company_id          UUID NOT NULL REFERENCES companies(id),
  delegator_id        UUID NOT NULL REFERENCES auth.users(id),
  delegate_id         UUID NOT NULL REFERENCES auth.users(id),
  transaction_types   TEXT[],
  amount_max          BIGINT,
  valid_from          TIMESTAMPTZ NOT NULL,
  valid_until         TIMESTAMPTZ NOT NULL,
  reason              TEXT NOT NULL,
  approved_by         UUID REFERENCES auth.users(id),
  is_active           BOOLEAN DEFAULT TRUE,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE doa_delegations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "doa_delegations_tenant_isolation" ON doa_delegations
  FOR ALL USING (
    tenant_id = (current_setting('app.tenant_id', true))::UUID
  );

-- User Preferences (source of truth for all user display/notification settings)
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id             UUID PRIMARY KEY REFERENCES auth.users(id),
  tenant_id           UUID NOT NULL REFERENCES tenants(id),
  default_currency    TEXT DEFAULT 'XOF',
  date_format         TEXT DEFAULT 'DD/MM/YYYY',
  number_format       TEXT DEFAULT 'space_separator',
  theme               TEXT DEFAULT 'light',
  density             TEXT DEFAULT 'normal',
  language            TEXT DEFAULT 'fr',
  home_page           TEXT DEFAULT 'dashboard',
  default_scenario    TEXT DEFAULT 'base',
  default_horizon     TEXT DEFAULT '30d',
  chart_type          TEXT DEFAULT 'line',
  auto_reports        JSONB DEFAULT '{}',
  report_format       TEXT DEFAULT 'pdf',
  notification_prefs  JSONB DEFAULT '{}',
  quiet_hours_start   TIME DEFAULT '20:00',
  quiet_hours_end     TIME DEFAULT '07:00',
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_preferences_own_only" ON user_preferences
  FOR ALL USING (user_id = auth.uid());

-- Cash count details (denomination breakdown)
CREATE TABLE IF NOT EXISTS cash_counts (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL REFERENCES tenants(id),
  company_id          UUID NOT NULL REFERENCES companies(id),
  register_id         UUID NOT NULL REFERENCES cash_registers(id),
  count_date          DATE NOT NULL,
  count_time          TIME NOT NULL,
  period_start        TIMESTAMPTZ,
  theoretical_balance BIGINT NOT NULL DEFAULT 0,
  counted_balance     BIGINT NOT NULL DEFAULT 0,
  variance            BIGINT NOT NULL DEFAULT 0,
  denomination_detail JSONB,
  variance_justification TEXT,
  bank_deposit_amount BIGINT DEFAULT 0,
  bank_deposit_account UUID REFERENCES bank_accounts(id),
  balance_carried     BIGINT NOT NULL DEFAULT 0,
  status              TEXT NOT NULL DEFAULT 'draft',
  counted_by          UUID REFERENCES auth.users(id),
  validated_by        UUID REFERENCES auth.users(id),
  validated_at        TIMESTAMPTZ,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE cash_counts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cash_counts_tenant_isolation" ON cash_counts
  FOR ALL USING (
    tenant_id = (current_setting('app.tenant_id', true))::UUID
  );

CREATE INDEX idx_cash_counts_register ON cash_counts(register_id, count_date DESC);
