import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentWorkflowsService } from '../services/payment-workflows.service';
import type { PaymentRequestFormData, DOARuleFormData, ApproverRole } from '../types';

// ---- Payment Requests ----

export function usePaymentRequests(companyId: string | undefined) {
  return useQuery({
    queryKey: ['payment-requests', companyId],
    queryFn: () => paymentWorkflowsService.listRequests(companyId!),
    enabled: !!companyId,
  });
}

export function usePaymentRequestsWithChain(companyId: string | undefined) {
  return useQuery({
    queryKey: ['payment-requests-chain', companyId],
    queryFn: () => paymentWorkflowsService.listRequestsWithChain(companyId!),
    enabled: !!companyId,
  });
}

export function useMyPaymentRequests(companyId: string | undefined, userId: string | undefined) {
  return useQuery({
    queryKey: ['payment-requests', 'mine', companyId, userId],
    queryFn: () => paymentWorkflowsService.listMyRequests(companyId!, userId!),
    enabled: !!companyId && !!userId,
  });
}

export function usePaymentRequest(id: string | undefined) {
  return useQuery({
    queryKey: ['payment-requests', id],
    queryFn: () => paymentWorkflowsService.getById(id!),
    enabled: !!id,
  });
}

export function usePendingApprovals(userId: string | undefined, role?: ApproverRole) {
  return useQuery({
    queryKey: ['payment-requests', 'pending', userId, role],
    queryFn: () => paymentWorkflowsService.getMyPendingApprovals(userId!, role),
    enabled: !!userId,
  });
}

export function useCreatePaymentRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      companyId,
      userId,
      data,
    }: {
      companyId: string;
      userId: string;
      data: PaymentRequestFormData;
    }) => paymentWorkflowsService.create(companyId, userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-requests'] });
    },
  });
}

export function useUpdatePaymentRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<PaymentRequestFormData> }) =>
      paymentWorkflowsService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-requests'] });
    },
  });
}

export function useDeletePaymentRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => paymentWorkflowsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-requests'] });
    },
  });
}

export function useSubmitForApproval() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => paymentWorkflowsService.submitForApproval(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-requests'] });
    },
  });
}

export function useApprovePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      approverId,
      comments,
    }: {
      id: string;
      approverId: string;
      comments: string | null;
    }) => paymentWorkflowsService.approve(id, approverId, comments),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-requests'] });
    },
  });
}

export function useRejectPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      approverId,
      comments,
    }: {
      id: string;
      approverId: string;
      comments: string | null;
    }) => paymentWorkflowsService.reject(id, approverId, comments),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-requests'] });
    },
  });
}

// ---- DOA Rules ----

export function useDOARules(companyId: string | undefined) {
  return useQuery({
    queryKey: ['doa-rules', companyId],
    queryFn: () => paymentWorkflowsService.getDOARules(companyId!),
    enabled: !!companyId,
  });
}

export function useCreateDOARule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: DOARuleFormData & { company_id: string; tenant_id: string }) =>
      paymentWorkflowsService.createDOARule(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doa-rules'] });
    },
  });
}

export function useUpdateDOARule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<DOARuleFormData> }) =>
      paymentWorkflowsService.updateDOARule(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doa-rules'] });
    },
  });
}

export function useDeleteDOARule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => paymentWorkflowsService.deleteDOARule(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doa-rules'] });
    },
  });
}

// ---- Approval Chain ----

export function useApprovalChain(paymentRequestId: string | undefined) {
  return useQuery({
    queryKey: ['approval-chain', paymentRequestId],
    queryFn: () => paymentWorkflowsService.getApprovalChain(paymentRequestId!),
    enabled: !!paymentRequestId,
  });
}

// ---- Overdue Approvals ----

export function useOverdueApprovals(companyId: string | undefined) {
  return useQuery({
    queryKey: ['overdue-approvals', companyId],
    queryFn: () => paymentWorkflowsService.getOverdueApprovals(companyId!),
    enabled: !!companyId,
  });
}

// ---- Escalation ----

export function useEscalatePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (paymentRequestId: string) =>
      paymentWorkflowsService.escalatePayment(paymentRequestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-requests'] });
      queryClient.invalidateQueries({ queryKey: ['overdue-approvals'] });
    },
  });
}

// ---- Dashboard Stats ----

export function useDashboardStats(companyId: string | undefined) {
  return useQuery({
    queryKey: ['dashboard-stats', companyId],
    queryFn: () => paymentWorkflowsService.getDashboardStats(companyId!),
    enabled: !!companyId,
  });
}
