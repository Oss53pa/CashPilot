import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cashFlowService } from '../services/cashflow.service';
import type { CashFlowFormData, ReceivableEntry, PayableEntry } from '../types';

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

// ── Receivables hooks ──
export function useReceivables(companyId: string | undefined) {
  return useQuery({
    queryKey: ['receivables', companyId],
    queryFn: () => cashFlowService.listReceivables(companyId!),
    enabled: !!companyId,
  });
}

export function useReceivable(id: string | undefined) {
  return useQuery({
    queryKey: ['receivables', id],
    queryFn: () => cashFlowService.getReceivable(id!),
    enabled: !!id,
  });
}

export function useCreateReceivable() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ companyId, data }: { companyId: string; data: Partial<ReceivableEntry> }) =>
      cashFlowService.createReceivable(companyId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receivables'] });
      queryClient.invalidateQueries({ queryKey: ['cash-flows'] });
    },
  });
}

export function useUpdateReceivable() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ReceivableEntry> }) =>
      cashFlowService.updateReceivable(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receivables'] });
      queryClient.invalidateQueries({ queryKey: ['cash-flows'] });
    },
  });
}

export function useDeleteReceivable() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => cashFlowService.deleteReceivable(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receivables'] });
    },
  });
}

// ── Payables hooks ──
export function usePayables(companyId: string | undefined) {
  return useQuery({
    queryKey: ['payables', companyId],
    queryFn: () => cashFlowService.listPayables(companyId!),
    enabled: !!companyId,
  });
}

export function usePayable(id: string | undefined) {
  return useQuery({
    queryKey: ['payables', id],
    queryFn: () => cashFlowService.getPayable(id!),
    enabled: !!id,
  });
}

export function useCreatePayable() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ companyId, data }: { companyId: string; data: Partial<PayableEntry> }) =>
      cashFlowService.createPayable(companyId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payables'] });
      queryClient.invalidateQueries({ queryKey: ['cash-flows'] });
    },
  });
}

export function useUpdatePayable() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<PayableEntry> }) =>
      cashFlowService.updatePayable(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payables'] });
      queryClient.invalidateQueries({ queryKey: ['cash-flows'] });
    },
  });
}

export function useDeletePayable() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => cashFlowService.deletePayable(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payables'] });
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
