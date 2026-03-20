import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { transfersService } from '../services/transfers.service';
import type { TransferFormData, TransferFilters } from '../types';

export function useTransfers(companyId: string | undefined, filters?: TransferFilters) {
  return useQuery({
    queryKey: ['transfers', companyId, filters],
    queryFn: () => transfersService.getTransfers(companyId!, filters),
    enabled: !!companyId,
  });
}

export function useTransfer(id: string | undefined) {
  return useQuery({
    queryKey: ['transfers', id],
    queryFn: () => transfersService.getTransferById(id!),
    enabled: !!id,
  });
}

export function useCreateTransfer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      companyId,
      data,
      userId,
    }: {
      companyId: string;
      data: TransferFormData;
      userId: string;
    }) => transfersService.createTransfer(companyId, data, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transfers'] });
    },
  });
}

export function useUpdateTransfer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TransferFormData> }) =>
      transfersService.updateTransfer(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transfers'] });
    },
  });
}

export function useValidateTransfer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, userId }: { id: string; userId: string }) =>
      transfersService.validateTransfer(id, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transfers'] });
    },
  });
}

export function useCompleteTransfer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => transfersService.completeTransfer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transfers'] });
    },
  });
}

export function useCancelTransfer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => transfersService.cancelTransfer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transfers'] });
    },
  });
}

export function useTransitBalance(companyId: string | undefined) {
  return useQuery({
    queryKey: ['transfers', 'transit-balance', companyId],
    queryFn: () => transfersService.getTransitBalance(companyId!),
    enabled: !!companyId,
  });
}

export function useIntercompanyFlows(tenantId: string | undefined) {
  return useQuery({
    queryKey: ['transfers', 'intercompany-flows', tenantId],
    queryFn: () => transfersService.getIntercompanyFlows(tenantId!),
    enabled: !!tenantId,
  });
}

export function useTransferSummary(companyId: string | undefined) {
  return useQuery({
    queryKey: ['transfers', 'summary', companyId],
    queryFn: () => transfersService.getTransferSummary(companyId!),
    enabled: !!companyId,
  });
}
