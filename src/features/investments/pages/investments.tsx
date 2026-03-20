import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react';

import { PageHeader } from '@/components/shared/page-header';
import { DataTable } from '@/components/shared/data-table';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

import { useCompanyStore } from '@/stores/company.store';
import {
  useInvestments,
  useCreateInvestment,
  useUpdateInvestment,
  useDeleteInvestment,
  usePortfolioSummary,
} from '../hooks/use-investments';
import { getInvestmentColumns } from '../components/investment-columns';
import { InvestmentForm } from '../components/investment-form';
import { InvestmentDashboard } from '../components/investment-dashboard';
import type { Investment, InvestmentFormData } from '../types';

export default function InvestmentsPage() {
  const { t } = useTranslation();
  const currentCompany = useCompanyStore((s) => s.currentCompany);
  const companyId = currentCompany?.id;

  const { data: investments = [], isLoading } = useInvestments(companyId);
  const { data: portfolioSummary, isLoading: summaryLoading } = usePortfolioSummary(companyId);

  const createMutation = useCreateInvestment();
  const updateMutation = useUpdateInvestment();
  const deleteMutation = useDeleteInvestment();

  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Investment | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Investment | null>(null);

  const columns = useMemo(
    () =>
      getInvestmentColumns({
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

  const handleFormSubmit = async (data: InvestmentFormData) => {
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
        title={t('investments.title', 'Investments')}
        description={t('investments.description', 'Manage your investment portfolio')}
      >
        <Button onClick={handleAddClick}>
          <Plus className="mr-2 h-4 w-4" />
          {t('investments.addInvestment', 'Add Investment')}
        </Button>
      </PageHeader>

      {/* Dashboard Cards */}
      <InvestmentDashboard summary={portfolioSummary} isLoading={summaryLoading} />

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
          data={investments}
          searchKey="name"
          searchPlaceholder={t('investments.searchPlaceholder', 'Search investments...')}
        />
      )}

      {/* Form Dialog */}
      <InvestmentForm
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
        title={t('investments.deleteTitle', 'Delete Investment')}
        description={t(
          'investments.deleteDescription',
          `Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`,
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
