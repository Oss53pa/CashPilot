-- ============================================================================
-- Migration 014: Payment Delay Configuration (4-level hierarchy)
-- ============================================================================

-- Level 1+2: Global defaults + Category defaults
CREATE TABLE IF NOT EXISTS payment_delay_config (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL REFERENCES tenants(id),
  company_id          UUID NOT NULL REFERENCES companies(id),
  scope               TEXT NOT NULL, -- 'global_tenant' | 'global_supplier' | 'category'
  category            TEXT, -- NULL for global, category name for category-level
  -- Tenant/Encaissement fields
  due_day             INTEGER, -- jour echeance (1-31)
  tolerance_days      INTEGER, -- delai tolerance avant 1ere relance
  second_reminder_days INTEGER, -- delai 2eme relance
  formal_notice_days  INTEGER, -- delai mise en demeure
  litigation_days     INTEGER, -- delai statut litigieux
  dispute_days        INTEGER, -- delai statut contentieux
  late_interest_rate  NUMERIC(5,2), -- taux interet retard annuel
  imputation_rule     TEXT DEFAULT 'fifo', -- fifo / lifo / prorata / manual
  default_probability NUMERIC(5,2), -- probabilite encaissement par defaut
  -- Supplier/Decaissement fields
  payment_delay_days  INTEGER, -- delai paiement standard
  calc_base           TEXT, -- 'invoice_receipt' | 'end_of_month' | 'service_date'
  invoice_receipt_days INTEGER, -- delai reception facture
  total_estimated_days INTEGER, -- computed: receipt + payment
  fixed_payment_day   INTEGER, -- jour fixe si paiements groupes
  early_discount      BOOLEAN DEFAULT FALSE,
  discount_rate       NUMERIC(5,2),
  discount_delay_days INTEGER,
  -- Metadata
  is_active           BOOLEAN DEFAULT TRUE,
  created_by          UUID REFERENCES auth.users(id),
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE payment_delay_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payment_delay_config_tenant" ON payment_delay_config
  FOR ALL USING (tenant_id = (current_setting('app.tenant_id', true))::UUID);

CREATE INDEX idx_delay_config_lookup ON payment_delay_config(tenant_id, company_id, scope, category);

-- Level 3: Manual overrides per counterparty (stored on counterparties table)
-- Already exists via counterparties.payment_delay_days
-- Add forced delay columns
ALTER TABLE counterparties ADD COLUMN IF NOT EXISTS forced_delay_days INTEGER;
ALTER TABLE counterparties ADD COLUMN IF NOT EXISTS forced_delay_expiry TIMESTAMPTZ;
ALTER TABLE counterparties ADD COLUMN IF NOT EXISTS forced_delay_by UUID REFERENCES auth.users(id);
ALTER TABLE counterparties ADD COLUMN IF NOT EXISTS forced_delay_note TEXT;
ALTER TABLE counterparties ADD COLUMN IF NOT EXISTS counterparty_category TEXT;

-- Payment delay audit log
CREATE TABLE IF NOT EXISTS payment_delay_audit (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL REFERENCES tenants(id),
  company_id          UUID NOT NULL REFERENCES companies(id),
  modification_type   TEXT NOT NULL, -- 'manual_override' | 'category_change' | 'global_change' | 'proph3t_recalibration'
  counterparty_id     UUID REFERENCES counterparties(id),
  category            TEXT,
  old_value           TEXT,
  new_value           TEXT,
  reason              TEXT,
  modified_by         UUID REFERENCES auth.users(id),
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE payment_delay_audit ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payment_delay_audit_tenant" ON payment_delay_audit
  FOR ALL USING (tenant_id = (current_setting('app.tenant_id', true))::UUID);

-- Fixed payment dates (salaries, taxes, etc.)
CREATE TABLE IF NOT EXISTS fixed_payment_dates (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL REFERENCES tenants(id),
  company_id          UUID NOT NULL REFERENCES companies(id),
  flux_type           TEXT NOT NULL, -- 'salaries' | 'cnps' | 'tva' | 'is_acompte' | 'patente' | 'taxe_fonciere' | 'loan_repayment'
  label               TEXT NOT NULL,
  day_of_month        INTEGER, -- jour du mois (1-31)
  fixed_dates         DATE[], -- dates fixes pour IS acomptes etc.
  frequency           TEXT NOT NULL DEFAULT 'monthly', -- monthly | quarterly | annual | custom
  is_active           BOOLEAN DEFAULT TRUE,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE fixed_payment_dates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fixed_payment_dates_tenant" ON fixed_payment_dates
  FOR ALL USING (tenant_id = (current_setting('app.tenant_id', true))::UUID);
