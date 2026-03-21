import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable } from '@/components/shared/data-table';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCompanyStore } from '@/stores/company.store';
import {
  usePaymentRequests,
  usePaymentRequestsWithChain,
  useMyPaymentRequests,
  usePendingApprovals,
  useCreatePaymentRequest,
  useUpdatePaymentRequest,
  useDeletePaymentRequest,
  useApprovePayment,
  useRejectPayment,
  useDOARules,
  useCreateDOARule,
  useUpdateDOARule,
  useDeleteDOARule,
  useOverdueApprovals,
  useEscalatePayment,
  useDashboardStats,
} from '../hooks/use-payment-workflows';
import { PaymentRequestForm } from '../components/payment-request-form';
import { getPaymentColumns } from '../components/payment-columns';
import { DOASettings } from '../components/doa-settings';
import { PaymentDashboard } from '../components/payment-dashboard';
import { ApprovalChain } from '../components/approval-chain';
import type { PaymentRequest } from '@/types/database';
import type { PaymentRequestFormData, DOARuleFormData, ApproverRole, PaymentRequestWithChain } from '../types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function PaymentWorkflowsPage() {
  const { currentCompany } = useCompanyStore();
  const companyId = currentCompany?.id;
  // In a real app these would come from auth context
  const userId = 'user-dga' as string | undefined;
  const userRole: ApproverRole = 'DGA';
  const isAdmin = true;

  const [formOpen, setFormOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState<PaymentRequest | null>(null);
  const [viewingChain, setViewingChain] = useState<PaymentRequestWithChain | null>(null);

  // Queries
  const { data: allRequests = [] } = usePaymentRequests(companyId);
  const { data: allRequestsWithChain = [] } = usePaymentRequestsWithChain(companyId);
  useMyPaymentRequests(companyId, userId);
  const { data: pendingApprovals = [] } = usePendingApprovals(userId, userRole);
  const { data: doaRules = [] } = useDOARules(companyId);
  const { data: overdueApprovals = [] } = useOverdueApprovals(companyId);
  const { data: dashboardStats } = useDashboardStats(companyId);

  // Mutations
  const createRequest = useCreatePaymentRequest();
  const updateRequest = useUpdatePaymentRequest();
  const deleteRequest = useDeletePaymentRequest();
  const approvePayment = useApprovePayment();
  const rejectPayment = useRejectPayment();
  const createDOARule = useCreateDOARule();
  const updateDOARule = useUpdateDOARule();
  const deleteDOARule = useDeleteDOARule();
  const escalatePayment = useEscalatePayment();

  // Columns for Pending Approval (with approval actions)
  const approvalColumns = useMemo(
    () =>
      getPaymentColumns({
        counterparties: [],
        showApprovalActions: true,
        onApprove: (id) =>
          approvePayment.mutate({ id, approverId: userId ?? '', comments: null }),
        onReject: (id) =>
          rejectPayment.mutate({ id, approverId: userId ?? '', comments: null }),
        onEdit: (req) => {
          setEditingRequest(req);
          setFormOpen(true);
        },
        onDelete: (id) => deleteRequest.mutate(id),
      }),
    [approvePayment, rejectPayment, deleteRequest, userId],
  );

  // Columns for All Requests
  const allColumns = useMemo(
    () =>
      getPaymentColumns({
        counterparties: [],
        onEdit: (req) => {
          setEditingRequest(req);
          setFormOpen(true);
        },
        onDelete: (id) => deleteRequest.mutate(id),
      }),
    [deleteRequest],
  );

  function handleSubmit(data: PaymentRequestFormData) {
    if (editingRequest) {
      updateRequest.mutate(
        { id: editingRequest.id, data },
        { onSuccess: () => { setFormOpen(false); setEditingRequest(null); } },
      );
    } else {
      createRequest.mutate(
        { companyId: companyId!, userId: userId ?? '', data },
        { onSuccess: () => setFormOpen(false) },
      );
    }
  }

  function handleCreateDOARule(data: DOARuleFormData) {
    createDOARule.mutate({
      ...data,
      company_id: companyId ?? '',
      tenant_id: currentCompany?.tenant_id ?? '',
    });
  }

  function handleUpdateDOARule(id: string, data: Partial<DOARuleFormData>) {
    updateDOARule.mutate({ id, data });
  }

  function handleDeleteDOARule(id: string) {
    deleteDOARule.mutate(id);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payment Workflows"
        description="Manage payment requests, approvals and delegation of authority"
      >
        <Button onClick={() => { setEditingRequest(null); setFormOpen(true); }}>
          Create Request
        </Button>
      </PageHeader>

      <Tabs defaultValue="dashboard">
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="approvals">
            My Approvals
            {pendingApprovals.length > 0 && (
              <span className="ml-1.5 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                {pendingApprovals.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="all">All Requests</TabsTrigger>
          {isAdmin && <TabsTrigger value="doa">DOA Settings</TabsTrigger>}
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard">
          <PaymentDashboard
            pendingRequests={allRequestsWithChain.filter(
              (r) => r.status === 'pending_approval',
            )}
            overdueRequests={overdueApprovals}
            stats={dashboardStats ?? {
              totalPending: 0,
              approvedToday: 0,
              rejectedToday: 0,
              avgApprovalTimeHours: 0,
            }}
            currentUserRole={userRole}
            onViewRequest={(req) => setViewingChain(req)}
            onEscalate={(id) => escalatePayment.mutate(id)}
          />
        </TabsContent>

        {/* My Approvals Tab */}
        <TabsContent value="approvals">
          <DataTable
            columns={approvalColumns}
            data={pendingApprovals as unknown as PaymentRequest[]}
            searchKey="description"
            searchPlaceholder="Search pending approvals..."
          />
        </TabsContent>

        {/* All Requests Tab */}
        <TabsContent value="all">
          <DataTable
            columns={allColumns}
            data={allRequests}
            searchKey="description"
            searchPlaceholder="Search all requests..."
          />
        </TabsContent>

        {/* DOA Settings Tab (admin only) */}
        {isAdmin && (
          <TabsContent value="doa">
            <DOASettings
              rules={doaRules}
              onCreateRule={handleCreateDOARule}
              onUpdateRule={handleUpdateDOARule}
              onDeleteRule={handleDeleteDOARule}
              isLoading={createDOARule.isPending || updateDOARule.isPending}
            />
          </TabsContent>
        )}
      </Tabs>

      {/* Payment Request Form */}
      <PaymentRequestForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingRequest(null);
        }}
        onSubmit={handleSubmit}
        request={editingRequest}
        bankAccounts={[]}
        counterparties={[]}
        isLoading={createRequest.isPending || updateRequest.isPending}
      />

      {/* Approval Chain Dialog */}
      <Dialog open={!!viewingChain} onOpenChange={(open) => { if (!open) setViewingChain(null); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Approval Details</DialogTitle>
          </DialogHeader>
          {viewingChain && <ApprovalChain request={viewingChain} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
