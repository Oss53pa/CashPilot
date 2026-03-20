import { useState, useMemo } from 'react';
import { Plus, ArrowRightLeft, Clock, CheckCircle, Send } from 'lucide-react';

import { PageHeader } from '@/components/shared/page-header';
import { DataTable } from '@/components/shared/data-table';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { CurrencyDisplay } from '@/components/shared/currency-display';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { useCompanyStore } from '@/stores/company.store';
import {
  useTransfers,
  useCreateTransfer,
  useUpdateTransfer,
  useValidateTransfer,
  useCompleteTransfer,
  useCancelTransfer,
  useTransitBalance,
  useTransferSummary,
} from '../hooks/use-transfers';
import { getTransferColumns } from '../components/transfer-columns';
import { TransferForm } from '../components/transfer-form';
import { TransitBalance } from '../components/transit-balance';
import type { Transfer, TransferFormData, TransferFilters } from '../types';

export default function TransfersPage() {
  const currentCompany = useCompanyStore((s) => s.currentCompany);
  const companyId = currentCompany?.id;

  const [activeTab, setActiveTab] = useState('all');
  const [filters, setFilters] = useState<TransferFilters>({});

  const effectiveFilters = useMemo<TransferFilters>(() => {
    const base = { ...filters };
    switch (activeTab) {
      case 'internal':
        base.transfer_type = 'internal';
        break;
      case 'intercompany':
        base.transfer_type = 'intercompany';
        break;
      case 'in_transit':
        base.status = 'in_transit';
        break;
      default:
        break;
    }
    return base;
  }, [activeTab, filters]);

  const { data: transfers = [], isLoading } = useTransfers(companyId, effectiveFilters);
  const { data: summary, isLoading: summaryLoading } = useTransferSummary(companyId);
  const { data: transitData, isLoading: transitLoading } = useTransitBalance(companyId);

  const createMutation = useCreateTransfer();
  const updateMutation = useUpdateTransfer();
  const validateMutation = useValidateTransfer();
  const completeMutation = useCompleteTransfer();
  const cancelMutation = useCancelTransfer();

  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Transfer | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Transfer | null>(null);

  const columns = useMemo(
    () =>
      getTransferColumns({
        onEdit: (item) => {
          setEditingItem(item);
          setFormOpen(true);
        },
        onValidate: (item) => {
          // TODO: get actual userId from auth store
          validateMutation.mutate({ id: item.id, userId: 'current-user' });
        },
        onComplete: (item) => {
          completeMutation.mutate(item.id);
        },
        onCancel: (item) => {
          setCancelTarget(item);
        },
      }),
    [validateMutation, completeMutation],
  );

  const handleFormSubmit = async (data: TransferFormData) => {
    if (editingItem) {
      await updateMutation.mutateAsync({ id: editingItem.id, data });
    } else if (companyId) {
      // TODO: get actual userId from auth store
      await createMutation.mutateAsync({ companyId, data, userId: 'current-user' });
    }
    setFormOpen(false);
    setEditingItem(null);
  };

  const handleCancel = async () => {
    if (cancelTarget) {
      await cancelMutation.mutateAsync(cancelTarget.id);
      setCancelTarget(null);
    }
  };

  const handleAddClick = () => {
    setEditingItem(null);
    setFormOpen(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Internal Transfers"
        description="Manage internal, intercompany, and cash transfers between accounts"
      >
        <Button onClick={handleAddClick}>
          <Plus className="mr-2 h-4 w-4" />
          New Transfer
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
        ) : summary ? (
          <>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <ArrowRightLeft className="h-4 w-4" />
                  Total Transfers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.total_transfers}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Send className="h-4 w-4" />
                  In Transit
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.in_transit_count}</div>
                <p className="text-xs text-muted-foreground">
                  <CurrencyDisplay amount={summary.in_transit_amount} currency="XOF" />
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  Pending Validation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.pending_validation_count}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <CheckCircle className="h-4 w-4" />
                  Completed Today
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.completed_today}</div>
              </CardContent>
            </Card>
          </>
        ) : null}
      </div>

      {/* Transit Balance */}
      <TransitBalance transitData={transitData} isLoading={transitLoading} />

      {/* Tabs & Table */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="internal">Internal</TabsTrigger>
          <TabsTrigger value="intercompany">Intercompany</TabsTrigger>
          <TabsTrigger value="in_transit">In Transit</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={transfers}
              searchKey="reference"
              searchPlaceholder="Search transfers..."
            />
          )}
        </TabsContent>
      </Tabs>

      {/* Form Dialog */}
      <TransferForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingItem(null);
        }}
        onSubmit={handleFormSubmit}
        defaultValues={editingItem}
        loading={createMutation.isPending || updateMutation.isPending}
      />

      {/* Cancel Confirmation */}
      <ConfirmDialog
        open={!!cancelTarget}
        onOpenChange={(open) => {
          if (!open) setCancelTarget(null);
        }}
        title="Cancel Transfer"
        description={`Are you sure you want to cancel the transfer "${cancelTarget?.reference || cancelTarget?.id}"? This action cannot be undone.`}
        confirmLabel="Cancel Transfer"
        cancelLabel="Keep"
        variant="destructive"
        onConfirm={handleCancel}
        loading={cancelMutation.isPending}
      />
    </div>
  );
}
