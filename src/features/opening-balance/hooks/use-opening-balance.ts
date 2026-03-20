import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { openingBalanceService } from '../services/opening-balance.service';
import type { OpeningBalanceEntry, FullOpeningBalanceData } from '../types';

export function useOpeningBalances(companyId: string, fiscalYear?: number) {
  return useQuery({
    queryKey: ['opening-balances', companyId, fiscalYear],
    queryFn: () => openingBalanceService.getOpeningBalances(companyId, fiscalYear),
    enabled: !!companyId,
  });
}

export function useBankAccountsForBalance(companyId: string) {
  return useQuery({
    queryKey: ['bank-accounts', companyId],
    queryFn: () => openingBalanceService.getBankAccounts(companyId),
    enabled: !!companyId,
  });
}

export function useSaveOpeningBalances(companyId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      fiscalYear,
      entries,
    }: {
      fiscalYear: number;
      entries: OpeningBalanceEntry[];
    }) => openingBalanceService.setOpeningBalances(companyId, fiscalYear, entries),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opening-balances', companyId] });
    },
  });
}

export function useDefaultHeader(companyId: string) {
  return useQuery({
    queryKey: ['opening-balance-header', companyId],
    queryFn: () => openingBalanceService.getDefaultHeader(companyId),
    enabled: !!companyId,
  });
}

export function useBankOpeningBalances(companyId: string) {
  return useQuery({
    queryKey: ['bank-opening-balances', companyId],
    queryFn: () => openingBalanceService.getBankOpeningBalances(companyId),
    enabled: !!companyId,
  });
}

export function useTaxOpeningBalance(companyId: string) {
  return useQuery({
    queryKey: ['tax-opening-balance', companyId],
    queryFn: () => openingBalanceService.getTaxOpeningBalance(companyId),
    enabled: !!companyId,
  });
}

export function useOpeningInvestments(companyId: string) {
  return useQuery({
    queryKey: ['opening-investments', companyId],
    queryFn: () => openingBalanceService.getOpeningInvestments(companyId),
    enabled: !!companyId,
  });
}

export function useOpeningLoans(companyId: string) {
  return useQuery({
    queryKey: ['opening-loans', companyId],
    queryFn: () => openingBalanceService.getOpeningLoans(companyId),
    enabled: !!companyId,
  });
}

export function usePriorReceivables(companyId: string) {
  return useQuery({
    queryKey: ['prior-receivables', companyId],
    queryFn: () => openingBalanceService.getPriorReceivables(companyId),
    enabled: !!companyId,
  });
}

export function usePriorPayables(companyId: string) {
  return useQuery({
    queryKey: ['prior-payables', companyId],
    queryFn: () => openingBalanceService.getPriorPayables(companyId),
    enabled: !!companyId,
  });
}

export function useApprovalSteps(companyId: string) {
  return useQuery({
    queryKey: ['approval-steps', companyId],
    queryFn: () => openingBalanceService.getApprovalSteps(companyId),
    enabled: !!companyId,
  });
}

export function useSaveFullOpeningBalance(companyId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: FullOpeningBalanceData) =>
      openingBalanceService.saveFullOpeningBalance(companyId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opening-balances', companyId] });
      queryClient.invalidateQueries({ queryKey: ['bank-opening-balances', companyId] });
      queryClient.invalidateQueries({ queryKey: ['prior-receivables', companyId] });
      queryClient.invalidateQueries({ queryKey: ['prior-payables', companyId] });
    },
  });
}
