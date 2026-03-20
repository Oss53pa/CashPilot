import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cashFlowService } from '../services/cashflow.service';
import type { CashFlowFormData } from '../types';

export function useCashFlows(companyId: string | undefined, type?: 'receipt' | 'disbursement') {
  return useQuery({
    queryKey: ['cash-flows', companyId, type],
    queryFn: () =>
      type
        ? cashFlowService.listByType(companyId!, type)
        : cashFlowService.list(companyId!),
    enabled: !!companyId,
  });
}

export function useCashFlow(id: string | undefined) {
  return useQuery({
    queryKey: ['cash-flows', id],
    queryFn: () => cashFlowService.getById(id!),
    enabled: !!id,
  });
}

export function useCreateCashFlow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      companyId,
      userId,
      data,
    }: {
      companyId: string;
      userId: string;
      data: CashFlowFormData;
    }) => cashFlowService.create(companyId, userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cash-flows'] });
    },
  });
}

export function useUpdateCashFlow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CashFlowFormData> }) =>
      cashFlowService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cash-flows'] });
    },
  });
}

export function useDeleteCashFlow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => cashFlowService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cash-flows'] });
    },
  });
}

export function useValidateCashFlow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, userId }: { id: string; userId: string }) =>
      cashFlowService.validateFlow(id, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cash-flows'] });
    },
  });
}

export function useMonthlySummary(
  companyId: string | undefined,
  type: 'receipt' | 'disbursement',
  year: number,
  month: number,
) {
  return useQuery({
    queryKey: ['cash-flows', 'summary', companyId, type, year, month],
    queryFn: () => cashFlowService.getMonthlySummary(companyId!, type, year, month),
    enabled: !!companyId,
  });
}
