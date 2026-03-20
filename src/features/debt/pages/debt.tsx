import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react';

import { PageHeader } from '@/components/shared/page-header';
import { DataTable } from '@/components/shared/data-table';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { CurrencyDisplay } from '@/components/shared/currency-display';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

import { useCompanyStore } from '@/stores/company.store';
import {
  useDebtContracts,
  useCreateDebtContract,
  useUpdateDebtContract,
  useDeleteDebtContract,
  useDebtSummary,
} from '../hooks/use-debt';
import { getDebtColumns } from '../components/debt-columns';
import { DebtForm } from '../components/debt-form';
import { RepaymentSchedule } from '../components/repayment-schedule';
import type { DebtContract, DebtContractFormData } from '../types';

export default function DebtPage() {
  const { t } = useTranslation();
  const currentCompany = useCompanyStore((s) => s.currentCompany);
  const companyId = currentCompany?.id;

  const { data: contracts = [], isLoading } = useDebtContracts(companyId);
  const { data: debtSummary, isLoading: summaryLoading } = useDebtSummary(companyId);

  const createMutation = useCreateDebtContract();
  const updateMutation = useUpdateDebtContract();
  const deleteMutation = useDeleteDebtContract();

  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<DebtContract | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DebtContract | null>(null);
  const [expandedContract, setExpandedContract] = useState<DebtContract | null>(null);

  const columns = useMemo(
    () =>
      getDebtColumns({
        onEdit: (item) => {
          setEditingItem(item);
          setFormOpen(true);
        },
        onDelete: (item) => {
          setDeleteTarget(item);
        },
        onExpand: (item) => {
          setExpandedContract((prev) => (prev?.id === item.id ? null : item));
        },
      }),
    [],
  );

  const handleFormSubmit = async (data: DebtContractFormData) => {
    if (editingItem) {
      await updateMutation.mutateAsync({ id: editingItem.id, data });
    } else if (companyId) {
      await createMutation.mutateAsync({ companyId, data });
    }
    setFormOpen(false);
    setEditingItem(null);
  };

  const handleDelete = async () => {
    if (deleteTarget) {
      await deleteMutation.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  const handleAddClick = () => {
    setEditingItem(null);
    setFormOpen(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('debt.title', 'Debt Management')}
        description={t('debt.description', 'Track and manage your debt contracts and repayments')}
      >
        <Button onClick={handleAddClick}>
          <Plus className="mr-2 h-4 w-4" />
          {t('debt.addContract', 'Add Contract')}
        </Button>
      </PageHeader>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {summaryLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-20" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-32" />
              </CardContent>
            </Card>
          ))
        ) : debtSummary ? (
          <>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {t('debt.totalDebt', 'Total Debt')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  <CurrencyDisplay amount={debtSummary.total_debt} currency="XOF" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {t('debt.totalOutstanding', 'Total Outstanding')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  <CurrencyDisplay amount={debtSummary.total_outstanding} currency="XOF" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {t('debt.weightedAvgRate', 'Weighted Avg Rate')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{debtSummary.weighted_avg_rate}%</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {t('debt.nextPaymentDue', 'Next Payment Due')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {debtSummary.next_payment_due
                    ? new Date(debtSummary.next_payment_due).toLocaleDateString()
                    : '-'}
                </div>
              </CardContent>
            </Card>
          </>
        ) : null}
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={contracts}
          searchKey="lender"
          searchPlaceholder={t('debt.searchPlaceholder', 'Search contracts...')}
        />
      )}

      {/* Expanded Repayment Schedule */}
      {expandedContract && (
        <RepaymentSchedule
          contractId={expandedContract.id}
          currency={expandedContract.currency}
        />
      )}

      {/* Form Dialog */}
      <DebtForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingItem(null);
        }}
        onSubmit={handleFormSubmit}
        defaultValues={editingItem}
        loading={createMutation.isPending || updateMutation.isPending}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title={t('debt.deleteTitle', 'Delete Contract')}
        description={t(
          'debt.deleteDescription',
          `Are you sure you want to delete the contract "${deleteTarget?.contract_reference}" from "${deleteTarget?.lender}"? This action cannot be undone.`,
        )}
        confirmLabel={t('common.delete', 'Delete')}
        cancelLabel={t('common.cancel', 'Cancel')}
        variant="destructive"
        onConfirm={handleDelete}
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
