import { useQuery } from '@tanstack/react-query';
import { reportsService } from '../services/reports.service';

export function useCashPositionReport(companyId: string | undefined, date: string) {
  return useQuery({
    queryKey: ['reports', 'cash-position', companyId, date],
    queryFn: () => reportsService.cashPositionReport(companyId!, date),
    enabled: !!companyId && !!date,
  });
}

export function useCashFlowReport(
  companyId: string | undefined,
  startDate: string,
  endDate: string,
) {
  return useQuery({
    queryKey: ['reports', 'cash-flow', companyId, startDate, endDate],
    queryFn: () => reportsService.cashFlowReport(companyId!, startDate, endDate),
    enabled: !!companyId && !!startDate && !!endDate,
  });
}

export function useBudgetVarianceReport(companyId: string | undefined, budgetId: string) {
  return useQuery({
    queryKey: ['reports', 'budget-variance', companyId, budgetId],
    queryFn: () => reportsService.budgetVarianceReport(companyId!, budgetId),
    enabled: !!companyId && !!budgetId,
  });
}

export function useForecastAccuracyReport(companyId: string | undefined, period: string) {
  return useQuery({
    queryKey: ['reports', 'forecast-accuracy', companyId, period],
    queryFn: () => reportsService.forecastAccuracyReport(companyId!, period),
    enabled: !!companyId && !!period,
  });
}

export function useAgingReport(companyId: string | undefined) {
  return useQuery({
    queryKey: ['reports', 'aging', companyId],
    queryFn: () => reportsService.agingReport(companyId!),
    enabled: !!companyId,
  });
}

export function useBankReconciliationReport(companyId: string | undefined, accountId: string) {
  return useQuery({
    queryKey: ['reports', 'bank-reconciliation', companyId, accountId],
    queryFn: () => reportsService.bankReconciliationReport(companyId!, accountId),
    enabled: !!companyId && !!accountId,
  });
}
