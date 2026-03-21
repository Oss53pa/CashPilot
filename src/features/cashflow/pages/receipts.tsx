import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable } from '@/components/shared/data-table';
import { Button } from '@/components/ui/button';
import { useCompanyStore } from '@/stores/company.store';
import { useCashFlows, useCreateCashFlow, useUpdateCashFlow, useDeleteCashFlow, useValidateCashFlow, useMonthlySummary, useReceivables, useCreateReceivable, useUpdateReceivable } from '../hooks/use-cashflow';
import { CashFlowForm } from '../components/cashflow-form';
import { ReceivableForm } from '../components/receivable-form';
import { getCashFlowColumns } from '../components/cashflow-columns';
import { CashFlowSummaryCards } from '../components/cashflow-summary-cards';
import type { CashFlow } from '@/types/database';
import type { CashFlowFormData, ReceivableEntry } from '../types';

export default function ReceiptsPage() {
  const { currentCompany } = useCompanyStore();
  const companyId = currentCompany?.id;

  const now = new Date();
  const [formOpen, setFormOpen] = useState(false);
  const [receivableFormOpen, setReceivableFormOpen] = useState(false);
  const [editingFlow, setEditingFlow] = useState<CashFlow | null>(null);
  const [editingReceivable, setEditingReceivable] = useState<ReceivableEntry | null>(null);

  const { data: flows = [] } = useCashFlows(companyId, 'receipt');
  const { data: receivables = [] } = useReceivables(companyId);
  const { data: summary, isLoading: summaryLoading } = useMonthlySummary(
    companyId,
    'receipt',
    now.getFullYear(),
    now.getMonth() + 1,
  );

  const createFlow = useCreateCashFlow();
  const updateFlow = useUpdateCashFlow();
  const deleteFlow = useDeleteCashFlow();
  const validateFlow = useValidateCashFlow();
  const createReceivable = useCreateReceivable();
  const updateReceivable = useUpdateReceivable();

  const columns = useMemo(
    () =>
      getCashFlowColumns({
        counterparties: [],
        onValidate: (id) => validateFlow.mutate({ id, userId: '' }),
        onEdit: (flow) => {
          setEditingFlow(flow);
          setFormOpen(true);
        },
        onDelete: (id) => deleteFlow.mutate(id),
      }),
    [validateFlow, deleteFlow],
  );

  function handleSubmit(data: CashFlowFormData) {
    if (editingFlow) {
      updateFlow.mutate(
        { id: editingFlow.id, data },
        { onSuccess: () => { setFormOpen(false); setEditingFlow(null); } },
      );
    } else {
      createFlow.mutate(
        { companyId: companyId!, userId: '', data },
        { onSuccess: () => setFormOpen(false) },
      );
    }
  }

  function handleReceivableSave(data: Partial<ReceivableEntry>) {
    if (editingReceivable?.id) {
      updateReceivable.mutate(
        { id: editingReceivable.id, data },
        { onSuccess: () => { setReceivableFormOpen(false); setEditingReceivable(null); } },
      );
    } else {
      createReceivable.mutate(
        { companyId: companyId!, data },
        { onSuccess: () => setReceivableFormOpen(false) },
      );
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Encaissements" description="Gestion des encaissements et créances">
        <Button variant="outline">Export</Button>
        <Button
          variant="outline"
          onClick={() => { setEditingFlow(null); setFormOpen(true); }}
        >
          Encaissement simple
        </Button>
        <Button onClick={() => { setEditingReceivable(null); setReceivableFormOpen(true); }}>
          Nouvelle Créance
        </Button>
      </PageHeader>

      <CashFlowSummaryCards
        summary={summary}
        type="receipt"
        currency={currentCompany?.currency}
        isLoading={summaryLoading}
      />

      <DataTable
        columns={columns}
        data={flows}
        searchKey="reference"
        searchPlaceholder="Rechercher par référence..."
      />

      <CashFlowForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingFlow(null);
        }}
        onSubmit={handleSubmit}
        cashFlow={editingFlow}
        type="receipt"
        bankAccounts={[]}
        counterparties={[]}
        isLoading={createFlow.isPending || updateFlow.isPending}
      />

      <ReceivableForm
        open={receivableFormOpen}
        onOpenChange={(open) => {
          setReceivableFormOpen(open);
          if (!open) setEditingReceivable(null);
        }}
        onSave={handleReceivableSave}
        entry={editingReceivable}
        isLoading={createReceivable.isPending || updateReceivable.isPending}
      />
    </div>
  );
}
