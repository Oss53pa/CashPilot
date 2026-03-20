-- ============================================================================
-- Migration 002 — Core Business Tables
-- bank_accounts, counterparties, cash_flows, payment_requests,
-- budgets, budget_lines, cash_registers, credit_lines,
-- debt_contracts, capex_operations, investments
-- ============================================================================

-- ============================================================================
-- BANK ACCOUNTS
-- ============================================================================
CREATE TABLE bank_accounts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  bank_name       TEXT NOT NULL,
  bank_code       TEXT,
  account_number  TEXT,
  iban            TEXT,
  swift_bic       TEXT,
  currency        TEXT NOT NULL DEFAULT 'XOF',
  account_type    TEXT NOT NULL DEFAULT 'current',  -- current / savings / term_deposit / escrow
  min_balance     BIGINT NOT NULL DEFAULT 0,         -- seuil min en centimes
  max_balance     BIGINT,                            -- seuil max en centimes (pour alerte excédent)
  current_balance BIGINT NOT NULL DEFAULT 0,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  opened_at       DATE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_bank_accounts_tenant_company ON bank_accounts(tenant_id, company_id);

-- ============================================================================
-- CASH REGISTERS (caisses physiques)
-- ============================================================================
CREATE TABLE cash_registers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  location        TEXT,
  max_balance     BIGINT NOT NULL DEFAULT 500000_00,  -- 500 000 FCFA par défaut
  current_balance BIGINT NOT NULL DEFAULT 0,
  responsible_id  UUID REFERENCES auth.users(id),
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_cash_registers_tenant_company ON cash_registers(tenant_id, company_id);

