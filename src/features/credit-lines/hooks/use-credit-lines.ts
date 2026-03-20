import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { creditLinesService } from '../services/credit-lines.service';
import type { CreditLineFormData } from '../types';

export function useCreditLines(companyId: string | undefined) {
  return useQuery({
    queryKey: ['credit-lines', companyId],
    queryFn: () => creditLinesService.list(companyId!),
    enabled: !!companyId,
  });
}

export function useCreditLine(id: string | undefined) {
  return useQuery({
    queryKey: ['credit-lines', id],
    queryFn: () => creditLinesService.getById(id!),
    enabled: !!id,
  });
}

export function useCreateCreditLine() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ companyId, data }: { companyId: string; data: CreditLineFormData }) =>
      creditLinesService.create(companyId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credit-lines'] });
    },
  });
}

export function useUpdateCreditLine() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreditLineFormData> }) =>
      creditLinesService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credit-lines'] });
    },
  });
}

export function useDeleteCreditLine() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => creditLinesService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credit-lines'] });
    },
  });
}
