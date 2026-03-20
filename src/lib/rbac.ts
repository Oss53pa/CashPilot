/**
 * Role-Based Access Control (RBAC) for CashPilot.
 *
 * 3-level model:
 *   1. Tenant-level roles  – apply across ALL companies in a tenant
 *   2. Company-level roles – scoped to a single company
 *   3. Module + Action      – fine-grained permission per module
 *
 * Tenant roles:
 *   tenant_admin  – manages users, companies, subscription, global settings
 *   group_cfo     – read/write all companies + group consolidation
 *   group_viewer  – read-only all companies
 *
 * Company roles:
 *   company_cfo      – full read/write + payment validation level 2
 *   company_manager  – operational entry + validation level 1
 *   treasurer        – receipts/disbursements entry, bank reconciliation
 *   viewer           – read-only, exports
 *   auditor          – read-only + full audit trail access
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type TenantRole = 'tenant_admin' | 'group_cfo' | 'group_viewer';
export type CompanyRole = 'company_cfo' | 'company_manager' | 'treasurer' | 'viewer' | 'auditor';
export type Role = TenantRole | CompanyRole;

export type Module =
  | 'dashboard'
  | 'cash_flows'
  | 'budgets'
  | 'forecasts'
  | 'scenarios'
  | 'bank_accounts'
  | 'counterparties'
  | 'capex'
  | 'debt'
  | 'investments'
  | 'credit_lines'
  | 'disputes'
  | 'fiscal'
  | 'payments'
  | 'transfers'
  | 'reports'
  | 'audit_trail'
  | 'settings';

export type Action = 'read' | 'create' | 'update' | 'delete' | 'approve' | 'export';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ALL_ACTIONS: Action[] = ['read', 'create', 'update', 'delete', 'approve', 'export'];
const READ_EXPORT: Action[] = ['read', 'export'];
const READ_ONLY: Action[] = ['read'];

export const ALL_MODULES: Module[] = [
  'dashboard',
  'cash_flows',
  'budgets',
  'forecasts',
  'scenarios',
  'bank_accounts',
  'counterparties',
  'capex',
  'debt',
  'investments',
  'credit_lines',
  'disputes',
  'fiscal',
  'payments',
  'transfers',
  'reports',
  'audit_trail',
  'settings',
];

export const TENANT_ROLES: TenantRole[] = ['tenant_admin', 'group_cfo', 'group_viewer'];
export const COMPANY_ROLES: CompanyRole[] = ['company_cfo', 'company_manager', 'treasurer', 'viewer', 'auditor'];

// ---------------------------------------------------------------------------
// Permission matrix type
// ---------------------------------------------------------------------------

export type PermissionMatrix = Record<Module, Action[]>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function allModules(actions: Action[]): PermissionMatrix {
  const perms = {} as PermissionMatrix;
  for (const mod of ALL_MODULES) {
    perms[mod] = [...actions];
  }
  return perms;
}

function withOverrides(
  base: PermissionMatrix,
  overrides: Partial<Record<Module, Action[]>>,
): PermissionMatrix {
  const copy = { ...base };
  for (const [mod, actions] of Object.entries(overrides) as [Module, Action[]][]) {
    copy[mod] = actions;
  }
  return copy;
}

// ---------------------------------------------------------------------------
// TENANT-LEVEL permission matrices
// ---------------------------------------------------------------------------

/**
 * tenant_admin: full access to everything including settings and user management.
 */
const TENANT_ADMIN_PERMS: PermissionMatrix = allModules(ALL_ACTIONS);

/**
 * group_cfo: full read/write on all financial modules, but no settings management.
 */
const GROUP_CFO_PERMS: PermissionMatrix = withOverrides(allModules(ALL_ACTIONS), {
  settings: ['read'],
});

/**
 * group_viewer: read-only + export across the board.
 */
const GROUP_VIEWER_PERMS: PermissionMatrix = allModules(READ_EXPORT);

// ---------------------------------------------------------------------------
// COMPANY-LEVEL permission matrices
// ---------------------------------------------------------------------------

/**
 * company_cfo: full read/write + approve (validation level 2) on everything
 * except settings (read-only) and audit_trail (read + export).
 */
const COMPANY_CFO_PERMS: PermissionMatrix = withOverrides(allModules(ALL_ACTIONS), {
  settings: ['read'],
  audit_trail: ['read', 'export'],
});

/**
 * company_manager: operational entry + validation level 1.
 * Can read, create, update, export on most modules.
 * Can approve (level 1) on payments and cash_flows.
 * No delete on critical modules. No settings write.
 */
