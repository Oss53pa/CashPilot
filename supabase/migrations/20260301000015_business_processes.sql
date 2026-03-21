-- ============================================================================
-- Migration 015: 7 Business Processes
-- Reminders, Onboarding, Lease End, Reconciliation, Franchises, Rent Revision, Vacant Units
-- ============================================================================

-- ============================================================================
-- PROCESS 1: Tenant Reminders (Relances)
-- ============================================================================

CREATE TABLE IF NOT EXISTS reminder_config (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL REFERENCES tenants(id),
  company_id          UUID NOT NULL REFERENCES companies(id),
  step                INTEGER NOT NULL, -- 1, 2, 3, 4
  label               TEXT NOT NULL,
  trigger_days        INTEGER NOT NULL, -- days after due date
  channel_primary     TEXT NOT NULL DEFAULT 'email',
  channel_secondary   TEXT,
  send_hour           TIME DEFAULT '09:00',
  business_days_only  BOOLEAN DEFAULT TRUE,
  copy_to             TEXT[], -- user roles to copy
  signature_role      TEXT NOT NULL DEFAULT 'company_manager',
  template_subject    TEXT NOT NULL,
  template_body       TEXT NOT NULL,
  auto_send           BOOLEAN DEFAULT TRUE,
  is_active           BOOLEAN DEFAULT TRUE,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reminders (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL REFERENCES tenants(id),
  company_id          UUID NOT NULL REFERENCES companies(id),
  counterparty_id     UUID NOT NULL REFERENCES counterparties(id),
  receivable_id       UUID, -- cash_flow or invoice reference
  step                INTEGER NOT NULL,
  channel             TEXT NOT NULL,
  status              TEXT NOT NULL DEFAULT 'pending', -- pending | sent | delivered | read | failed | cancelled
  sent_at             TIMESTAMPTZ,
  delivered_at        TIMESTAMPTZ,
  read_at             TIMESTAMPTZ,
  cancelled_at        TIMESTAMPTZ,
  cancel_reason       TEXT, -- 'payment_received' | 'manual' | 'dispute'
  sent_by             UUID REFERENCES auth.users(id),
  amount_due          BIGINT NOT NULL,
  interest_amount     BIGINT DEFAULT 0,
  response_note       TEXT,
  response_date       TIMESTAMPTZ,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE reminder_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reminder_config_tenant" ON reminder_config FOR ALL USING (tenant_id = (current_setting('app.tenant_id', true))::UUID);
CREATE POLICY "reminders_tenant" ON reminders FOR ALL USING (tenant_id = (current_setting('app.tenant_id', true))::UUID);

CREATE INDEX idx_reminders_counterparty ON reminders(counterparty_id, step, status);
CREATE INDEX idx_reminders_status ON reminders(company_id, status, created_at DESC);

-- ============================================================================
-- PROCESS 2: Tenant Onboarding (Candidatures)
-- ============================================================================

CREATE TABLE IF NOT EXISTS tenant_applications (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL REFERENCES tenants(id),
  company_id          UUID NOT NULL REFERENCES companies(id),
  company_name        TEXT NOT NULL,
  sector              TEXT,
  concept             TEXT,
  target_unit         TEXT, -- zone + unit number
  proposed_rent       BIGINT,
  surface_sqm         NUMERIC,
  lease_duration_months INTEGER,
  declared_revenue    BIGINT,
  effort_rate         NUMERIC, -- proposed_rent / declared_revenue
  status              TEXT NOT NULL DEFAULT 'evaluation', -- evaluation | accepted | rejected | pending_docs | converted
  risk_score          INTEGER, -- P-Screen score if available
  documents           JSONB DEFAULT '{}', -- { doc_type: { uploaded: bool, file_path: string } }
  checklist           JSONB DEFAULT '{}',
  validated_by_cm     UUID REFERENCES auth.users(id),
  validated_by_daf    UUID REFERENCES auth.users(id),
  validated_by_dga    UUID REFERENCES auth.users(id),
  converted_to        UUID REFERENCES counterparties(id), -- link to created counterparty
  converted_at        TIMESTAMPTZ,
  notes               TEXT,
  created_by          UUID REFERENCES auth.users(id),
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE tenant_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_applications_tenant" ON tenant_applications FOR ALL USING (tenant_id = (current_setting('app.tenant_id', true))::UUID);

-- ============================================================================
-- PROCESS 3: Lease End
-- ============================================================================

CREATE TABLE IF NOT EXISTS lease_endings (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL REFERENCES tenants(id),
  company_id          UUID NOT NULL REFERENCES companies(id),
  counterparty_id     UUID NOT NULL REFERENCES counterparties(id),
  unit_id             TEXT, -- local reference
  scenario            TEXT NOT NULL, -- 'renewal' | 'non_renewal' | 'amicable_termination' | 'judicial_termination'
  lease_end_date      DATE NOT NULL,
  departure_date      DATE,
  -- Financial settlement
  outstanding_rent    BIGINT DEFAULT 0,
  outstanding_charges BIGINT DEFAULT 0,
  late_interest       BIGINT DEFAULT 0,
  total_due           BIGINT DEFAULT 0,
  deposit_held        BIGINT DEFAULT 0,
  deductions          BIGINT DEFAULT 0, -- damages, arrears
  deposit_to_return   BIGINT DEFAULT 0,
  return_date         DATE,
  -- Renewal specifics
  new_rent            BIGINT,
  new_duration_months INTEGER,
  amendment_doc       TEXT, -- file path
  -- Checklist
  checklist           JSONB DEFAULT '{}',
  status              TEXT NOT NULL DEFAULT 'pending', -- pending | in_progress | completed
  processed_by        UUID REFERENCES auth.users(id),
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE lease_endings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lease_endings_tenant" ON lease_endings FOR ALL USING (tenant_id = (current_setting('app.tenant_id', true))::UUID);

-- ============================================================================
-- PROCESS 5: Franchises & Grace Periods
-- ============================================================================

CREATE TABLE IF NOT EXISTS lease_franchises (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL REFERENCES tenants(id),
  company_id          UUID NOT NULL REFERENCES companies(id),
  counterparty_id     UUID NOT NULL REFERENCES counterparties(id),
  franchise_type      TEXT NOT NULL, -- 'full_waiver' | 'partial_waiver' | 'progressive' | 'charges_waiver' | 'startup'
  start_date          DATE NOT NULL,
  end_date            DATE NOT NULL,
  rent_percentage     NUMERIC DEFAULT 0, -- 0 for full waiver, 0.5 for 50%, etc.
  progressive_tiers   JSONB, -- [{months: 3, amount: 1000000}, ...]
  charges_waived      BOOLEAN DEFAULT FALSE,
  justification       TEXT,
  document_path       TEXT,
  is_active           BOOLEAN DEFAULT TRUE,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE lease_franchises ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lease_franchises_tenant" ON lease_franchises FOR ALL USING (tenant_id = (current_setting('app.tenant_id', true))::UUID);

-- ============================================================================
-- PROCESS 6: Rent Revision
-- ============================================================================

CREATE TABLE IF NOT EXISTS rent_revisions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL REFERENCES tenants(id),
  company_id          UUID NOT NULL REFERENCES companies(id),
  counterparty_id     UUID NOT NULL REFERENCES counterparties(id),
  revision_date       DATE NOT NULL,
  indexation_type     TEXT NOT NULL, -- 'fixed_rate' | 'index_ihpc' | 'contractual_ladder' | 'amicable'
  rate_or_index       NUMERIC, -- percentage or index value
  rent_before         BIGINT NOT NULL,
  rent_after          BIGINT NOT NULL,
  rent_variation      NUMERIC, -- percentage change
  status              TEXT NOT NULL DEFAULT 'calculated', -- calculated | validated_daf | validated_dga | notified | applied
  validated_by_daf    UUID REFERENCES auth.users(id),
  validated_by_dga    UUID REFERENCES auth.users(id),
  notification_sent   BOOLEAN DEFAULT FALSE,
  notification_date   DATE,
  applied_at          TIMESTAMPTZ,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE rent_revisions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rent_revisions_tenant" ON rent_revisions FOR ALL USING (tenant_id = (current_setting('app.tenant_id', true))::UUID);

-- ============================================================================
-- PROCESS 7: Vacant Units
-- ============================================================================

CREATE TABLE IF NOT EXISTS vacant_units (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL REFERENCES tenants(id),
  company_id          UUID NOT NULL REFERENCES companies(id),
  unit_reference      TEXT NOT NULL, -- A-12, B-04, etc.
  zone                TEXT,
  surface_sqm         NUMERIC,
  vacancy_reason      TEXT NOT NULL, -- 'tenant_departure' | 'non_renewal' | 'termination' | 'never_leased'
  previous_tenant_id  UUID REFERENCES counterparties(id),
  vacant_since        DATE NOT NULL,
  target_rent         BIGINT, -- asking rent
  relocation_date_est DATE, -- estimated relocation date
  relocation_probability NUMERIC DEFAULT 0.5,
  pipeline_active     BOOLEAN DEFAULT FALSE,
  candidate_name      TEXT,
  monthly_carrying_cost BIGINT DEFAULT 0, -- non-recoverable charges during vacancy
  renovation_needed   BOOLEAN DEFAULT FALSE,
  renovation_budget   BIGINT DEFAULT 0,
  renovation_weeks    INTEGER DEFAULT 0,
  status              TEXT NOT NULL DEFAULT 'vacant', -- vacant | under_renovation | available | reserved | leased
  leased_to           UUID REFERENCES counterparties(id),
  leased_at           DATE,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE vacant_units ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vacant_units_tenant" ON vacant_units FOR ALL USING (tenant_id = (current_setting('app.tenant_id', true))::UUID);

CREATE INDEX idx_vacant_units_company ON vacant_units(company_id, status);

-- ============================================================================
-- PROCESS 4: Manual Reconciliation Queue
-- (Uses existing bank_transactions table from migration 012)
-- Add reconciliation_notes column
-- ============================================================================

ALTER TABLE bank_transactions ADD COLUMN IF NOT EXISTS reconciliation_note TEXT;
ALTER TABLE bank_transactions ADD COLUMN IF NOT EXISTS flagged_suspicious BOOLEAN DEFAULT FALSE;
ALTER TABLE bank_transactions ADD COLUMN IF NOT EXISTS qualification_type TEXT; -- 'tenant_payment' | 'supplier_payment' | 'internal_transfer' | 'bank_error' | 'other'
