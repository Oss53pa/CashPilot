-- ============================================================================
-- Migration 001 — Foundation Tables
-- tenants, companies, user_profiles, user_company_access
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pg_cron" WITH SCHEMA "extensions";

-- ============================================================================
-- TENANTS — Top-level multi-tenant isolation
-- ============================================================================
CREATE TABLE tenants (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  plan        TEXT NOT NULL DEFAULT 'standard',  -- standard / premium / enterprise
  currency    TEXT NOT NULL DEFAULT 'XOF',
  country     TEXT NOT NULL DEFAULT 'CI',
  timezone    TEXT NOT NULL DEFAULT 'Africa/Abidjan',
  settings    JSONB NOT NULL DEFAULT '{}',
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tenants_slug ON tenants(slug);

-- ============================================================================
-- COMPANIES — Legal entities within a tenant
-- ============================================================================
CREATE TABLE companies (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name              TEXT NOT NULL,
  short_name        TEXT,
  legal_form        TEXT,           -- SA, SARL, SCI, etc.
  registration_number TEXT,         -- RCCM
  tax_id            TEXT,           -- NCC (Numéro de Compte Contribuable)
  country           TEXT NOT NULL DEFAULT 'CI',
  city              TEXT,
  address           TEXT,
  currency          TEXT NOT NULL DEFAULT 'XOF',
  fiscal_year_start INTEGER NOT NULL DEFAULT 1,  -- month (1=January)
  is_active         BOOLEAN NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_companies_tenant ON companies(tenant_id);

-- ============================================================================
-- USER PROFILES — Extended user data linked to auth.users
-- ============================================================================
CREATE TABLE user_profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  full_name   TEXT NOT NULL,
  email       TEXT NOT NULL,
  phone       TEXT,
  role_tenant TEXT NOT NULL DEFAULT 'viewer',  -- admin / dg / dga / daf / treasurer / manager / viewer
  avatar_url  TEXT,
  language    TEXT NOT NULL DEFAULT 'fr',      -- fr / en
  mfa_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  last_login  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_profiles_tenant ON user_profiles(tenant_id);

-- ============================================================================
-- USER COMPANY ACCESS — Which users can access which companies
-- ============================================================================
CREATE TABLE user_company_access (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  company_id  UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  role        TEXT NOT NULL DEFAULT 'viewer',  -- admin / manager / editor / viewer
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, company_id)
);

CREATE INDEX idx_user_company_access_user ON user_company_access(user_id);
CREATE INDEX idx_user_company_access_company ON user_company_access(company_id);

-- ============================================================================
-- HELPER FUNCTIONS for RLS
-- ============================================================================

-- Get the tenant_id for the current authenticated user
CREATE OR REPLACE FUNCTION get_user_tenant_id()
RETURNS UUID AS $$
  SELECT tenant_id FROM user_profiles WHERE id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Get the company_ids the current user can access
CREATE OR REPLACE FUNCTION get_user_company_ids()
RETURNS SETOF UUID AS $$
  SELECT company_id FROM user_company_access WHERE user_id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Tenants: users can only see their own tenant
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON tenants
  FOR ALL USING (id = get_user_tenant_id());

-- Companies: users can only see companies in their tenant that they have access to
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "company_tenant_isolation" ON companies
  FOR ALL USING (
    tenant_id = get_user_tenant_id()
    AND id IN (SELECT get_user_company_ids())
  );

-- User profiles: users can see profiles in their tenant
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_profile_tenant_isolation" ON user_profiles
  FOR ALL USING (tenant_id = get_user_tenant_id());

-- User company access: users can see their own access entries
ALTER TABLE user_company_access ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_company_access_isolation" ON user_company_access
  FOR ALL USING (tenant_id = get_user_tenant_id());

-- ============================================================================
-- UPDATED_AT TRIGGER
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at BEFORE UPDATE ON tenants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