const COMPANY_MANAGER_PERMS: PermissionMatrix = withOverrides(
  allModules(['read', 'create', 'update', 'export']),
  {
    dashboard: ['read', 'export'],
    cash_flows: ['read', 'create', 'update', 'approve', 'export'],
    payments: ['read', 'create', 'update', 'approve', 'export'],
    budgets: ['read', 'create', 'update', 'export'],
    forecasts: ['read', 'create', 'update', 'export'],
    scenarios: ['read', 'create', 'update', 'export'],
    bank_accounts: ['read', 'export'],
    reports: ['read', 'export'],
    audit_trail: ['read'],
    settings: ['read'],
  },
);

/**
 * treasurer: focused on cash operations.
 * Receipts/disbursements entry, bank reconciliation, transfers.
 */
const TREASURER_PERMS: PermissionMatrix = withOverrides(allModules(READ_ONLY), {
  dashboard: ['read', 'export'],
  cash_flows: ['read', 'create', 'update', 'export'],
  bank_accounts: ['read', 'update', 'export'],
  payments: ['read', 'create', 'update', 'export'],
  transfers: ['read', 'create', 'update', 'export'],
  counterparties: ['read', 'export'],
  reports: ['read', 'export'],
  audit_trail: ['read'],
});

/**
 * viewer: read-only + exports on everything.
 */
const VIEWER_PERMS: PermissionMatrix = allModules(READ_EXPORT);

/**
 * auditor: read-only everywhere + full audit trail access (all actions).
 */
const AUDITOR_PERMS: PermissionMatrix = withOverrides(allModules(READ_EXPORT), {
  audit_trail: ALL_ACTIONS,
});

// ---------------------------------------------------------------------------
// Unified permission lookup
// ---------------------------------------------------------------------------

export const PERMISSIONS: Record<Role, PermissionMatrix> = {
  // Tenant-level
  tenant_admin: TENANT_ADMIN_PERMS,
  group_cfo: GROUP_CFO_PERMS,
  group_viewer: GROUP_VIEWER_PERMS,
  // Company-level
  company_cfo: COMPANY_CFO_PERMS,
  company_manager: COMPANY_MANAGER_PERMS,
  treasurer: TREASURER_PERMS,
  viewer: VIEWER_PERMS,
  auditor: AUDITOR_PERMS,
};

// ---------------------------------------------------------------------------
// Permission check functions
// ---------------------------------------------------------------------------

/**
 * Check whether a role has permission to perform an action on a module.
 */
export function hasPermission(role: Role, module: string, action: Action): boolean {
  const rolePerms = PERMISSIONS[role];
  if (!rolePerms) return false;

  const modulePerms = rolePerms[module as Module];
  if (!modulePerms) return false;

  return modulePerms.includes(action);
}

/**
 * Determine the effective role for a user in the context of a specific company.
 *
 * Resolution order:
 *   1. If the user has a tenant-level role, it takes priority.
 *      - tenant_admin / group_cfo / group_viewer apply to ALL companies.
 *   2. Otherwise, use the company-specific role from UserCompanyAccess.
 *   3. If neither exists, fall back to 'viewer' (most restrictive).
 */
export function resolveEffectiveRole(
  tenantRole: TenantRole | null | undefined,
  companyRole: CompanyRole | null | undefined,
): Role {
  if (tenantRole && TENANT_ROLES.includes(tenantRole)) {
    return tenantRole;
  }
  if (companyRole && COMPANY_ROLES.includes(companyRole)) {
    return companyRole;
  }
  return 'viewer';
}

/**
 * Check permission using the 3-level resolution.
 *
 * @param tenantRole   - The user's tenant-level role (from UserProfile.tenant_role)
 * @param companyRole  - The user's company-level role (from UserCompanyAccess.role)
 * @param module       - Target module
 * @param action       - Target action
 */
export function hasEffectivePermission(
  tenantRole: TenantRole | null | undefined,
  companyRole: CompanyRole | null | undefined,
  module: string,
  action: Action,
): boolean {
  const role = resolveEffectiveRole(tenantRole, companyRole);
  return hasPermission(role, module, action);
}

/**
 * Check if a role is a tenant-level role.
 */
export function isTenantRole(role: string): role is TenantRole {
  return TENANT_ROLES.includes(role as TenantRole);
}

/**
 * Check if a role is a company-level role.
 */
export function isCompanyRole(role: string): role is CompanyRole {
  return COMPANY_ROLES.includes(role as CompanyRole);
}

/**
 * Get all allowed actions for a role on a given module.
 */
export function getAllowedActions(role: Role, module: Module): Action[] {
  return PERMISSIONS[role]?.[module] ?? [];
}

/**
 * Get all modules a role has at least read access to.
 */
export function getAccessibleModules(role: Role): Module[] {
  const perms = PERMISSIONS[role];
  if (!perms) return [];
  return ALL_MODULES.filter((mod) => perms[mod]?.includes('read'));
}
