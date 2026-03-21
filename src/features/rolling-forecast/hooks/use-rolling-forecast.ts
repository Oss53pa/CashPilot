import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rollingForecastService } from '../services/rolling-forecast.service';
import type { Granularity, SimulationParams } from '../types';

const QUERY_KEY = 'rolling-forecast';

export function useRollingForecast(
  companyId: string,
  granularity: Granularity = 'weekly_monthly',
  scenario: 'base' | 'optimistic' | 'pessimistic' = 'base',
) {
  return useQuery({
    queryKey: [QUERY_KEY, companyId, granularity, scenario],
    queryFn: () => rollingForecastService.getRollingForecast(companyId, granularity, scenario),
    enabled: !!companyId,
  });
}

export function usePlan13Weeks(companyId: string) {
  return useQuery({
    queryKey: [QUERY_KEY, '13-weeks', companyId],
    queryFn: () => rollingForecastService.getPlan13Weeks(companyId),
    enabled: !!companyId,
  });
}

export function useSimulation(companyId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: SimulationParams) =>
      rollingForecastService.simulateWithParams(companyId, params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, companyId] });
    },
  });
}

export function useRefreshForecast(companyId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => rollingForecastService.refreshForecast(companyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, companyId] });
    },
  });
}

export function useExportRollingExcel() {
  return useMutation({
    mutationFn: (forecastId: string) =>
      rollingForecastService.exportRollingExcel(forecastId),
  });
}

export function useExportPlan13WeeksPDF() {
  return useMutation({
    mutationFn: (forecastId: string) =>
      rollingForecastService.exportPlan13WeeksPDF(forecastId),
  });
}
