import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tftService } from '../services/tft.service';

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------

const tftKeys = {
  all: ['tft'] as const,
  detail: (companyId: string, start: string, end: string, method: string, type: string) =>
    [...tftKeys.all, 'detail', companyId, start, end, method, type] as const,
  comparison: (companyId: string, p1s: string, p1e: string, p2s: string, p2e: string) =>
    [...tftKeys.all, 'comparison', companyId, p1s, p1e, p2s, p2e] as const,
  rules: () => [...tftKeys.all, 'rules'] as const,
};

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

export function useTFT(
  companyId: string,
  periodStart: string,
  periodEnd: string,
  method: 'direct' | 'indirect' = 'direct',
  statementType: 'realized' | 'forecast' | 'hybrid' = 'realized',
) {
  return useQuery({
    queryKey: tftKeys.detail(companyId, periodStart, periodEnd, method, statementType),
    queryFn: () => tftService.getTFT(companyId, periodStart, periodEnd, method, statementType),
    enabled: !!companyId && !!periodStart && !!periodEnd,
  });
}

export function useTFTComparison(
  companyId: string,
  period1Start: string,
  period1End: string,
  period2Start: string,
  period2End: string,
) {
  return useQuery({
    queryKey: tftKeys.comparison(companyId, period1Start, period1End, period2Start, period2End),
    queryFn: () => tftService.getTFTComparison(companyId, period1Start, period1End, period2Start, period2End),
    enabled: !!companyId && !!period1Start && !!period2Start,
  });
}

export function useCertifyTFT() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ tftId, userId }: { tftId: string; userId: string }) =>
      tftService.certifyTFT(tftId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tftKeys.all });
    },
  });
}

export function useExportTFTPDF() {
  return useMutation({
    mutationFn: (tftId: string) => tftService.exportTFTPDF(tftId),
  });
}

export function useClassificationRules() {
  return useQuery({
    queryKey: tftKeys.rules(),
    queryFn: () => tftService.getClassificationRules(),
    staleTime: Infinity,
  });
}
