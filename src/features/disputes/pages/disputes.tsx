import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable } from '@/components/shared/data-table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CurrencyDisplay } from '@/components/shared/currency-display';
import { useCompanyStore } from '@/stores/company.store';
import { useDisputes, useCreateDispute, useUpdateDispute, useDeleteDispute } from '../hooks/use-disputes';
import { DisputeForm } from '../components/dispute-form';
import { getDisputeColumns } from '../components/dispute-columns';
import type { DisputeFile } from '@/types/database';
import type { DisputeFileFormData } from '../types';

export default function DisputesPage() {
  const { currentCompany } = useCompanyStore();
  const companyId = currentCompany?.id;

  const [formOpen, setFormOpen] = useState(false);
  const [editingDispute, setEditingDispute] = useState<DisputeFile | null>(null);

  const { data: disputes = [] } = useDisputes(companyId);
  const createDispute = useCreateDispute();
  const updateDispute = useUpdateDispute();
  const deleteDispute = useDeleteDispute();

  const openDisputes = disputes.filter((d) => d.status === 'open' || d.status === 'in_progress');
  const totalDisputed = openDisputes.reduce((sum, d) => sum + d.amount_disputed, 0);
  const totalProvisions = openDisputes.reduce((sum, d) => sum + d.amount_provision, 0);

  const columns = useMemo(
    () =>
      getDisputeColumns({
        counterparties: [],
        onEdit: (dispute) => {
          setEditingDispute(dispute);
          setFormOpen(true);
        },
        onDelete: (id) => deleteDispute.mutate(id),
      }),
    [deleteDispute],
  );

  function handleSubmit(data: DisputeFileFormData) {
    if (editingDispute) {
      updateDispute.mutate(
        { id: editingDispute.id, data },
        { onSuccess: () => { setFormOpen(false); setEditingDispute(null); } },
      );
    } else {
      createDispute.mutate(
        { companyId: companyId!, userId: '', data },
        { onSuccess: () => setFormOpen(false) },
      );
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Contentieux" description="Manage dispute files and litigation">
        <Button onClick={() => { setEditingDispute(null); setFormOpen(true); }}>
          Add Dispute
        </Button>
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Open Disputes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{openDisputes.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Amount Disputed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <CurrencyDisplay
                amount={totalDisputed}
                currency={currentCompany?.currency}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Provisions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <CurrencyDisplay
                amount={totalProvisions}
                currency={currentCompany?.currency}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <DataTable
        columns={columns}
        data={disputes}
        searchKey="reference"
        searchPlaceholder="Search by reference..."
      />

      <DisputeForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingDispute(null);
        }}
        onSubmit={handleSubmit}
        dispute={editingDispute}
        counterparties={[]}
        isLoading={createDispute.isPending || updateDispute.isPending}
      />
    </div>
  );
}
