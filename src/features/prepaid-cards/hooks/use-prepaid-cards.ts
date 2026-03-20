import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { prepaidCardsService } from '../services/prepaid-cards.service';
import type { PrepaidCardFormData } from '../types';

export function usePrepaidCards(companyId: string | undefined) {
  return useQuery({
    queryKey: ['prepaid-cards', companyId],
    queryFn: () => prepaidCardsService.list(companyId!),
    enabled: !!companyId,
  });
}

export function usePrepaidCard(id: string | undefined) {
  return useQuery({
    queryKey: ['prepaid-cards', id],
    queryFn: () => prepaidCardsService.getById(id!),
    enabled: !!id,
  });
}

export function useCreatePrepaidCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ companyId, data }: { companyId: string; data: PrepaidCardFormData }) =>
      prepaidCardsService.create(companyId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prepaid-cards'] });
    },
  });
}

export function useUpdatePrepaidCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<PrepaidCardFormData> }) =>
      prepaidCardsService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prepaid-cards'] });
    },
  });
}

export function useDeletePrepaidCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => prepaidCardsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prepaid-cards'] });
    },
  });
}
