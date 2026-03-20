import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { capexService } from '../services/capex.service';
import type { CapexOperationFormData, PaymentStatus } from '../types';

export function useCapexOperations(companyId: string | undefined) {
  return useQuery({
    queryKey: ['capex', companyId],
    queryFn: () => capexService.list(companyId!),
    enabled: !!companyId,
  });
}

export function useCapexOperation(id: string | undefined) {
  return useQuery({
    queryKey: ['capex', id],
    queryFn: () => capexService.getById(id!),
    enabled: !!id,
  });
}

export function useCapexDashboard(companyId: string | undefined) {
  return useQuery({
    queryKey: ['capex', 'dashboard', companyId],
    queryFn: () => capexService.getDashboard(companyId!),
    enabled: !!companyId,
  });
}

export function useCreateCapex() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      companyId,
      userId,
      data,
    }: {
      companyId: string;
      userId: string;
      data: CapexOperationFormData;
    }) => capexService.create(companyId, userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['capex'] });
    },
  });
}

export function useUpdateCapex() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CapexOperationFormData> }) =>
      capexService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['capex'] });
    },
  });
}

export function useDeleteCapex() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => capexService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['capex'] });
    },
  });
}

// --- Payment Schedule hooks ---

export function useCapexPaymentSchedule(capexId: string | undefined) {
  return useQuery({
    queryKey: ['capex', 'schedule', capexId],
    queryFn: () => capexService.getPaymentSchedule(capexId!),
    enabled: !!capexId,
  });
}

export function useUpdatePaymentStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ scheduleId, status }: { scheduleId: string; status: PaymentStatus }) =>
      capexService.updatePaymentStatus(scheduleId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['capex'] });
    },
  });
}

// --- Slippage hooks ---

export function useSlippageAlerts(companyId: string | undefined) {
  return useQuery({
    queryKey: ['capex', 'slippage', companyId],
    queryFn: () => capexService.getSlippageAlerts(companyId!),
    enabled: !!companyId,
  });
}

// --- Detail hook ---

export function useCapexDetail(capexId: string | undefined) {
  return useQuery({
    queryKey: ['capex', 'detail', capexId],
    queryFn: () => capexService.getCapexDetail(capexId!),
    enabled: !!capexId,
  });
}
