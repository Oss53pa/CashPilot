import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { scenariosService } from '../services/scenarios.service';
import type { ScenarioFormData, StressTest, WhatIfParameters } from '../types';

export function useScenarios(companyId: string | undefined) {
  return useQuery({
    queryKey: ['scenarios', companyId],
    queryFn: () => scenariosService.list(companyId!),
    enabled: !!companyId,
  });
}

export function useScenario(id: string | undefined) {
  return useQuery({
    queryKey: ['scenarios', id],
    queryFn: () => scenariosService.getById(id!),
    enabled: !!id,
  });
}

export function useCreateScenario() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      companyId,
      userId,
      data,
    }: {
      companyId: string;
      userId: string;
      data: ScenarioFormData;
    }) => scenariosService.create(companyId, userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scenarios'] });
    },
  });
}

export function useUpdateScenario() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ScenarioFormData> }) =>
      scenariosService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scenarios'] });
    },
  });
}

export function useDeleteScenario() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => scenariosService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scenarios'] });
    },
  });
}

export function useRunScenario() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => scenariosService.runScenario(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scenarios'] });
    },
  });
}

export function useAutoScenarios(companyId: string | undefined) {
  return useQuery({
    queryKey: ['scenarios', 'auto', companyId],
    queryFn: () => scenariosService.generateAutoScenarios(companyId!),
    enabled: !!companyId,
  });
}

export function useRunStressTest() {
  return useMutation({
    mutationFn: (stressTest: StressTest) => scenariosService.runStressTest(stressTest),
  });
}

export function useRunWhatIf() {
  return useMutation({
    mutationFn: (parameters: WhatIfParameters) => scenariosService.runWhatIf(parameters),
  });
}
