import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fiscalService } from '../services/fiscal.service';
import type { TaxObligationFormData, SecurityDepositFormData, PartialPayment } from '../types';

// Tax Obligations hooks
export function useTaxObligations(companyId: string | undefined) {
  return useQuery({
    queryKey: ['tax-obligations', companyId],
    queryFn: () => fiscalService.listTaxObligations(companyId!),
    enabled: !!companyId,
  });
}

export function useTaxObligation(id: string | undefined) {
  return useQuery({
    queryKey: ['tax-obligations', id],
    queryFn: () => fiscalService.getTaxObligation(id!),
    enabled: !!id,
  });
}

export function useCreateTaxObligation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ companyId, data }: { companyId: string; data: TaxObligationFormData }) =>
      fiscalService.createTaxObligation(companyId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tax-obligations'] });
    },
  });
}

export function useUpdateTaxObligation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TaxObligationFormData> }) =>
      fiscalService.updateTaxObligation(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tax-obligations'] });
    },
  });
}

export function useDeleteTaxObligation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => fiscalService.deleteTaxObligation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tax-obligations'] });
    },
  });
}

// Security Deposits hooks
export function useSecurityDeposits(companyId: string | undefined) {
  return useQuery({
    queryKey: ['security-deposits', companyId],
    queryFn: () => fiscalService.listSecurityDeposits(companyId!),
    enabled: !!companyId,
  });
}

export function useSecurityDeposit(id: string | undefined) {
  return useQuery({
    queryKey: ['security-deposits', id],
    queryFn: () => fiscalService.getSecurityDeposit(id!),
    enabled: !!id,
  });
}

export function useCreateSecurityDeposit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ companyId, data }: { companyId: string; data: SecurityDepositFormData }) =>
      fiscalService.createSecurityDeposit(companyId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['security-deposits'] });
    },
  });
}

export function useUpdateSecurityDeposit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<SecurityDepositFormData> }) =>
      fiscalService.updateSecurityDeposit(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['security-deposits'] });
    },
  });
}

export function useDeleteSecurityDeposit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => fiscalService.deleteSecurityDeposit(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['security-deposits'] });
    },
  });
}

// VAT Flows
export function useVATFlows(companyId: string | undefined) {
  return useQuery({
    queryKey: ['vat-flows', companyId],
    queryFn: () => fiscalService.getVATFlows(companyId!),
    enabled: !!companyId,
  });
}

// Charge Regularization
export function useChargeRegularization(companyId: string | undefined) {
  return useQuery({
    queryKey: ['charge-regularization', companyId],
    queryFn: () => fiscalService.getChargeRegularization(companyId!),
    enabled: !!companyId,
  });
}

// Partial Payment
export function useAddPartialPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ companyId, data }: { companyId: string; data: Omit<PartialPayment, 'id'> }) =>
      fiscalService.addPartialPayment(companyId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tax-obligations'] });
    },
  });
}
