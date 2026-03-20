import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bankAccountsService } from '../services/bank-accounts.service';
import type { BankAccountFormData, ImportFormat, AlertRule } from '../types';

export function useBankAccounts(companyId: string | undefined) {
  return useQuery({
    queryKey: ['bank-accounts', companyId],
    queryFn: () => bankAccountsService.list(companyId!),
    enabled: !!companyId,
  });
}

export function useBankAccount(id: string | undefined) {
  return useQuery({
    queryKey: ['bank-accounts', id],
    queryFn: () => bankAccountsService.getById(id!),
    enabled: !!id,
  });
}

export function useCreateBankAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ companyId, data }: { companyId: string; data: BankAccountFormData }) =>
      bankAccountsService.create(companyId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-accounts'] });
    },
  });
}

export function useUpdateBankAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<BankAccountFormData> }) =>
      bankAccountsService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-accounts'] });
    },
  });
}

export function useDeleteBankAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => bankAccountsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-accounts'] });
    },
  });
}

export function useBankAccountBalances(companyId: string | undefined) {
  return useQuery({
    queryKey: ['bank-accounts', 'balances', companyId],
    queryFn: () => bankAccountsService.getBalanceSummary(companyId!),
    enabled: !!companyId,
  });
}

// --- Statement Import hooks ---

export function useBankStatements(accountId: string | undefined) {
  return useQuery({
    queryKey: ['bank-statements', accountId],
    queryFn: () => bankAccountsService.getStatements(accountId!),
    enabled: !!accountId,
  });
}

export function useBankTransactions(statementId: string | undefined) {
  return useQuery({
    queryKey: ['bank-transactions', statementId],
    queryFn: () => bankAccountsService.getTransactions(statementId!),
    enabled: !!statementId,
  });
}

export function useImportStatement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      accountId,
      file,
      format,
    }: {
      accountId: string;
      file: File;
      format: ImportFormat;
    }) => bankAccountsService.importStatement(accountId, file, format),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-statements'] });
    },
  });
}

export function useMatchTransactions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (statementId: string) => bankAccountsService.matchTransactions(statementId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-transactions'] });
    },
  });
}

export function useConfirmMatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ transactionId, flowId }: { transactionId: string; flowId: string }) =>
      bankAccountsService.confirmMatch(transactionId, flowId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-transactions'] });
    },
  });
}

// --- Alert hooks ---

export function useAlertRules(accountId: string | undefined) {
  return useQuery({
    queryKey: ['bank-alerts', accountId],
    queryFn: () => bankAccountsService.getAlertRules(accountId!),
    enabled: !!accountId,
  });
}

export function useCreateAlertRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Omit<AlertRule, 'id'>) => bankAccountsService.createAlertRule(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-alerts'] });
    },
  });
}

export function useUpdateAlertRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AlertRule> }) =>
      bankAccountsService.updateAlertRule(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-alerts'] });
    },
  });
}

export function useDeleteAlertRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => bankAccountsService.deleteAlertRule(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-alerts'] });
    },
  });
}

export function useActiveAlerts(companyId: string | undefined) {
  return useQuery({
    queryKey: ['bank-alerts', 'active', companyId],
    queryFn: () => bankAccountsService.getActiveAlerts(companyId!),
    enabled: !!companyId,
  });
}
