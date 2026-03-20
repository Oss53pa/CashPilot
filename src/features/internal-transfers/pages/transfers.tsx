import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable } from '@/components/shared/data-table';
import { Button } from '@/components/ui/button';
import { useCompanyStore } from '@/stores/company.store';
import { useTransfers, useCreateTransfer, useUpdateTransfer, useDeleteTransfer } from '../hooks/use-transfers';
import { TransferForm } from '../components/transfer-form';
import { getTransferColumns } from '../components/transfer-columns';
import type { InternalTransfer } from '@/types/database';
import type { InternalTransferFormData } from '../types';

export default function TransfersPage() {
  const { currentCompany } = useCompanyStore();
  const companyId = currentCompany?.id;

  const [formOpen, setFormOpen] = useState(false);
  const [editingTransfer, setEditingTransfer] = useState<InternalTransfer | null>(null);

  const { data: transfers = [] } = useTransfers(companyId);
  const createTransfer = useCreateTransfer();
  const updateTransfer = useUpdateTransfer();
  const deleteTransfer = useDeleteTransfer();

  const columns = useMemo(
    () =>
      getTransferColumns({
        bankAccounts: [],
        onEdit: (transfer) => {
          setEditingTransfer(transfer);
          setFormOpen(true);
        },
        onDelete: (id) => deleteTransfer.mutate(id),
      }),
    [deleteTransfer],
  );

  function handleSubmit(data: InternalTransferFormData) {
    if (editingTransfer) {
      updateTransfer.mutate(
        { id: editingTransfer.id, data },
        { onSuccess: () => { setFormOpen(false); setEditingTransfer(null); } },
      );
    } else {
      createTransfer.mutate(
        { companyId: companyId!, userId: '', data },
        { onSuccess: () => setFormOpen(false) },
      );
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Transferts Internes" description="Manage internal transfers between accounts">
        <Button onClick={() => { setEditingTransfer(null); setFormOpen(true); }}>
          New Transfer
        </Button>
      </PageHeader>

      <DataTable
        columns={columns}
        data={transfers}
        searchKey="reference"
        searchPlaceholder="Search by reference..."
      />

      <TransferForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingTransfer(null);
        }}
        onSubmit={handleSubmit}
        transfer={editingTransfer}
        bankAccounts={[]}
        isLoading={createTransfer.isPending || updateTransfer.isPending}
      />
    </div>
  );
}
