import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  auditTrailService,
  type AuditLogFilters,
  type ClosingStepStatus,
} from '../services/audit-trail.service';

export function useAuditLogs(companyId: string, filters?: AuditLogFilters) {
  return useQuery({
    queryKey: ['audit-logs', companyId, filters],
    queryFn: () => auditTrailService.list(companyId, filters),
    enabled: !!companyId,
  });
}

export function useEntityAuditLogs(entityType: string, entityId: string) {
  return useQuery({
    queryKey: ['audit-logs', 'entity', entityType, entityId],
    queryFn: () => auditTrailService.getByEntity(entityType, entityId),
    enabled: !!entityType && !!entityId,
  });
}

export function usePeriodClosingStatus(companyId: string, period: string) {
  return useQuery({
    queryKey: ['period-closing', companyId, period],
    queryFn: () => auditTrailService.getPeriodClosingStatus(companyId, period),
    enabled: !!companyId && !!period,
  });
}

export function useInitiatePeriodClosing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ companyId, period }: { companyId: string; period: string }) =>
      auditTrailService.initiatePeriodClosing(companyId, period),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['period-closing'] });
    },
  });
}

export function useUpdateClosingStep() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      closingId,
      step,
      status,
    }: {
      closingId: string;
      step: number;
      status: ClosingStepStatus;
    }) => auditTrailService.updateClosingStep(closingId, step, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['period-closing'] });
    },
  });
}

export function useCompletePeriodClosing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (closingId: string) =>
      auditTrailService.completePeriodClosing(closingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['period-closing'] });
    },
  });
}

export function useReconciliation(companyId: string, period: string) {
  return useQuery({
    queryKey: ['reconciliation', companyId, period],
    queryFn: () => auditTrailService.getReconciliation(companyId, period),
    enabled: !!companyId && !!period,
  });
}
