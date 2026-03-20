import { useQuery } from '@tanstack/react-query';
import { consolidationService } from '../services/consolidation.service';

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
