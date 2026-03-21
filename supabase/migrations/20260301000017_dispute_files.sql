-- ============================================================================
-- Migration 017: Dispute Files table (was missing from earlier migrations)
-- ============================================================================

CREATE TABLE IF NOT EXISTS dispute_files (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL REFERENCES tenants(id),
  company_id          UUID NOT NULL REFERENCES companies(id),
  reference           TEXT NOT NULL,
  counterparty_id     UUID NOT NULL REFERENCES counterparties(id),
  type                TEXT NOT NULL DEFAULT 'litigation', -- litigation | arbitration | mediation | recovery
  amount_disputed     BIGINT NOT NULL DEFAULT 0,
  amount_provision    BIGINT NOT NULL DEFAULT 0,
  currency            TEXT NOT NULL DEFAULT 'XOF',
  status              TEXT NOT NULL DEFAULT 'open', -- open | in_progress | settled | closed | written_off
  opened_date         DATE NOT NULL,
  closed_date         DATE,
  description         TEXT,
  lawyer              TEXT,
  court               TEXT,
  next_hearing        DATE,
  exit_scenario       TEXT, -- favorable | neutral | unfavorable
  probability         NUMERIC(5,2),
  created_by          UUID REFERENCES auth.users(id),
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE dispute_files ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dispute_files_tenant_isolation" ON dispute_files
  FOR ALL USING (
    tenant_id = (current_setting('app.tenant_id', true))::UUID
  );

CREATE INDEX idx_dispute_files_company ON dispute_files(company_id, status);
CREATE INDEX idx_dispute_files_counterparty ON dispute_files(counterparty_id);
