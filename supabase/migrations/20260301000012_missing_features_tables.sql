-- ============================================================================
-- Migration 012: Missing features tables
-- Documents, Exchange Rates, Notification Preferences, Bank Statements
-- ============================================================================

-- Documents (file storage metadata)
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  company_id UUID NOT NULL REFERENCES companies(id),
  name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL DEFAULT 0,
  mime_type TEXT NOT NULL DEFAULT 'application/octet-stream',
  document_type TEXT NOT NULL DEFAULT 'other',
  related_entity_type TEXT,
  related_entity_id UUID,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "documents_tenant_isolation" ON documents
  FOR ALL USING (
    tenant_id = (current_setting('app.tenant_id', true))::UUID
  );

CREATE INDEX idx_documents_company ON documents(company_id);
CREATE INDEX idx_documents_entity ON documents(related_entity_type, related_entity_id);

-- Exchange Rates
CREATE TABLE IF NOT EXISTS exchange_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  from_currency TEXT NOT NULL DEFAULT 'XOF',
  to_currency TEXT NOT NULL DEFAULT 'EUR',
  rate NUMERIC(18, 8) NOT NULL,
  rate_date DATE NOT NULL,
  source TEXT NOT NULL DEFAULT 'manual',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE exchange_rates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "exchange_rates_tenant_isolation" ON exchange_rates
  FOR ALL USING (
    tenant_id = (current_setting('app.tenant_id', true))::UUID
  );

CREATE UNIQUE INDEX idx_exchange_rates_unique ON exchange_rates(tenant_id, from_currency, to_currency, rate_date);

-- Notification Preferences
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  company_id UUID NOT NULL REFERENCES companies(id),
  alert_type TEXT NOT NULL,
  email_enabled BOOLEAN NOT NULL DEFAULT true,
  push_enabled BOOLEAN NOT NULL DEFAULT true,
  in_app_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notification_prefs_user_isolation" ON notification_preferences
  FOR ALL USING (
    user_id = auth.uid()
  );

CREATE UNIQUE INDEX idx_notif_prefs_unique ON notification_preferences(user_id, company_id, alert_type);

-- Notification Log (sent notifications history)
CREATE TABLE IF NOT EXISTS notification_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  company_id UUID NOT NULL REFERENCES companies(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  channel TEXT NOT NULL DEFAULT 'email',
  alert_type TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT,
  status TEXT NOT NULL DEFAULT 'sent',
  error_message TEXT,
  sent_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notification_log_tenant_isolation" ON notification_log
  FOR ALL USING (
    tenant_id = (current_setting('app.tenant_id', true))::UUID
  );

-- Bank Statements (imported statement metadata)
CREATE TABLE IF NOT EXISTS bank_statements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  company_id UUID NOT NULL REFERENCES companies(id),
  account_id UUID NOT NULL REFERENCES bank_accounts(id),
  file_name TEXT NOT NULL,
  format TEXT NOT NULL DEFAULT 'csv',
  document_id UUID REFERENCES documents(id),
  period_start DATE,
  period_end DATE,
  transaction_count INTEGER NOT NULL DEFAULT 0,
  matched_count INTEGER NOT NULL DEFAULT 0,
  unmatched_count INTEGER NOT NULL DEFAULT 0,
  opening_balance BIGINT,
  closing_balance BIGINT,
  status TEXT NOT NULL DEFAULT 'processing',
  imported_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE bank_statements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bank_statements_tenant_isolation" ON bank_statements
  FOR ALL USING (
    tenant_id = (current_setting('app.tenant_id', true))::UUID
  );

-- Bank Transactions (parsed from statements)
CREATE TABLE IF NOT EXISTS bank_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  company_id UUID NOT NULL REFERENCES companies(id),
  statement_id UUID NOT NULL REFERENCES bank_statements(id),
  account_id UUID NOT NULL REFERENCES bank_accounts(id),
  transaction_date DATE NOT NULL,
  value_date DATE,
  amount BIGINT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'XOF',
  reference TEXT,
  description TEXT,
  counterparty_name TEXT,
  counterparty_account TEXT,
  transaction_type TEXT,
  balance_after BIGINT,
  match_status TEXT NOT NULL DEFAULT 'unmatched',
  matched_flow_id UUID REFERENCES cash_flows(id),
  match_type TEXT,
  match_confidence NUMERIC(4, 3) DEFAULT 0,
  matched_at TIMESTAMPTZ,
  matched_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE bank_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bank_transactions_tenant_isolation" ON bank_transactions
  FOR ALL USING (
    tenant_id = (current_setting('app.tenant_id', true))::UUID
  );

CREATE INDEX idx_bank_transactions_statement ON bank_transactions(statement_id);
CREATE INDEX idx_bank_transactions_account ON bank_transactions(account_id, transaction_date);
CREATE INDEX idx_bank_transactions_match ON bank_transactions(match_status);

-- Supabase Storage bucket for documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "documents_bucket_tenant_access"
ON storage.objects FOR ALL
USING (bucket_id = 'documents' AND auth.role() = 'authenticated');
