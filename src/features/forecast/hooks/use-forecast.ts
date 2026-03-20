import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { forecastService } from '../services/forecast.service';
import type { ForecastInput, ForecastUpdateInput } from '../types';
export type { ForecastInput, ForecastUpdateInput };

export function useForecasts(companyId: string, horizon?: string) {
  return useQuery({
    queryKey: ['forecasts', companyId, horizon],
    queryFn: () => forecastService.listForecasts(companyId, horizon),
    enabled: !!companyId,
  });
}

export function useForecast(id: string) {
  return useQuery({
    queryKey: ['forecasts', 'detail', id],
    queryFn: () => forecastService.getForecast(id),
    enabled: !!id,
  });
}

export function useCreateForecast(companyId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ForecastInput) => forecastService.createForecast(companyId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forecasts', companyId] });
    },
  });
}

export function useUpdateForecast(_companyId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ForecastUpdateInput }) =>
      forecastService.updateForecast(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forecasts'] });
    },
  });
}

export function useDeleteForecast(companyId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => forecastService.deleteForecast(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forecasts', companyId] });
    },
  });
}

export function useForecastVsActual(
  companyId: string,
  period: { from: string; to: string }
) {
  return useQuery({
    queryKey: ['forecasts', 'vs-actual', companyId, period],
    queryFn: () => forecastService.getForecastVsActual(companyId, period),
    enabled: !!companyId && !!period.from && !!period.to,
  });
}

export function useForecastAccuracy(companyId: string) {
  return useQuery({
    queryKey: ['forecasts', 'accuracy', companyId],
    queryFn: () => forecastService.getAccuracy(companyId),
    enabled: !!companyId,
  });
}

export function useMethodRecommendations(companyId: string) {
  return useQuery({
    queryKey: ['forecasts', 'methods', companyId],
    queryFn: () => forecastService.getMethodRecommendations(companyId),
    enabled: !!companyId,
  });
}

export function useForecastMetrics(companyId: string) {
  return useQuery({
    queryKey: ['forecasts', 'metrics', companyId],
    queryFn: () => forecastService.getForecastMetrics(companyId),
    enabled: !!companyId,
  });
}

export function useColdStartPhase(companyId: string) {
  return useQuery({
    queryKey: ['forecasts', 'cold-start', companyId],
    queryFn: () => forecastService.getColdStartPhase(companyId),
    enabled: !!companyId,
  });
}

export function useRecalibrationLog(companyId: string) {
  return useQuery({
    queryKey: ['forecasts', 'recalibration-log', companyId],
    queryFn: () => forecastService.getRecalibrationLog(companyId),
    enabled: !!companyId,
  });
}

export function useTriggerRecalibration(companyId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => forecastService.triggerRecalibration(companyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forecasts', 'recalibration-log', companyId] });
      queryClient.invalidateQueries({ queryKey: ['forecasts', 'metrics', companyId] });
    },
  });
}

export function useAccuracyTrend(companyId: string) {
  return useQuery({
    queryKey: ['forecasts', 'accuracy-trend', companyId],
    queryFn: () => forecastService.getAccuracyTrend(companyId),
    enabled: !!companyId,
  });
}
