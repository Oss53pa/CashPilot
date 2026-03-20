import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { investmentsService } from '../services/investments.service';
import type { InvestmentFormData } from '../types';

export function useInvestments(companyId: string | undefined) {
  return useQuery({
    queryKey: ['investments', companyId],
    queryFn: () => investmentsService.list(companyId!),
    enabled: !!companyId,
  });
}

export function useInvestment(id: string | undefined) {
  return useQuery({
    queryKey: ['investments', id],
    queryFn: () => investmentsService.getById(id!),
    enabled: !!id,
  });
}

export function useCreateInvestment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ companyId, data }: { companyId: string; data: InvestmentFormData }) =>
      investmentsService.create(companyId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investments'] });
    },
  });
}

export function useUpdateInvestment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<InvestmentFormData> }) =>
      investmentsService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investments'] });
    },
  });
}

export function useDeleteInvestment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => investmentsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investments'] });
    },
  });
}

export function usePortfolioSummary(companyId: string | undefined) {
  return useQuery({
    queryKey: ['investments', 'portfolio-summary', companyId],
    queryFn: () => investmentsService.getPortfolioSummary(companyId!),
    enabled: !!companyId,
  });
}