-- ============================================================================
-- COUNTERPARTIES (locataires, fournisseurs, etc.)
-- ============================================================================
CREATE TABLE counterparties (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  company_id          UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name                TEXT NOT NULL,
  short_name          TEXT,
  type                TEXT NOT NULL DEFAULT 'tenant',  -- tenant / supplier / bank / government / intercompany / other
  category            TEXT,                            -- retail / office / warehouse / restaurant / service / etc.
  contact_name        TEXT,
  contact_email       TEXT,
  contact_phone       TEXT,
  tax_id              TEXT,
  iban                TEXT,
  bank_name           TEXT,
  -- Payment behavior profile (updated by Proph3t)
  payment_delay_avg   NUMERIC DEFAULT 0,              -- délai moyen observé (jours)
  payment_delay_std   NUMERIC DEFAULT 0,              -- écart-type du délai
  recovery_rate       NUMERIC DEFAULT 1.0,            -- taux de recouvrement [0, 1]
  risk_score          INTEGER,                         -- score Proph3t (0-100, mis à jour par behavior-score)
  -- Lease info (for tenant type)
  lease_start_date    DATE,
  lease_end_date      DATE,
  monthly_rent        BIGINT,                          -- loyer mensuel en centimes
  deposit_amount      BIGINT,                          -- dépôt de garantie en centimes
  -- Status
  status              TEXT NOT NULL DEFAULT 'active',  -- active / inactive / suspended / litigation
  is_active           BOOLEAN NOT NULL DEFAULT TRUE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_counterparties_tenant_company ON counterparties(tenant_id, company_id);
CREATE INDEX idx_counterparties_type ON counterparties(tenant_id, company_id, type);

-- ============================================================================
-- CASH FLOWS — Realized transactions (the actual cash movements)
-- ============================================================================
CREATE TABLE cash_flows (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  company_id        UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  account_id        UUID REFERENCES bank_accounts(id),
  cash_register_id  UUID REFERENCES cash_registers(id),
  counterparty_id   UUID REFERENCES counterparties(id),
  flow_date         DATE NOT NULL,
  value_date        DATE,
  amount            BIGINT NOT NULL,                   -- positif = encaissement, négatif = décaissement (centimes)
  currency          TEXT NOT NULL DEFAULT 'XOF',
  category          TEXT NOT NULL,                     -- rent / charges / salary / capex / tax / insurance / utilities / other
  subcategory       TEXT,
  description       TEXT,
  reference         TEXT,                              -- référence bancaire
  bank_reference    TEXT,                              -- IBAN/RIB destinataire
  source            TEXT NOT NULL DEFAULT 'manual',    -- manual / bank_import / mt940 / csv / api / cash_register
  status            TEXT NOT NULL DEFAULT 'confirmed', -- pending / confirmed / reconciled / cancelled
  is_forecast       BOOLEAN NOT NULL DEFAULT FALSE,
  forecast_id       UUID,                              -- lien vers prévision d'origine si réalisé d'une prévision
  payment_mode      TEXT,                              -- transfer / check / cash / mobile_money / card
  created_by        UUID REFERENCES auth.users(id),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_cash_flows_tenant_company_date ON cash_flows(tenant_id, company_id, flow_date);
CREATE INDEX idx_cash_flows_counterparty ON cash_flows(tenant_id, company_id, counterparty_id, flow_date);
CREATE INDEX idx_cash_flows_category ON cash_flows(tenant_id, company_id, category, flow_date);
CREATE INDEX idx_cash_flows_account ON cash_flows(account_id, flow_date);

-- ============================================================================
-- PAYMENT REQUESTS — Demandes de paiement (workflow approbation)
-- ============================================================================
CREATE TABLE payment_requests (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  company_id        UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  counterparty_id   UUID REFERENCES counterparties(id),
  account_id        UUID REFERENCES bank_accounts(id),
  amount            BIGINT NOT NULL,                   -- montant en centimes
  currency          TEXT NOT NULL DEFAULT 'XOF',
  category          TEXT NOT NULL,
  description       TEXT NOT NULL,
  reference         TEXT,
  beneficiary_iban  TEXT,
  beneficiary_name  TEXT,
  due_date          DATE,
  urgency           TEXT NOT NULL DEFAULT 'normal',    -- normal / urgent / critical
  status            TEXT NOT NULL DEFAULT 'draft',     -- draft / pending_approval / approved / rejected / executed / cancelled / blocked
  blocked_by_fraud  BOOLEAN NOT NULL DEFAULT FALSE,
  -- Approval chain
  requested_by      UUID REFERENCES auth.users(id),
  approved_by       UUID REFERENCES auth.users(id),
  approved_at       TIMESTAMPTZ,
  executed_by       UUID REFERENCES auth.users(id),
  executed_at       TIMESTAMPTZ,
  cash_flow_id      UUID REFERENCES cash_flows(id),   -- lien vers le flux réalisé
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payment_requests_tenant_company ON payment_requests(tenant_id, company_id, status);

-- ============================================================================
-- BUDGETS & BUDGET LINES
-- ============================================================================
CREATE TABLE budgets (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  company_id  UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  fiscal_year INTEGER NOT NULL,
  status      TEXT NOT NULL DEFAULT 'draft',  -- draft / approved / closed
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE budget_lines (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  company_id  UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  budget_id   UUID NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
  category    TEXT NOT NULL,
  subcategory TEXT,
  month       INTEGER NOT NULL,   -- 1-12
  amount      BIGINT NOT NULL,    -- montant budgété en centimes
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_budget_lines_lookup ON budget_lines(tenant_id, company_id, budget_id, category, month);

-- ============================================================================
-- CREDIT LINES
-- ============================================================================
CREATE TABLE credit_lines (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  company_id            UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  bank_name             TEXT NOT NULL,
  facility_type         TEXT NOT NULL,  -- revolving / overdraft / term / guarantee
  total_amount          BIGINT NOT NULL,
  drawn_amount          BIGINT NOT NULL DEFAULT 0,
  available_amount      BIGINT GENERATED ALWAYS AS (total_amount - drawn_amount) STORED,
  interest_rate         NUMERIC NOT NULL,  -- taux annuel en %
  start_date            DATE NOT NULL,
  maturity_date         DATE,
  activation_delay_days INTEGER NOT NULL DEFAULT 2,
  contact_name          TEXT,
  contact_phone         TEXT,
  status                TEXT NOT NULL DEFAULT 'active',  -- active / frozen / expired
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_credit_lines_tenant_company ON credit_lines(tenant_id, company_id);

-- ============================================================================
-- DEBT CONTRACTS
-- ============================================================================
CREATE TABLE debt_contracts (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  company_id        UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  bank_name         TEXT NOT NULL,
  contract_type     TEXT NOT NULL,  -- term_loan / bond / lease / sukuk
  principal_amount  BIGINT NOT NULL,
  outstanding       BIGINT NOT NULL,
  interest_rate     NUMERIC NOT NULL,
  start_date        DATE NOT NULL,
  maturity_date     DATE NOT NULL,
  payment_frequency TEXT NOT NULL DEFAULT 'monthly',  -- monthly / quarterly / semi_annual / annual
  next_payment_date DATE,
  next_payment_amount BIGINT,
  covenants         JSONB DEFAULT '[]',  -- [{name, type, minimum_required, current_value}]
  status            TEXT NOT NULL DEFAULT 'active',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_debt_contracts_tenant_company ON debt_contracts(tenant_id, company_id);

-- ============================================================================
-- CAPEX OPERATIONS
-- ============================================================================
CREATE TABLE capex_operations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  description     TEXT,
  total_budget    BIGINT NOT NULL,        -- budget total en centimes
  spent_amount    BIGINT NOT NULL DEFAULT 0,
  committed_amount BIGINT NOT NULL DEFAULT 0,
  contractor_name TEXT,
  start_date      DATE,
  end_date        DATE,
  is_deferrable   BOOLEAN NOT NULL DEFAULT FALSE,
  status          TEXT NOT NULL DEFAULT 'planned',  -- planned / in_progress / completed / cancelled
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- CAPEX payment schedule
CREATE TABLE capex_payments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  capex_id        UUID NOT NULL REFERENCES capex_operations(id) ON DELETE CASCADE,
  label           TEXT NOT NULL,
  amount          BIGINT NOT NULL,
  due_date        DATE NOT NULL,
  is_paid         BOOLEAN NOT NULL DEFAULT FALSE,
  paid_date       DATE,
  cash_flow_id    UUID REFERENCES cash_flows(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_capex_operations_tenant_company ON capex_operations(tenant_id, company_id);
CREATE INDEX idx_capex_payments_due ON capex_payments(tenant_id, company_id, due_date);

-- ============================================================================
-- INVESTMENTS (placements)
-- ============================================================================
CREATE TABLE investments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  instrument_type TEXT NOT NULL,  -- dat / bon_tresor / obligation / sicav / other
  bank_name       TEXT,
  principal       BIGINT NOT NULL,
  interest_rate   NUMERIC NOT NULL,
  start_date      DATE NOT NULL,
  maturity_date   DATE NOT NULL,
  expected_return BIGINT,
  status          TEXT NOT NULL DEFAULT 'active',  -- active / matured / redeemed
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_investments_tenant_company ON investments(tenant_id, company_id);

-- ============================================================================
-- INTERCOMPANY FLOWS
-- ============================================================================
CREATE TABLE intercompany_flows (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  source_company_id UUID NOT NULL REFERENCES companies(id),
  target_company_id UUID NOT NULL REFERENCES companies(id),
  amount            BIGINT NOT NULL,
  currency          TEXT NOT NULL DEFAULT 'XOF',
  description       TEXT,
  flow_date         DATE NOT NULL,
  source_cash_flow_id UUID REFERENCES cash_flows(id),
  target_cash_flow_id UUID REFERENCES cash_flows(id),
  is_eliminated     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_intercompany_flows_tenant ON intercompany_flows(tenant_id, flow_date);

-- ============================================================================
-- ROW LEVEL SECURITY — all tables
-- ============================================================================

ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_company_isolation" ON bank_accounts
  FOR ALL USING (tenant_id = get_user_tenant_id() AND company_id IN (SELECT get_user_company_ids()));

ALTER TABLE cash_registers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_company_isolation" ON cash_registers
  FOR ALL USING (tenant_id = get_user_tenant_id() AND company_id IN (SELECT get_user_company_ids()));

ALTER TABLE counterparties ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_company_isolation" ON counterparties
  FOR ALL USING (tenant_id = get_user_tenant_id() AND company_id IN (SELECT get_user_company_ids()));

ALTER TABLE cash_flows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_company_isolation" ON cash_flows
  FOR ALL USING (tenant_id = get_user_tenant_id() AND company_id IN (SELECT get_user_company_ids()));

ALTER TABLE payment_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_company_isolation" ON payment_requests
  FOR ALL USING (tenant_id = get_user_tenant_id() AND company_id IN (SELECT get_user_company_ids()));

ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_company_isolation" ON budgets
  FOR ALL USING (tenant_id = get_user_tenant_id() AND company_id IN (SELECT get_user_company_ids()));

ALTER TABLE budget_lines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_company_isolation" ON budget_lines
  FOR ALL USING (tenant_id = get_user_tenant_id() AND company_id IN (SELECT get_user_company_ids()));

ALTER TABLE credit_lines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_company_isolation" ON credit_lines
  FOR ALL USING (tenant_id = get_user_tenant_id() AND company_id IN (SELECT get_user_company_ids()));

ALTER TABLE debt_contracts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_company_isolation" ON debt_contracts
  FOR ALL USING (tenant_id = get_user_tenant_id() AND company_id IN (SELECT get_user_company_ids()));

ALTER TABLE capex_operations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_company_isolation" ON capex_operations
  FOR ALL USING (tenant_id = get_user_tenant_id() AND company_id IN (SELECT get_user_company_ids()));

ALTER TABLE capex_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_company_isolation" ON capex_payments
  FOR ALL USING (tenant_id = get_user_tenant_id() AND company_id IN (SELECT get_user_company_ids()));

ALTER TABLE investments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_company_isolation" ON investments
  FOR ALL USING (tenant_id = get_user_tenant_id() AND company_id IN (SELECT get_user_company_ids()));

ALTER TABLE intercompany_flows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON intercompany_flows
  FOR ALL USING (tenant_id = get_user_tenant_id());

-- ============================================================================
-- UPDATED_AT TRIGGERS
-- ============================================================================
CREATE TRIGGER set_updated_at BEFORE UPDATE ON bank_accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON cash_registers FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON counterparties FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON cash_flows FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON payment_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON budgets FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON credit_lines FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON debt_contracts FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON capex_operations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON investments FOR EACH ROW EXECUTE FUNCTION update_updated_at();
