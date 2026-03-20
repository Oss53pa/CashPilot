import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable } from '@/components/shared/data-table';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CurrencyDisplay } from '@/components/shared/currency-display';
import { StatusBadge } from '@/components/shared/status-badge';
import { useCompanyStore } from '@/stores/company.store';
import {
  useTaxObligations,
  useCreateTaxObligation,
  useUpdateTaxObligation,
  useDeleteTaxObligation,
  useSecurityDeposits,
  useCreateSecurityDeposit,
  useUpdateSecurityDeposit,
  useDeleteSecurityDeposit,
  useVATFlows,
  useChargeRegularization,
} from '../hooks/use-fiscal';
import { TaxCalendar } from '../components/tax-calendar';
import { TaxForm } from '../components/tax-form';
import { DepositForm } from '../components/deposit-form';
import { VATFlowTable } from '../components/vat-flow';
import { ChargeRegularizationTable } from '../components/charge-regularization';
import { getTaxColumns } from '../components/tax-columns';
import type { TaxObligation, SecurityDeposit } from '@/types/database';
import type { TaxObligationFormData, SecurityDepositFormData } from '../types';
import { type ColumnDef } from '@tanstack/react-table';

export default function FiscalPage() {
  const { currentCompany } = useCompanyStore();
  const companyId = currentCompany?.id;

  const [taxFormOpen, setTaxFormOpen] = useState(false);
  const [depositFormOpen, setDepositFormOpen] = useState(false);
  const [editingTax, setEditingTax] = useState<TaxObligation | null>(null);
  const [editingDeposit, setEditingDeposit] = useState<SecurityDeposit | null>(null);

  const { data: taxObligations = [] } = useTaxObligations(companyId);
  const { data: deposits = [] } = useSecurityDeposits(companyId);
  const { data: vatFlows = [], isLoading: vatLoading } = useVATFlows(companyId);
  const { data: regularizations = [], isLoading: regLoading } = useChargeRegularization(companyId);

  const createTax = useCreateTaxObligation();
  const updateTax = useUpdateTaxObligation();
  const deleteTax = useDeleteTaxObligation();
  const createDeposit = useCreateSecurityDeposit();
  const updateDeposit = useUpdateSecurityDeposit();
  const deleteDeposit = useDeleteSecurityDeposit();

  const taxColumns = useMemo(
    () =>
      getTaxColumns({
        onEdit: (ob) => {
          setEditingTax(ob);
          setTaxFormOpen(true);
        },
        onDelete: (id) => deleteTax.mutate(id),
      }),
    [deleteTax],
  );

  const depositColumns: ColumnDef<SecurityDeposit>[] = useMemo(
    () => [
      {
        accessorKey: 'type',
        header: 'Type',
        cell: ({ row }) =>
          row.original.type.replace(/\b\w/g, (c) => c.toUpperCase()),
      },
      { accessorKey: 'institution', header: 'Institution' },
      {
        accessorKey: 'amount',
        header: 'Amount',
        cell: ({ row }) => (
          <CurrencyDisplay amount={row.original.amount} currency={row.original.currency} />
        ),
      },
      {
        accessorKey: 'deposit_date',
        header: 'Deposit Date',
        cell: ({ row }) => new Date(row.original.deposit_date).toLocaleDateString('fr-FR'),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        accessorKey: 'reference',
        header: 'Reference',
        cell: ({ row }) => row.original.reference ?? '-',
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setEditingDeposit(row.original);
                setDepositFormOpen(true);
              }}
            >
              Edit
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive"
              onClick={() => deleteDeposit.mutate(row.original.id)}
            >
              Delete
            </Button>
          </div>
        ),
      },
    ],
    [deleteDeposit],
  );

  function handleTaxSubmit(data: TaxObligationFormData) {
    if (editingTax) {
      updateTax.mutate(
        { id: editingTax.id, data },
        { onSuccess: () => { setTaxFormOpen(false); setEditingTax(null); } },
      );
    } else {
      createTax.mutate(
        { companyId: companyId!, data },
        { onSuccess: () => setTaxFormOpen(false) },
      );
    }
  }

  function handleDepositSubmit(data: SecurityDepositFormData) {
    if (editingDeposit) {
      updateDeposit.mutate(
        { id: editingDeposit.id, data },
        { onSuccess: () => { setDepositFormOpen(false); setEditingDeposit(null); } },
      );
    } else {
      createDeposit.mutate(
        { companyId: companyId!, data },
        { onSuccess: () => setDepositFormOpen(false) },
      );
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Fiscal" description="Tax obligations and security deposits" />

      <Tabs defaultValue="tax">
        <TabsList>
          <TabsTrigger value="tax">Obligations Fiscales</TabsTrigger>
          <TabsTrigger value="deposits">Depots de Garantie</TabsTrigger>
          <TabsTrigger value="vat">TVA</TabsTrigger>
          <TabsTrigger value="regularization">Regularisation</TabsTrigger>
        </TabsList>

        <TabsContent value="tax" className="space-y-6">
          <div className="flex justify-end">
            <Button onClick={() => { setEditingTax(null); setTaxFormOpen(true); }}>
              Add Tax Obligation
            </Button>
          </div>

          <TaxCalendar obligations={taxObligations} />

          <DataTable
            columns={taxColumns}
            data={taxObligations}
            searchKey="period"
            searchPlaceholder="Search by period..."
          />
        </TabsContent>

        <TabsContent value="deposits" className="space-y-6">
          <div className="flex justify-end">
            <Button onClick={() => { setEditingDeposit(null); setDepositFormOpen(true); }}>
              Add Security Deposit
            </Button>
          </div>

          <DataTable
            columns={depositColumns}
            data={deposits}
            searchKey="institution"
            searchPlaceholder="Search by institution..."
          />
        </TabsContent>

        <TabsContent value="vat" className="space-y-6">
          <VATFlowTable flows={vatFlows} isLoading={vatLoading} />
        </TabsContent>

        <TabsContent value="regularization" className="space-y-6">
          <ChargeRegularizationTable regularizations={regularizations} isLoading={regLoading} />
        </TabsContent>
      </Tabs>

      <TaxForm
        open={taxFormOpen}
        onOpenChange={(open) => {
          setTaxFormOpen(open);
          if (!open) setEditingTax(null);
        }}
        onSubmit={handleTaxSubmit}
        obligation={editingTax}
        isLoading={createTax.isPending || updateTax.isPending}
      />

      <DepositForm
        open={depositFormOpen}
        onOpenChange={(open) => {
          setDepositFormOpen(open);
          if (!open) setEditingDeposit(null);
        }}
        onSubmit={handleDepositSubmit}
        deposit={editingDeposit}
        isLoading={createDeposit.isPending || updateDeposit.isPending}
      />
    </div>
  );
}
