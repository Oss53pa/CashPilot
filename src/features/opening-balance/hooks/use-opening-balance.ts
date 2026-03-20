import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { openingBalanceService } from '../services/opening-balance.service';
import type { OpeningBalanceEntry } from '../types';

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
