import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCompanyStore } from '@/stores/company.store';
import * as proph3tService from '../services/proph3t.service';
import type { AlertStatus, ForecastScenario, FraudStatus } from '@/types/proph3t';

function useCompanyId() {
  return useCompanyStore((s) => s.currentCompany?.id);
}

// ============================================================================
// FORECASTS
// ============================================================================

export function useForecasts(options?: {
  scenario?: ForecastScenario;
  category?: string;
  fromDate?: string;
  toDate?: string;
}) {
  const companyId = useCompanyId();
  return useQuery({
    queryKey: ['proph3t', 'forecasts', companyId, options],
    queryFn: () => proph3tService.getForecasts(companyId!, options),
    enabled: !!companyId,
  });
}

// ============================================================================
// ANOMALIES
// ============================================================================

export function useAnomalies(status?: string) {
  const companyId = useCompanyId();
  return useQuery({
    queryKey: ['proph3t', 'anomalies', companyId, status],
    queryFn: () => proph3tService.getAnomalies(companyId!, { status }),
    enabled: !!companyId,
  });
}

// ============================================================================
// TENANT SCORES
// ============================================================================

export function useLatestTenantScores() {
  const companyId = useCompanyId();
  return useQuery({
    queryKey: ['proph3t', 'tenant-scores', companyId],
    queryFn: () => proph3tService.getLatestTenantScores(companyId!),
    enabled: !!companyId,
  });
}

export function useTenantScoreHistory(counterpartyId: string | undefined) {
  const companyId = useCompanyId();
  return useQuery({
    queryKey: ['proph3t', 'tenant-score-history', companyId, counterpartyId],
    queryFn: () => proph3tService.getTenantScoreHistory(companyId!, counterpartyId!),
    enabled: !!companyId && !!counterpartyId,
  });
}

// ============================================================================
// ALERTS
// ============================================================================

export function useAlerts(options?: { status?: AlertStatus; priority?: string }) {
  const companyId = useCompanyId();
  return useQuery({
    queryKey: ['proph3t', 'alerts', companyId, options],
    queryFn: () => proph3tService.getAlerts(companyId!, options),
    enabled: !!companyId,
  });
}

export function useUpdateAlertStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      alertId,
      status,
      actionTaken,
    }: {
      alertId: string;
      status: AlertStatus;
      actionTaken?: string;
    }) => proph3tService.updateAlertStatus(alertId, status, actionTaken),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proph3t', 'alerts'] });
    },
  });
}

// ============================================================================
// NARRATIVES
// ============================================================================

export function useLatestNarrative() {
  const companyId = useCompanyId();
  return useQuery({
    queryKey: ['proph3t', 'narrative', companyId],
    queryFn: () => proph3tService.getLatestNarrative(companyId!),
    enabled: !!companyId,
  });
}

export function useNarrativeHistory() {
  const companyId = useCompanyId();
  return useQuery({
    queryKey: ['proph3t', 'narrative-history', companyId],
    queryFn: () => proph3tService.getNarrativeHistory(companyId!),
    enabled: !!companyId,
  });
}

// ============================================================================
// RECOMMENDATIONS
// ============================================================================

export function useRecommendations(alertId?: string) {
  const companyId = useCompanyId();
  return useQuery({
    queryKey: ['proph3t', 'recommendations', companyId, alertId],
    queryFn: () => proph3tService.getRecommendations(companyId!, alertId),
    enabled: !!companyId,
  });
}

// ============================================================================
// WHAT-IF
// ============================================================================

export function useWhatIf() {
  const companyId = useCompanyId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ query, language }: { query: string; language?: 'fr' | 'en' }) =>
      proph3tService.runWhatIf(companyId!, query, language),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proph3t', 'whatif-history'] });
    },
  });
}

export function useWhatIfHistory() {
  const companyId = useCompanyId();
  return useQuery({
    queryKey: ['proph3t', 'whatif-history', companyId],
    queryFn: () => proph3tService.getWhatIfHistory(companyId!),
    enabled: !!companyId,
  });
}

// ============================================================================
// FRAUD
// ============================================================================

export function useFraudAlerts(status?: string) {
  const companyId = useCompanyId();
  return useQuery({
    queryKey: ['proph3t', 'fraud-alerts', companyId, status],
    queryFn: () => proph3tService.getFraudAlerts(companyId!, { status }),
    enabled: !!companyId,
  });
}

export function useUpdateFraudAlertStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      alertId,
      status,
      investigationNotes,
    }: {
      alertId: string;
      status: FraudStatus;
      investigationNotes?: string;
    }) => proph3tService.updateFraudAlertStatus(alertId, status, investigationNotes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proph3t', 'fraud-alerts'] });
    },
  });
}

export function useUpdateAnomalyStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      anomalyId,
      status,
      investigationNote,
    }: {
      anomalyId: string;
      status: 'open' | 'investigated' | 'cleared' | 'confirmed_fraud';
      investigationNote?: string;
    }) => proph3tService.updateAnomalyStatus(anomalyId, status, investigationNote),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proph3t', 'anomalies'] });
    },
  });
}

// ============================================================================
// PERFORMANCE
// ============================================================================

export function usePerformanceLogs(options?: { category?: string; modelUsed?: string }) {
  const companyId = useCompanyId();
  return useQuery({
    queryKey: ['proph3t', 'performance', companyId, options],
    queryFn: () => proph3tService.getPerformanceLogs(companyId!, options),
    enabled: !!companyId,
  });
}

export function useActiveModelConfigs() {
  const companyId = useCompanyId();
  return useQuery({
    queryKey: ['proph3t', 'model-configs', companyId],
    queryFn: () => proph3tService.getActiveModelConfigs(companyId!),
    enabled: !!companyId,
  });
}

// ============================================================================
// MANUAL TRIGGERS
// ============================================================================

export function useTriggerForecast() {
  const companyId = useCompanyId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (horizonDays?: number[]) =>
      proph3tService.triggerForecast(companyId!, horizonDays),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proph3t', 'forecasts'] });
    },
  });
}

export function useTriggerBehaviorScore() {
  const companyId = useCompanyId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => proph3tService.triggerBehaviorScore(companyId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proph3t', 'tenant-scores'] });
    },
  });
}
