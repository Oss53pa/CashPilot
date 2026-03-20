import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { budgetService } from '../services/budget.service';
import type { BudgetCreateInput, BudgetUpdateInput, BudgetLineInput, BudgetImportData } from '../types';

export function useBudgets(companyId: string) {
  return useQuery({
    queryKey: ['budgets', companyId],
    queryFn: () => budgetService.listBudgets(companyId),
    enabled: !!companyId,
  });
}

export function useBudget(id: string) {
  return useQuery({
    queryKey: ['budgets', 'detail', id],
    queryFn: () => budgetService.getBudget(id),
    enabled: !!id,
  });
}

export function useBudgetLines(budgetId: string) {
  return useQuery({
    queryKey: ['budgets', 'lines', budgetId],
    queryFn: () => budgetService.getBudgetLines(budgetId),
    enabled: !!budgetId,
  });
}

export function useCreateBudget(companyId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: BudgetCreateInput) => budgetService.createBudget(companyId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets', companyId] });
    },
  });
}

export function useUpdateBudget(_companyId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: BudgetUpdateInput }) =>
      budgetService.updateBudget(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
    },
  });
}

export function useDeleteBudget(companyId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => budgetService.deleteBudget(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets', companyId] });
    },
  });
}

export function useUpsertBudgetLines(budgetId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (lines: BudgetLineInput[]) => budgetService.upsertBudgetLines(budgetId, lines),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets', 'lines', budgetId] });
      queryClient.invalidateQueries({ queryKey: ['budgets', 'detail', budgetId] });
    },
  });
}

export function useCompareBudgetVersions(id1: string, id2: string) {
  return useQuery({
    queryKey: ['budgets', 'compare', id1, id2],
    queryFn: () => budgetService.compareBudgetVersions(id1, id2),
    enabled: !!id1 && !!id2,
  });
}

export function useImportBudget(budgetId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (importData: BudgetImportData) =>
      budgetService.importBudget(budgetId, importData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets', 'lines', budgetId] });
      queryClient.invalidateQueries({ queryKey: ['budgets', 'detail', budgetId] });
    },
  });
}
