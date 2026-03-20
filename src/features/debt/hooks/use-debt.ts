import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { debtService } from '../services/debt.service';
import type { DebtContractFormData } from '../types';

export function useDebtContracts(companyId: string | undefined) {
  return useQuery({
    queryKey: ['debt-contracts', companyId],
    queryFn: () => debtService.list(companyId!),
    enabled: !!companyId,
  });
}

export function useDebtContract(id: string | undefined) {
  return useQuery({
    queryKey: ['debt-contracts', id],
    queryFn: () => debtService.getById(id!),
    enabled: !!id,
  });
}

export function useCreateDebtContract() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ companyId, data }: { companyId: string; data: DebtContractFormData }) =>
      debtService.create(companyId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debt-contracts'] });
    },
  });
}

export function useUpdateDebtContract() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<DebtContractFormData> }) =>
      debtService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debt-contracts'] });
    },
  });
}

export function useDeleteDebtContract() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => debtService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debt-contracts'] });
    },
  });
}

export function useDebtSummary(companyId: string | undefined) {
  return useQuery({
    queryKey: ['debt-contracts', 'summary', companyId],
    queryFn: () => debtService.getDebtSummary(companyId!),
    enabled: !!companyId,
  });
}

export function useRepaymentSchedule(contractId: string | undefined) {
  return useQuery({
    queryKey: ['debt-contracts', 'schedule', contractId],
    queryFn: () => debtService.getRepaymentSchedule(contractId!),
    enabled: !!contractId,
  });
}
