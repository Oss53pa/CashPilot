import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { transfersService } from '../services/transfers.service';
import type { InternalTransferFormData } from '../types';

export function useTransfers(companyId: string | undefined) {
  return useQuery({
    queryKey: ['internal-transfers', companyId],
    queryFn: () => transfersService.list(companyId!),
    enabled: !!companyId,
  });
}

export function useTransfer(id: string | undefined) {
  return useQuery({
    queryKey: ['internal-transfers', id],
    queryFn: () => transfersService.getById(id!),
    enabled: !!id,
  });
}

export function useCreateTransfer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      companyId,
      userId,
      data,
    }: {
      companyId: string;
      userId: string;
      data: InternalTransferFormData;
    }) => transfersService.create(companyId, userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['internal-transfers'] });
    },
  });
}

export function useUpdateTransfer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<InternalTransferFormData> }) =>
      transfersService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['internal-transfers'] });
    },
  });
}

export function useDeleteTransfer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => transfersService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['internal-transfers'] });
    },
  });
}

export function useExecuteTransfer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => transfersService.execute(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['internal-transfers'] });
    },
  });
}

export function useCancelTransfer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => transfersService.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['internal-transfers'] });
    },
  });
}
