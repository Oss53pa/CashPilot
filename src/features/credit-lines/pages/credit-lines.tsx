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
  useCreditLines,
  useCreateCreditLine,
  useUpdateCreditLine,
  useDeleteCreditLine,
} from '../hooks/use-credit-lines';
import { getCreditLineColumns } from '../components/credit-line-columns';
import { CreditLineForm } from '../components/credit-line-form';
import type { CreditLine, CreditLineFormData } from '../types';

export default function CreditLinesPage() {
  const { t } = useTranslation();
  const currentCompany = useCompanyStore((s) => s.currentCompany);
  const companyId = currentCompany?.id;

  const { data: creditLines = [], isLoading } = useCreditLines(companyId);

  const createMutation = useCreateCreditLine();
  const updateMutation = useUpdateCreditLine();
  const deleteMutation = useDeleteCreditLine();

  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CreditLine | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CreditLine | null>(null);

  const columns = useMemo(
    () =>
      getCreditLineColumns({
        onEdit: (item) => {
          setEditingItem(item);
          setFormOpen(true);
        },
        onDelete: (item) => {
          setDeleteTarget(item);
        },
      }),
    [],
  );

  const handleFormSubmit = async (data: CreditLineFormData) => {
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

  // Summary calculations
  const totalLimits = creditLines.reduce((sum, cl) => sum + cl.limit_amount, 0);
  const totalUsed = creditLines.reduce((sum, cl) => sum + cl.used_amount, 0);
  const avgUtilization = totalLimits > 0 ? Math.round((totalUsed / totalLimits) * 100) : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('creditLines.title', 'Credit Lines')}
        description={t('creditLines.description', 'Manage your credit facilities and utilization')}
      >
        <Button onClick={handleAddClick}>
          <Plus className="mr-2 h-4 w-4" />
          {t('creditLines.addCreditLine', 'Add Credit Line')}
        </Button>
      </PageHeader>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-20" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-32" />
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {t('creditLines.totalLimits', 'Total Limits')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  <CurrencyDisplay amount={totalLimits} currency="XOF" />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {creditLines.length} {t('creditLines.facilities', 'facility(ies)')}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {t('creditLines.totalUsed', 'Total Used')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  <CurrencyDisplay amount={totalUsed} currency="XOF" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {t('creditLines.avgUtilization', 'Average Utilization')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{avgUtilization}%</div>
              </CardContent>
            </Card>
          </>
        )}
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
          data={creditLines}
          searchKey="bank_name"
          searchPlaceholder={t('creditLines.searchPlaceholder', 'Search credit lines...')}
        />
      )}

      {/* Form Dialog */}
      <CreditLineForm
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
        title={t('creditLines.deleteTitle', 'Delete Credit Line')}
        description={t(
          'creditLines.deleteDescription',
          `Are you sure you want to delete the credit line from "${deleteTarget?.bank_name}"? This action cannot be undone.`,
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
