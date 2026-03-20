import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '../services/dashboard.service';

// ─── Legacy hooks (kept for backward compat) ────────────────────────────────

export function useDashboardSummary(companyId: string | undefined) {
  return useQuery({
    queryKey: ['dashboard', 'summary', companyId ?? 'demo'],
    queryFn: () => dashboardService.getSummary(companyId ?? 'demo'),
  });
}

export function useCashFlowTrend(companyId: string | undefined, months: number = 6) {
  return useQuery({
    queryKey: ['dashboard', 'cashflow-trend', companyId ?? 'demo', months],
    queryFn: () => dashboardService.getCashFlowTrend(companyId ?? 'demo', months),
  });
}

export function useTopCategories(companyId: string | undefined) {
  return useQuery({
    queryKey: ['dashboard', 'top-categories', companyId ?? 'demo'],
    queryFn: () => dashboardService.getTopCategories(companyId ?? 'demo'),
  });
}

export function useRecentTransactions(companyId: string | undefined, limit: number = 10) {
  return useQuery({
    queryKey: ['dashboard', 'recent-transactions', companyId ?? 'demo', limit],
    queryFn: () => dashboardService.getRecentTransactions(companyId ?? 'demo', limit),
  });
}

// ─── CEO Dashboard ───────────────────────────────────────────────────────────

export function useCEODashboard(tenantId: string | undefined) {
  return useQuery({
    queryKey: ['dashboard', 'ceo', tenantId ?? 'demo'],
    queryFn: () => dashboardService.getCEODashboard(tenantId ?? 'demo'),
    enabled: !!tenantId || true, // always enabled for demo
  });
}

// ─── CFO Dashboard ───────────────────────────────────────────────────────────

export function useCFODashboard(companyId: string | undefined) {
  return useQuery({
    queryKey: ['dashboard', 'cfo', companyId ?? 'demo'],
    queryFn: () => dashboardService.getCFODashboard(companyId ?? 'demo'),
    enabled: !!companyId || true,
  });
}

// ─── Treasurer Dashboard ─────────────────────────────────────────────────────

export function useTreasurerDashboard(companyId: string | undefined) {
  return useQuery({
    queryKey: ['dashboard', 'treasurer', companyId ?? 'demo'],
    queryFn: () => dashboardService.getTreasurerDashboard(companyId ?? 'demo'),
    enabled: !!companyId || true,
  });
}

// ─── Center Manager Dashboard ────────────────────────────────────────────────

export function useCenterManagerDashboard(companyId: string | undefined) {
  return useQuery({
    queryKey: ['dashboard', 'center-manager', companyId ?? 'demo'],
    queryFn: () => dashboardService.getCenterManagerDashboard(companyId ?? 'demo'),
    enabled: !!companyId || true,
  });
}
