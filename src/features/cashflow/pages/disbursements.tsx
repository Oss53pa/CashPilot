import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable } from '@/components/shared/data-table';
import { Button } from '@/components/ui/button';
import { useCompanyStore } from '@/stores/company.store';
import { useCashFlows, useCreateCashFlow, useUpdateCashFlow, useDeleteCashFlow, useValidateCashFlow, useMonthlySummary } from '../hooks/use-cashflow';
import { CashFlowForm } from '../components/cashflow-form';
import { getCashFlowColumns } from '../components/cashflow-columns';
import { CashFlowSummaryCards } from '../components/cashflow-summary-cards';
import type { CashFlow } from '@/types/database';
import type { CashFlowFormData } from '../types';

export default function DisbursementsPage() {
  const { currentCompany } = useCompanyStore();
  const companyId = currentCompany?.id;

  const now = new Date();
  const [formOpen, setFormOpen] = useState(false);
  const [editingFlow, setEditingFlow] = useState<CashFlow | null>(null);

  const { data: flows = [] } = useCashFlows(companyId, 'disbursement');
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

  return (
    <div className="space-y-6">
      <PageHeader title="Decaissements" description="Manage disbursements and outgoing cash flows">
        <Button variant="outline">Export</Button>
        <Button onClick={() => { setEditingFlow(null); setFormOpen(true); }}>
          Add Disbursement
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
        searchPlaceholder="Search by reference..."
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
    </div>
  );
}
