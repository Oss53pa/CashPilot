import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable } from '@/components/shared/data-table';
import { Button } from '@/components/ui/button';
import { useCompanyStore } from '@/stores/company.store';
import { useCashFlows, useCreateCashFlow, useUpdateCashFlow, useDeleteCashFlow, useValidateCashFlow, useMonthlySummary, usePayables, useCreatePayable, useUpdatePayable } from '../hooks/use-cashflow';
import { CashFlowForm } from '../components/cashflow-form';
import { PayableForm } from '../components/payable-form';
import { getCashFlowColumns } from '../components/cashflow-columns';
import { CashFlowSummaryCards } from '../components/cashflow-summary-cards';
import type { CashFlow } from '@/types/database';
import type { CashFlowFormData, PayableEntry } from '../types';

export default function DisbursementsPage() {
  const { currentCompany } = useCompanyStore();
  const companyId = currentCompany?.id;

  const now = new Date();
  const [formOpen, setFormOpen] = useState(false);
  const [payableFormOpen, setPayableFormOpen] = useState(false);
  const [editingFlow, setEditingFlow] = useState<CashFlow | null>(null);
  const [editingPayable, setEditingPayable] = useState<PayableEntry | null>(null);

  const { data: flows = [] } = useCashFlows(companyId, 'disbursement');
  usePayables(companyId);
  const { data: summary, isLoading: summaryLoading } = useMonthlySummary(
    companyId,
    'disbursement',
    now.getFullYear(),
    now.getMonth() + 1,
  );

  const createFlow = useCreateCashFlow();
  const updateFlow = useUpdateCashFlow();
  const deleteFlow = useDeleteCashFlow();
  const validateFlow = useValidateCashFlow();
  const createPayable = useCreatePayable();
  const updatePayable = useUpdatePayable();

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

  function handlePayableSave(data: Partial<PayableEntry>) {
    if (editingPayable?.id) {
      updatePayable.mutate(
        { id: editingPayable.id, data },
        { onSuccess: () => { setPayableFormOpen(false); setEditingPayable(null); } },
      );
    } else {
      createPayable.mutate(
        { companyId: companyId!, data },
        { onSuccess: () => setPayableFormOpen(false) },
      );
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Décaissements" description="Gestion des décaissements et dettes fournisseurs">
        <Button variant="outline">Export</Button>
        <Button
          variant="outline"
          onClick={() => { setEditingFlow(null); setFormOpen(true); }}
        >
          Décaissement simple
        </Button>
        <Button onClick={() => { setEditingPayable(null); setPayableFormOpen(true); }}>
          Nouvelle Dette
        </Button>
      </PageHeader>

      <CashFlowSummaryCards
        summary={summary}
        type="disbursement"
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
        type="disbursement"
        bankAccounts={[]}
        counterparties={[]}
        isLoading={createFlow.isPending || updateFlow.isPending}
      />

      <PayableForm
        open={payableFormOpen}
        onOpenChange={(open) => {
          setPayableFormOpen(open);
          if (!open) setEditingPayable(null);
        }}
        onSave={handlePayableSave}
        entry={editingPayable}
        isLoading={createPayable.isPending || updatePayable.isPending}
      />
    </div>
  );
}
