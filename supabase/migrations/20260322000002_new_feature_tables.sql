-- ============================================================================
-- Migration: New Feature Tables
--
-- Creates tables referenced by services but missing from the database:
--   - annotations (polymorphic annotation/comment system)
--   - reconciliation_sessions (collaborative reconciliation)
--   - reconciliation_items (individual items within a session)
--   - reconciliation_chat_messages (real-time chat during reconciliation)
--   - exit_scenarios (dispute resolution scenarios)
--
-- All tables follow Pattern A: auth_tenant_id() + auth_user_company_ids()
-- ============================================================================


-- ============================================================================
-- ANNOTATIONS — Polymorphic comments, tags, flags on any entity
-- ============================================================================
CREATE TABLE annotations (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  company_id          UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  -- Polymorphic target
  entity_type         TEXT NOT NULL,          -- cash_flow / receivable / payable / forecast / alert / budget_line / dispute / capex / bank_account / counterparty / tft_line / forecast_cell
  entity_id           UUID NOT NULL,
  entity_label        TEXT,                   -- human-readable label for the entity
  -- Threading
  parent_id           UUID REFERENCES annotations(id) ON DELETE CASCADE,
  -- Author
  author_id           UUID NOT NULL REFERENCES auth.users(id),
  author_name         TEXT NOT NULL,
  author_avatar       TEXT,
  -- Content
  type                TEXT NOT NULL DEFAULT 'comment',  -- comment / tag / flag / document_link / mention / resolution
  content             TEXT NOT NULL,
  tags                TEXT[],
  flag_level          TEXT,                   -- info / warning / critical (only for type='flag')
  document_url        TEXT,
  mentioned_user_ids  UUID[],
  -- Visibility & resolution
  visibility          TEXT NOT NULL DEFAULT 'shared',  -- shared / private
  is_resolved         BOOLEAN NOT NULL DEFAULT FALSE,
  resolved_by         UUID REFERENCES auth.users(id),
  resolved_at         TIMESTAMPTZ,
  resolution_note     TEXT,
  -- Counts
  replies_count       INTEGER NOT NULL DEFAULT 0,
  -- Timestamps
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE annotations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "annotations_tenant_company_isolation" ON annotations
  FOR ALL USING (
    tenant_id = auth_tenant_id()
    AND company_id = ANY(auth_user_company_ids())
  );

CREATE INDEX idx_annotations_entity ON annotations(entity_type, entity_id);
CREATE INDEX idx_annotations_company ON annotations(company_id, created_at DESC);
CREATE INDEX idx_annotations_parent ON annotations(parent_id) WHERE parent_id IS NOT NULL;
CREATE INDEX idx_annotations_author ON annotations(author_id, created_at DESC);
CREATE INDEX idx_annotations_unresolved ON annotations(company_id, is_resolved) WHERE is_resolved = FALSE;
CREATE INDEX idx_annotations_mentions ON annotations USING GIN(mentioned_user_ids);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON annotations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Enable realtime for live collaboration
ALTER PUBLICATION supabase_realtime ADD TABLE annotations;


-- ============================================================================
-- RECONCILIATION SESSIONS — Collaborative reconciliation workspace
-- ============================================================================
CREATE TABLE reconciliation_sessions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  company_id          UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  account_id          UUID NOT NULL REFERENCES bank_accounts(id),
  account_name        TEXT NOT NULL,
  statement_id        UUID REFERENCES bank_statements(id),
  status              TEXT NOT NULL DEFAULT 'active',  -- active / paused / completed / cancelled
  created_by          UUID NOT NULL REFERENCES auth.users(id),
  completed_at        TIMESTAMPTZ,
  -- Denormalized aggregates (updated in-place for performance)
  participants        JSONB NOT NULL DEFAULT '[]',     -- SessionParticipant[]
  metrics             JSONB NOT NULL DEFAULT '{}',     -- SessionMetrics
  unresolved_count    INTEGER NOT NULL DEFAULT 0,
  total_transactions  INTEGER NOT NULL DEFAULT 0,
  resolved_count      INTEGER NOT NULL DEFAULT 0,
  -- Timestamps
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE reconciliation_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "recon_sessions_tenant_company_isolation" ON reconciliation_sessions
  FOR ALL USING (
    tenant_id = auth_tenant_id()
    AND company_id = ANY(auth_user_company_ids())
  );

CREATE INDEX idx_recon_sessions_company ON reconciliation_sessions(company_id, status);
CREATE INDEX idx_recon_sessions_account ON reconciliation_sessions(account_id, created_at DESC);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON reconciliation_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Enable realtime for live participant updates
ALTER PUBLICATION supabase_realtime ADD TABLE reconciliation_sessions;


-- ============================================================================
-- RECONCILIATION ITEMS — Individual transactions within a session
-- ============================================================================
CREATE TABLE reconciliation_items (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  company_id          UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  session_id          UUID NOT NULL REFERENCES reconciliation_sessions(id) ON DELETE CASCADE,
  transaction_id      UUID REFERENCES bank_transactions(id),
  type                TEXT NOT NULL DEFAULT 'bank_transaction',  -- bank_transaction / internal_flow / unidentified
  date                DATE NOT NULL,
  amount              BIGINT NOT NULL,
  description         TEXT,
  counterparty        TEXT,
  reference           TEXT,
  -- Status & locking
  status              TEXT NOT NULL DEFAULT 'pending',  -- pending / in_progress / proposed / validated / rejected / skipped
  locked_by           UUID REFERENCES auth.users(id),
  locked_by_name      TEXT,
  locked_at           TIMESTAMPTZ,
  -- Match proposal (JSONB to avoid extra joins)
  proposed_match      JSONB,                -- ProposedMatch
  -- Resolution
  resolution          JSONB,                -- ItemResolution
  -- Comments (denormalized for simplicity; can be normalized later)
  comments            JSONB NOT NULL DEFAULT '[]',  -- ItemComment[]
  -- Timestamps
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE reconciliation_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "recon_items_tenant_company_isolation" ON reconciliation_items
  FOR ALL USING (
    tenant_id = auth_tenant_id()
    AND company_id = ANY(auth_user_company_ids())
  );

CREATE INDEX idx_recon_items_session ON reconciliation_items(session_id, status);
CREATE INDEX idx_recon_items_session_date ON reconciliation_items(session_id, date DESC);
CREATE INDEX idx_recon_items_transaction ON reconciliation_items(transaction_id) WHERE transaction_id IS NOT NULL;

CREATE TRIGGER set_updated_at BEFORE UPDATE ON reconciliation_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Enable realtime for live item updates
ALTER PUBLICATION supabase_realtime ADD TABLE reconciliation_items;


-- ============================================================================
-- RECONCILIATION CHAT MESSAGES — Real-time chat during reconciliation
-- ============================================================================
CREATE TABLE reconciliation_chat_messages (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  company_id          UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  session_id          UUID NOT NULL REFERENCES reconciliation_sessions(id) ON DELETE CASCADE,
  user_id             UUID NOT NULL REFERENCES auth.users(id),
  user_name           TEXT NOT NULL,
  content             TEXT NOT NULL,
  timestamp           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE reconciliation_chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "recon_chat_tenant_company_isolation" ON reconciliation_chat_messages
  FOR ALL USING (
    tenant_id = auth_tenant_id()
    AND company_id = ANY(auth_user_company_ids())
  );

CREATE INDEX idx_recon_chat_session ON reconciliation_chat_messages(session_id, timestamp);

-- Enable realtime for live chat
ALTER PUBLICATION supabase_realtime ADD TABLE reconciliation_chat_messages;


-- ============================================================================
-- EXIT SCENARIOS — Dispute resolution scenario modeling
-- ============================================================================
CREATE TABLE exit_scenarios (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  company_id          UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  dispute_id          UUID NOT NULL REFERENCES dispute_files(id) ON DELETE CASCADE,
  label               TEXT NOT NULL,                  -- e.g. "Favorable: full recovery"
  probability_pct     NUMERIC(5,2) NOT NULL,          -- 0.00 to 100.00
  expected_amount     BIGINT NOT NULL,                -- expected recovery amount in centimes
  expected_date       DATE,                           -- expected resolution date
  description         TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE exit_scenarios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "exit_scenarios_tenant_company_isolation" ON exit_scenarios
  FOR ALL USING (
    tenant_id = auth_tenant_id()
    AND company_id = ANY(auth_user_company_ids())
  );

CREATE INDEX idx_exit_scenarios_dispute ON exit_scenarios(dispute_id);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON exit_scenarios
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
