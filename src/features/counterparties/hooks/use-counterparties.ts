import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { counterpartiesService } from '../services/counterparties.service';
import type {
  CounterpartyInput,
  CounterpartyUpdateInput,
  PaymentProfileOverrides,
  LeaseContractInput,
  TenantFullProfile,
} from '../types';

export function useCounterparties(companyId: string) {
  return useQuery({
    queryKey: ['counterparties', companyId],
    queryFn: () => counterpartiesService.list(companyId),
    enabled: !!companyId,
  });
}

export function useCounterparty(id: string) {
  return useQuery({
    queryKey: ['counterparties', 'detail', id],
    queryFn: () => counterpartiesService.getById(id),
    enabled: !!id,
  });
}

export function useCreateCounterparty(companyId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CounterpartyInput) =>
      counterpartiesService.create(companyId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['counterparties', companyId] });
    },
  });
}

export function useUpdateCounterparty(_companyId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CounterpartyUpdateInput }) =>
      counterpartiesService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['counterparties'] });
    },
  });
}

export function useDeleteCounterparty(companyId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => counterpartiesService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['counterparties', companyId] });
    },
  });
}

// --- Payment Profile ---

export function usePaymentProfile(counterpartyId: string, counterpartyName?: string) {
  return useQuery({
    queryKey: ['payment-profile', counterpartyId],
    queryFn: () => counterpartiesService.getPaymentProfile(counterpartyId, counterpartyName),
    enabled: !!counterpartyId,
  });
}

export function useUpdatePaymentProfile(counterpartyId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (overrides: PaymentProfileOverrides) =>
      counterpartiesService.updatePaymentProfile(counterpartyId, overrides),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-profile', counterpartyId] });
    },
  });
}

// --- Lease Contracts ---

export function useLeaseContracts(counterpartyId: string) {
  return useQuery({
    queryKey: ['lease-contracts', counterpartyId],
    queryFn: () => counterpartiesService.getLeaseContracts(counterpartyId),
    enabled: !!counterpartyId,
  });
}

export function useCreateLeaseContract() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: LeaseContractInput) =>
      counterpartiesService.createLeaseContract(data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['lease-contracts', variables.counterparty_id] });
    },
  });
}

// --- Indexation ---

export function useIndexationHistory(leaseId: string) {
  return useQuery({
    queryKey: ['indexation-history', leaseId],
    queryFn: () => counterpartiesService.getIndexationHistory(leaseId),
    enabled: !!leaseId,
  });
}

export function useApplyIndexation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (leaseId: string) => counterpartiesService.applyIndexation(leaseId),
    onSuccess: (_data, leaseId) => {
      queryClient.invalidateQueries({ queryKey: ['indexation-history', leaseId] });
      queryClient.invalidateQueries({ queryKey: ['lease-contracts'] });
    },
  });
}

// --- Cold-Start Profile ---

export function useColdStartProfile(counterpartyId: string, counterpartyName?: string) {
  return useQuery({
    queryKey: ['cold-start-profile', counterpartyId],
    queryFn: () => counterpartiesService.getColdStartProfile(counterpartyId, counterpartyName),
    enabled: !!counterpartyId,
  });
}

// --- Flow Certainty ---

export function useFlowCertaintyClasses() {
  return useQuery({
    queryKey: ['flow-certainty-classes'],
    queryFn: () => counterpartiesService.getFlowCertaintyClasses(),
  });
}

export function useCounterpartyCertainties(companyId: string) {
  return useQuery({
    queryKey: ['counterparty-certainties', companyId],
    queryFn: () => counterpartiesService.getCounterpartyCertainties(companyId),
    enabled: !!companyId,
  });
}

export function useUpdateCounterpartyCertainty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ counterpartyId, certaintyClass, forecastPct }: {
      counterpartyId: string;
      certaintyClass: string;
      forecastPct: number;
    }) => counterpartiesService.updateCounterpartyCertainty(counterpartyId, certaintyClass, forecastPct),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['counterparty-certainties'] });
    },
  });
}

// --- Tenant Full Profile (10 tabs) ---

export function useTenantFullProfile(counterpartyId: string, counterpartyName?: string) {
  return useQuery({
    queryKey: ['tenant-full-profile', counterpartyId],
    queryFn: () => counterpartiesService.getTenantFullProfile(counterpartyId, counterpartyName),
    enabled: !!counterpartyId,
  });
}

export function useSaveTenantFullProfile(counterpartyId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (profile: Partial<TenantFullProfile>) =>
      counterpartiesService.saveTenantFullProfile(counterpartyId, profile),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-full-profile', counterpartyId] });
    },
  });
}
