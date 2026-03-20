import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cashRegistersService } from '../services/cash-registers.service';
import type { CashRegisterFormData, CashCount, CashWithdrawalRequest } from '../types';

export function useCashRegisters(companyId: string | undefined, type?: 'cash' | 'mobile_money') {
  return useQuery({
    queryKey: ['cash-registers', companyId, type],
    queryFn: () => cashRegistersService.list(companyId!, type),
    enabled: !!companyId,
  });
}

export function useCashRegister(id: string | undefined) {
  return useQuery({
    queryKey: ['cash-registers', id],
    queryFn: () => cashRegistersService.getById(id!),
    enabled: !!id,
  });
}

export function useCreateCashRegister() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ companyId, data }: { companyId: string; data: CashRegisterFormData }) =>
      cashRegistersService.create(companyId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cash-registers'] });
      queryClient.invalidateQueries({ queryKey: ['bank-accounts'] });
    },
  });
}

export function useUpdateCashRegister() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CashRegisterFormData> }) =>
      cashRegistersService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cash-registers'] });
      queryClient.invalidateQueries({ queryKey: ['bank-accounts'] });
    },
  });
}

export function useDeleteCashRegister() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => cashRegistersService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cash-registers'] });
      queryClient.invalidateQueries({ queryKey: ['bank-accounts'] });
    },
  });
}

// Cash Counts
export function useCashCounts(companyId: string | undefined) {
  return useQuery({
    queryKey: ['cash-counts', companyId],
    queryFn: () => cashRegistersService.getCashCounts(companyId!),
    enabled: !!companyId,
  });
}

export function useCreateCashCount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ companyId, data }: { companyId: string; data: Omit<CashCount, 'id' | 'variance' | 'status'> }) =>
      cashRegistersService.createCashCount(companyId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cash-counts'] });
    },
  });
}

// Withdrawal Requests
export function useWithdrawalRequests(companyId: string | undefined) {
  return useQuery({
    queryKey: ['withdrawal-requests', companyId],
    queryFn: () => cashRegistersService.getWithdrawalRequests(companyId!),
    enabled: !!companyId,
  });
}

export function useCreateWithdrawalRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ companyId, data }: { companyId: string; data: Omit<CashWithdrawalRequest, 'id' | 'approved_by' | 'approval_status' | 'justification_received'> }) =>
      cashRegistersService.createWithdrawalRequest(companyId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['withdrawal-requests'] });
    },
  });
}

export function useApproveWithdrawalRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, approvedBy, approved }: { id: string; approvedBy: string; approved: boolean }) =>
      cashRegistersService.approveWithdrawalRequest(id, approvedBy, approved),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['withdrawal-requests'] });
    },
  });
}
