import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { consolidationService } from '../services/consolidation.service';
import type { ConsolidationConfig } from '../services/consolidation.service';

export function useGroupView(tenantId: string | undefined) {
  return useQuery({
    queryKey: ['consolidation', 'group', tenantId],
    queryFn: () => consolidationService.getGroupView(tenantId!),
    enabled: !!tenantId,
  });
}

export function useInterCompanyFlows(tenantId: string | undefined) {
  return useQuery({
    queryKey: ['consolidation', 'intercompany', tenantId],
    queryFn: () => consolidationService.getInterCompanyFlows(tenantId!),
    enabled: !!tenantId,
  });
}

export function useConsolidatedBalance(tenantId: string | undefined) {
  return useQuery({
    queryKey: ['consolidation', 'balance', tenantId],
    queryFn: () => consolidationService.getConsolidatedBalance(tenantId!),
    enabled: !!tenantId,
  });
}

export function useConsolidationConfig(tenantId: string | undefined) {
  return useQuery({
    queryKey: ['consolidation', 'config', tenantId],
    queryFn: () => consolidationService.getConsolidationConfig(tenantId!),
    enabled: !!tenantId,
  });
}

export function useUpdateConsolidationConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<ConsolidationConfig>) =>
      consolidationService.updateConsolidationConfig(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consolidation', 'config'] });
    },
  });
}

export function useEliminatedFlows(tenantId: string | undefined) {
  return useQuery({
    queryKey: ['consolidation', 'eliminations', tenantId],
    queryFn: () => consolidationService.getEliminatedFlows(tenantId!),
    enabled: !!tenantId,
  });
}

export function useConsolidatedReport(tenantId: string | undefined, period: string) {
  return useQuery({
    queryKey: ['consolidation', 'report', tenantId, period],
    queryFn: () => consolidationService.getConsolidatedReport(tenantId!, period),
    enabled: !!tenantId,
  });
}
