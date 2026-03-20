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
  useBankAccounts,
  useCreateBankAccount,
  useUpdateBankAccount,
  useDeleteBankAccount,
  useBankAccountBalances,
} from '../hooks/use-bank-accounts';
import { getBankAccountColumns } from '../components/bank-account-columns';
import { BankAccountForm } from '../components/bank-account-form';
import type { BankAccount } from '@/types/database';
import type { BankAccountFormData } from '../types';

export default function BankAccountsPage() {
  const { t } = useTranslation();
  const currentCompany = useCompanyStore((s) => s.currentCompany);
  const companyId = currentCompany?.id;

  const { data: accounts = [], isLoading } = useBankAccounts(companyId);
  const { data: balances = [], isLoading: balancesLoading } = useBankAccountBalances(companyId);

  const createMutation = useCreateBankAccount();
  const updateMutation = useUpdateBankAccount();
  const deleteMutation = useDeleteBankAccount();

  const [formOpen, setFormOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BankAccount | null>(null);

  const columns = useMemo(
    () =>
      getBankAccountColumns({
        onEdit: (account) => {
          setEditingAccount(account);
          setFormOpen(true);
        },
        onDelete: (account) => {
          setDeleteTarget(account);
        },
      }),
    [],
  );

  const handleFormSubmit = async (data: BankAccountFormData) => {
    if (editingAccount) {
      await updateMutation.mutateAsync({ id: editingAccount.id, data });
    } else if (companyId) {
      await createMutation.mutateAsync({ companyId, data });
    }
    setFormOpen(false);
    setEditingAccount(null);
  };

  const handleDelete = async () => {
    if (deleteTarget) {
      await deleteMutation.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  const handleAddClick = () => {
    setEditingAccount(null);
    setFormOpen(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('bankAccounts.title', 'Bank Accounts')}
        description={t('bankAccounts.description', 'Manage your bank accounts and balances')}
      >
        <Button onClick={handleAddClick}>
          <Plus className="mr-2 h-4 w-4" />
          {t('bankAccounts.addAccount', 'Add Account')}
        </Button>
      </PageHeader>

      {/* Balance Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {balancesLoading ? (
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
          balances.map((summary) => (
            <Card key={summary.currency}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {t('bankAccounts.totalBalance', 'Total Balance')} ({summary.currency})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  <CurrencyDisplay amount={summary.total_balance} currency={summary.currency} />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {summary.account_count} {t('bankAccounts.accounts', 'account(s)')}
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Accounts Table */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={accounts}
          searchKey="bank_name"
          searchPlaceholder={t('bankAccounts.searchPlaceholder', 'Search accounts...')}
        />
      )}

      {/* Form Dialog */}
      <BankAccountForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingAccount(null);
        }}
        onSubmit={handleFormSubmit}
        defaultValues={editingAccount}
        loading={createMutation.isPending || updateMutation.isPending}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title={t('bankAccounts.deleteTitle', 'Delete Account')}
        description={t(
          'bankAccounts.deleteDescription',
          `Are you sure you want to delete "${deleteTarget?.bank_name} - ${deleteTarget?.account_name}"? This action cannot be undone.`,
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
