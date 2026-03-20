import { useCallback, useMemo } from 'react';
import {
  hasEffectivePermission,
  resolveEffectiveRole,
  isTenantRole,
  getAccessibleModules,
  getAllowedActions,
  type Action,
  type Role,
  type TenantRole,
  type CompanyRole,
  type Module,
} from '@/lib/rbac';
import { useCompanyStore } from '@/stores/company.store';

/**
 * Context object that carries the user's tenant and company role information.
 * Components higher in the tree should provide this via a React context or store.
 * For now we read tenantRole / companyRole from the company store's extended data.
 */
interface UserRoleContext {
  tenantRole: TenantRole | null;
  companyRole: CompanyRole | null;
}

/**
 * Extract role context from the current company store state.
 *
 * This reads:
 *   - `tenantRole`  from the company store (attached after login / profile load)
 *   - `companyRole` from the company store (attached per-company from UserCompanyAccess)
 */
function useRoleContext(): UserRoleContext {
  const company = useCompanyStore((s) => s.currentCompany);

  const raw = company as unknown as Record<string, unknown> | null;

  return {
    tenantRole: (raw?.tenant_role as TenantRole) ?? null,
    companyRole: (raw?.company_role as CompanyRole) ?? (raw?.role as CompanyRole) ?? null,
  };
}

/**
 * Primary permissions hook for CashPilot.
 *
 * Resolves the effective role using the 3-level RBAC model:
 *   1. Tenant-level role (tenant_admin, group_cfo, group_viewer)
 *   2. Company-level role (company_cfo, company_manager, treasurer, viewer, auditor)
 *   3. Fallback to 'viewer'
 *
 * Usage:
 *   const { can, role, isTenantLevel, accessibleModules } = usePermissions();
 *   if (can('create', 'cash_flows')) { ... }
 */
export function usePermissions() {
  const { tenantRole, companyRole } = useRoleContext();

  const role: Role = useMemo(
    () => resolveEffectiveRole(tenantRole, companyRole),
    [tenantRole, companyRole],
  );

  /** Check if the user can perform `action` on `module`. */
  const can = useCallback(
    (action: Action, module: string) =>
      hasEffectivePermission(tenantRole, companyRole, module, action),
    [tenantRole, companyRole],
  );

  /** Check multiple permissions at once — returns true if ALL are granted. */
  const canAll = useCallback(
    (checks: Array<{ action: Action; module: string }>) =>
      checks.every((c) => hasEffectivePermission(tenantRole, companyRole, c.module, c.action)),
    [tenantRole, companyRole],
  );

  /** Check multiple permissions at once — returns true if ANY is granted. */
  const canAny = useCallback(
    (checks: Array<{ action: Action; module: string }>) =>
      checks.some((c) => hasEffectivePermission(tenantRole, companyRole, c.module, c.action)),
    [tenantRole, companyRole],
  );

  /** Whether the effective role comes from a tenant-level assignment. */
  const isTenantLevel = useMemo(() => isTenantRole(role), [role]);

  /** All modules the user has at least read access to. */
  const accessibleModules = useMemo(() => getAccessibleModules(role), [role]);

  /** Get allowed actions for a specific module. */
  const actionsFor = useCallback(
    (module: Module) => getAllowedActions(role, module),
    [role],
  );

  return {
    /** The resolved effective role */
    role,
    /** The raw tenant role (null if user has no tenant-level role) */
    tenantRole,
    /** The raw company role (null if user has no company-level assignment) */
    companyRole,
    /** Whether the role is tenant-level (applies to all companies) */
    isTenantLevel,
    /** Check a single permission: can('read', 'cash_flows') */
    can,
    /** Check all permissions: canAll([{action:'read', module:'cash_flows'}, ...]) */
    canAll,
    /** Check any permission: canAny([{action:'read', module:'cash_flows'}, ...]) */
    canAny,
    /** List of modules with at least read access */
    accessibleModules,
    /** Get allowed actions for a module: actionsFor('cash_flows') */
    actionsFor,
  };
}
