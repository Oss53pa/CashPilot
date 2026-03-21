-- ============================================================================
-- Migration 016: Aged Balance Snapshots + Views
-- ============================================================================

CREATE TABLE IF NOT EXISTS aged_balance_snapshots (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id),
  company_id      UUID NOT NULL REFERENCES companies(id),
  snapshot_date   DATE NOT NULL,
  balance_type    TEXT NOT NULL, -- 'receivables' | 'payables'
  snapshot_data   JSONB NOT NULL,
  summary         JSONB NOT NULL,
  is_official     BOOLEAN DEFAULT FALSE,
  generated_by    UUID REFERENCES auth.users(id),
  generated_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, company_id, snapshot_date, balance_type)
);

ALTER TABLE aged_balance_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "aged_snapshots_tenant" ON aged_balance_snapshots
  FOR ALL USING (tenant_id = (current_setting('app.tenant_id', true))::UUID);

CREATE INDEX idx_aged_snapshots_lookup ON aged_balance_snapshots(company_id, balance_type, snapshot_date DESC);

-- Add columns to cash_flows for aged balance tracking
ALTER TABLE cash_flows ADD COLUMN IF NOT EXISTS due_date DATE;
ALTER TABLE cash_flows ADD COLUMN IF NOT EXISTS paid_amount BIGINT DEFAULT 0;
ALTER TABLE cash_flows ADD COLUMN IF NOT EXISTS late_interest_rate NUMERIC(5,2) DEFAULT 0.06;
ALTER TABLE cash_flows ADD COLUMN IF NOT EXISTS flow_type TEXT DEFAULT 'receipt';
ALTER TABLE cash_flows ADD COLUMN IF NOT EXISTS vat_amount BIGINT DEFAULT 0;
ALTER TABLE cash_flows ADD COLUMN IF NOT EXISTS payment_account_id UUID REFERENCES bank_accounts(id);
