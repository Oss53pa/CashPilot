import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react';

import { PageHeader } from '@/components/shared/page-header';
import { DataTable } from '@/components/shared/data-table';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { CurrencyDisplay } from '@/components/shared/currency-display';

import { useCompanyStore } from '@/stores/company.store';
import {
  useCashRegisters,
  useCreateCashRegister,
  useUpdateCashRegister,
  useDeleteCashRegister,
  useCashCounts,
  useCreateCashCount,
  useWithdrawalRequests,
  useCreateWithdrawalRequest,
  useApproveWithdrawalRequest,
} from '../hooks/use-cash-registers';
import { getCashRegisterColumns } from '../components/cash-register-columns';
import { CashRegisterForm } from '../components/cash-register-form';
import { CashCountPanel } from '../components/cash-count';
import { WithdrawalValidationPanel } from '../components/withdrawal-validation';
import type { BankAccount } from '@/types/database';
import type { CashRegisterFormData } from '../types';

export default function CashRegistersPage() {
  const { t } = useTranslation();
  const currentCompany = useCompanyStore((s) => s.currentCompany);
  const companyId = currentCompany?.id;

  const [activeTab, setActiveTab] = useState<'cash' | 'mobile_money'>('cash');

  const { data: cashRegisters = [], isLoading: cashLoading } = useCashRegisters(companyId, 'cash');
  const { data: mobileMoneyAccounts = [], isLoading: mobileLoading } = useCashRegisters(companyId, 'mobile_money');
  const { data: cashCounts = [], isLoading: countsLoading } = useCashCounts(companyId);
  const { data: withdrawalRequests = [], isLoading: withdrawalsLoading } = useWithdrawalRequests(companyId);

  const createCashCount = useCreateCashCount();
  const createWithdrawalRequest = useCreateWithdrawalRequest();
  const approveWithdrawal = useApproveWithdrawalRequest();

  const createMutation = useCreateCashRegister();
  const updateMutation = useUpdateCashRegister();
  const deleteMutation = useDeleteCashRegister();

  const [formOpen, setFormOpen] = useState(false);
  const [editingRegister, setEditingRegister] = useState<BankAccount | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BankAccount | null>(null);

  const columns = useMemo(
    () =>
      getCashRegisterColumns({
        onEdit: (register) => {
          setEditingRegister(register);
          setFormOpen(true);
        },
        onDelete: (register) => {
          setDeleteTarget(register);
        },
      }),
    [],
  );

  const handleFormSubmit = async (data: CashRegisterFormData) => {
    if (editingRegister) {
      await updateMutation.mutateAsync({ id: editingRegister.id, data });
    } else if (companyId) {
      await createMutation.mutateAsync({ companyId, data });
    }
    setFormOpen(false);
    setEditingRegister(null);
  };

  const handleDelete = async () => {
    if (deleteTarget) {
      await deleteMutation.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  const handleAddClick = () => {
    setEditingRegister(null);
    setFormOpen(true);
  };

  const cashTotal = cashRegisters.reduce((sum, r) => sum + r.current_balance, 0);
  const mobileTotal = mobileMoneyAccounts.reduce((sum, r) => sum + r.current_balance, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('cashRegisters.title', 'Cash Registers & Mobile Money')}
        description={t('cashRegisters.description', 'Manage your cash registers and mobile money accounts')}
      >
        <Button onClick={handleAddClick}>
          <Plus className="mr-2 h-4 w-4" />
          {t('cashRegisters.add', 'Add Register')}
        </Button>
      </PageHeader>

      {/* Daily Closing Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('cashRegisters.totalCash', 'Total Cash')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <CurrencyDisplay amount={cashTotal} currency="XOF" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {cashRegisters.length} {t('cashRegisters.registers', 'register(s)')}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('cashRegisters.totalMobile', 'Total Mobile Money')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <CurrencyDisplay amount={mobileTotal} currency="XOF" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {mobileMoneyAccounts.length} {t('cashRegisters.accounts', 'account(s)')}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('cashRegisters.grandTotal', 'Grand Total')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <CurrencyDisplay amount={cashTotal + mobileTotal} currency="XOF" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'cash' | 'mobile_money')}>
        <TabsList>
          <TabsTrigger value="cash">
            {t('cashRegisters.cashTab', 'Caisse')} ({cashRegisters.length})
          </TabsTrigger>
          <TabsTrigger value="mobile_money">
            {t('cashRegisters.mobileTab', 'Mobile Money')} ({mobileMoneyAccounts.length})
          </TabsTrigger>
          <TabsTrigger value="cash_count">
            Comptage
          </TabsTrigger>
          <TabsTrigger value="withdrawals">
            Retraits
          </TabsTrigger>
        </TabsList>

        <TabsContent value="cash">
          {cashLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={cashRegisters}
              searchKey="bank_name"
              searchPlaceholder={t('cashRegisters.searchPlaceholder', 'Search registers...')}
            />
          )}
        </TabsContent>

        <TabsContent value="mobile_money">
          {mobileLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={mobileMoneyAccounts}
              searchKey="bank_name"
              searchPlaceholder={t('cashRegisters.searchPlaceholder', 'Search accounts...')}
            />
          )}
        </TabsContent>

        <TabsContent value="cash_count">
          <CashCountPanel
            counts={cashCounts}
            isLoading={countsLoading}
            onSubmitCount={(data) => {
              if (companyId) {
                createCashCount.mutate({
                  companyId,
                  data: { ...data, count_date: new Date().toISOString().split('T')[0], validated_by: null },
                });
              }
            }}
          />
        </TabsContent>

        <TabsContent value="withdrawals">
          <WithdrawalValidationPanel
            requests={withdrawalRequests}
            isLoading={withdrawalsLoading}
            onSubmitRequest={(data) => {
              if (companyId) {
                createWithdrawalRequest.mutate({ companyId, data });
              }
            }}
            onApprove={(id) => approveWithdrawal.mutate({ id, approvedBy: 'Utilisateur courant', approved: true })}
            onReject={(id) => approveWithdrawal.mutate({ id, approvedBy: 'Utilisateur courant', approved: false })}
          />
        </TabsContent>
      </Tabs>

      {/* Form Dialog */}
      <CashRegisterForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingRegister(null);
        }}
        onSubmit={handleFormSubmit}
        defaultValues={editingRegister}
        defaultType={activeTab}
        loading={createMutation.isPending || updateMutation.isPending}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title={t('cashRegisters.deleteTitle', 'Delete Register')}
        description={t(
          'cashRegisters.deleteDescription',
          `Are you sure you want to delete "${deleteTarget?.bank_name}"? This action cannot be undone.`,
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
