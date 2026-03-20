import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { disputesService } from '../services/disputes.service';
import type { DisputeFileFormData, ExitScenario } from '../types';

export function useDisputes(companyId: string | undefined) {
  return useQuery({
    queryKey: ['disputes', companyId],
    queryFn: () => disputesService.list(companyId!),
    enabled: !!companyId,
  });
}

export function useDispute(id: string | undefined) {
  return useQuery({
    queryKey: ['disputes', id],
    queryFn: () => disputesService.getById(id!),
    enabled: !!id,
  });
}

export function useCreateDispute() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      companyId,
      userId,
      data,
    }: {
      companyId: string;
      userId: string;
      data: DisputeFileFormData;
    }) => disputesService.create(companyId, userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['disputes'] });
    },
  });
}

export function useUpdateDispute() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<DisputeFileFormData> }) =>
      disputesService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['disputes'] });
    },
  });
}

export function useDeleteDispute() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => disputesService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['disputes'] });
    },
  });
}

// Exit Scenarios
export function useExitScenarios(disputeId: string | undefined) {
  return useQuery({
    queryKey: ['exit-scenarios', disputeId],
    queryFn: () => disputesService.getExitScenarios(disputeId!),
    enabled: !!disputeId,
  });
}

export function useCreateExitScenario() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Omit<ExitScenario, 'id'>) =>
      disputesService.createExitScenario(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exit-scenarios'] });
    },
  });
}

export function useDeleteExitScenario() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => disputesService.deleteExitScenario(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exit-scenarios'] });
    },
  });
}

// Dashboard
export function useDisputeDashboard(companyId: string | undefined) {
  return useQuery({
    queryKey: ['dispute-dashboard', companyId],
    queryFn: () => disputesService.getDisputeDashboard(companyId!),
    enabled: !!companyId,
  });
}
