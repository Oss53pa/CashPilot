import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable } from '@/components/shared/data-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';
import { CurrencyDisplay } from '@/components/shared/currency-display';
import { useCompanyStore } from '@/stores/company.store';
import {
  useCapexOperations,
  useCapexDashboard,
  useCreateCapex,
  useUpdateCapex,
  useDeleteCapex,
  useSlippageAlerts,
} from '../hooks/use-capex';
import { CapexForm } from '../components/capex-form';
import { getCapexColumns } from '../components/capex-columns';
import { CapexDashboardCards } from '../components/capex-dashboard';
import { CapexDetailDialog } from '../components/capex-detail';
import { capexService } from '../services/capex.service';
import type { CapexOperation } from '@/types/database';
import type { CapexOperationFormData } from '../types';

export default function CapexPage() {
  const { currentCompany } = useCompanyStore();
  const companyId = currentCompany?.id;

  const [formOpen, setFormOpen] = useState(false);
  const [editingOp, setEditingOp] = useState<CapexOperation | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailCapexId, setDetailCapexId] = useState<string | null>(null);

  const { data: operations = [] } = useCapexOperations(companyId);
  const { data: dashboard, isLoading: dashboardLoading } = useCapexDashboard(companyId);
  const { data: slippageAlerts = [] } = useSlippageAlerts(companyId);

  const createCapex = useCreateCapex();
  const updateCapex = useUpdateCapex();
  const deleteCapex = useDeleteCapex();

  // Merge real operations with mock detail data for demo
  const mockDetails = capexService.getAllMockDetails();

  const handleViewDetail = (op: CapexOperation) => {
    // Try to find a mock detail for this operation, or use a mock ID directly
    const mockDetail = mockDetails.find(
      (d) => d.name === op.name || d.id === op.id,
    );
    setDetailCapexId(mockDetail?.id ?? op.id);
    setDetailOpen(true);
  };

  const columns = useMemo(
    () =>
      getCapexColumns({
        onEdit: (op) => {
          setEditingOp(op);
          setFormOpen(true);
        },
        onDelete: (id) => deleteCapex.mutate(id),
        onViewDetail: handleViewDetail,
      }),
    [deleteCapex],
  );

  function handleSubmit(data: CapexOperationFormData) {
    if (editingOp) {
      updateCapex.mutate(
        { id: editingOp.id, data },
        { onSuccess: () => { setFormOpen(false); setEditingOp(null); } },
      );
    } else {
      createCapex.mutate(
        { companyId: companyId!, userId: '', data },
        { onSuccess: () => setFormOpen(false) },
      );
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="CAPEX" description="Capital expenditure operations">
        <div className="flex gap-2">
          {mockDetails.length > 0 && (
            <Button
              variant="outline"
              onClick={() => {
                setDetailCapexId(mockDetails[0].id);
                setDetailOpen(true);
              }}
            >
              Demo Detail View
            </Button>
          )}
          <Button onClick={() => { setEditingOp(null); setFormOpen(true); }}>
            Add Operation
          </Button>
        </div>
      </PageHeader>

      {/* Slippage Alerts */}
      {slippageAlerts.length > 0 && (
        <Card className="border-red-200 dark:border-red-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-4 w-4" />
              Slippage Alerts
              <Badge variant="destructive" className="ml-auto">
                {slippageAlerts.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {slippageAlerts.map((alert) => (
              <div
                key={alert.payment_id}
                className="flex items-center justify-between p-2 rounded-lg bg-red-50 dark:bg-red-950/20 cursor-pointer hover:bg-red-100 dark:hover:bg-red-950/30"
                onClick={() => {
                  setDetailCapexId(alert.capex_id);
                  setDetailOpen(true);
                }}
              >
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
                  <div>
                    <p className="text-sm font-medium">
                      {alert.capex_code} - {alert.capex_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Payment "{alert.payment_label}" overdue by {alert.days_overdue} days
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <CurrencyDisplay amount={alert.amount} currency={alert.currency} />
                  <p className="text-xs text-red-500">
                    Due: {new Date(alert.due_date).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <CapexDashboardCards
        dashboard={dashboard}
        currency={currentCompany?.currency}
        isLoading={dashboardLoading}
      />

      <DataTable
        columns={columns}
        data={operations}
        searchKey="name"
        searchPlaceholder="Search by name..."
      />

      <CapexForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingOp(null);
        }}
        onSubmit={handleSubmit}
        operation={editingOp}
        isLoading={createCapex.isPending || updateCapex.isPending}
      />

      <CapexDetailDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        capexId={detailCapexId}
      />
    </div>
  );
}
