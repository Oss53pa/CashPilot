import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reconciliationService } from '../services/reconciliation.service';
import type { ReconciliationItemStatus } from '../types';

export function useReconciliationSessions(companyId: string | undefined) {
  return useQuery({
    queryKey: ['reconciliation-sessions', companyId],
    queryFn: () => reconciliationService.getSessions(companyId!),
    enabled: !!companyId,
  });
}

export function useReconciliationSession(sessionId: string | undefined) {
  return useQuery({
    queryKey: ['reconciliation-session', sessionId],
    queryFn: () => reconciliationService.getSession(sessionId!),
    enabled: !!sessionId,
  });
}

export function useCreateSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (accountId: string) => reconciliationService.createSession(accountId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reconciliation-sessions'] });
    },
  });
}

export function useJoinSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sessionId: string) => reconciliationService.joinSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reconciliation-session'] });
    },
  });
}

export function useLeaveSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sessionId: string) => reconciliationService.leaveSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reconciliation-session'] });
    },
  });
}

export function useSessionItems(sessionId: string | undefined, filter?: ReconciliationItemStatus | 'all') {
  return useQuery({
    queryKey: ['reconciliation-items', sessionId, filter],
    queryFn: () => reconciliationService.getSessionItems(sessionId!, filter),
    enabled: !!sessionId,
  });
}

export function useLockItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (itemId: string) => reconciliationService.lockItem(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reconciliation-items'] });
    },
  });
}

export function useUnlockItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (itemId: string) => reconciliationService.unlockItem(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reconciliation-items'] });
    },
  });
}

export function useProposeMatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      itemId,
      data,
    }: {
      itemId: string;
      data: { flow_id: string; flow_label: string; match_type: string; confidence: number; notes?: string };
    }) => reconciliationService.proposeMatch(itemId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reconciliation-items'] });
    },
  });
}

export function useValidateProposal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (itemId: string) => reconciliationService.validateProposal(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reconciliation-items'] });
    },
  });
}

export function useRejectProposal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ itemId, reason }: { itemId: string; reason: string }) =>
      reconciliationService.rejectProposal(itemId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reconciliation-items'] });
    },
  });
}

export function useResolveItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ itemId, action, notes }: { itemId: string; action: string; notes?: string }) =>
      reconciliationService.resolveItem(itemId, action, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reconciliation-items'] });
    },
  });
}

export function useSkipItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ itemId, reason }: { itemId: string; reason?: string }) =>
      reconciliationService.skipItem(itemId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reconciliation-items'] });
    },
  });
}

export function useAddComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ itemId, content }: { itemId: string; content: string }) =>
      reconciliationService.addComment(itemId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reconciliation-items'] });
    },
  });
}

export function useSessionMetrics(sessionId: string | undefined) {
  return useQuery({
    queryKey: ['reconciliation-metrics', sessionId],
    queryFn: () => reconciliationService.getSessionMetrics(sessionId!),
    enabled: !!sessionId,
  });
}

export function useCompleteSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sessionId: string) => reconciliationService.completeSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reconciliation-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['reconciliation-session'] });
    },
  });
}

export function useChatMessages(sessionId: string | undefined) {
  return useQuery({
    queryKey: ['reconciliation-chat', sessionId],
    queryFn: () => reconciliationService.getChatMessages(sessionId!),
    enabled: !!sessionId,
  });
}

export function useSendChatMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sessionId, content }: { sessionId: string; content: string }) =>
      reconciliationService.sendChatMessage(sessionId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reconciliation-chat'] });
    },
  });
}
