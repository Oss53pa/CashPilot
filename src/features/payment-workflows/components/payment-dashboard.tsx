import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CurrencyDisplay } from '@/components/shared/currency-display';
import { ApprovalChainInline } from './approval-chain';
import type { PaymentRequestWithChain, ApproverRole } from '../types';

interface PaymentDashboardProps {
  pendingRequests: PaymentRequestWithChain[];
  overdueRequests: PaymentRequestWithChain[];
  stats: {
    totalPending: number;
    approvedToday: number;
    rejectedToday: number;
    avgApprovalTimeHours: number;
  };
  currentUserRole: ApproverRole;
  onViewRequest?: (request: PaymentRequestWithChain) => void;
  onEscalate?: (id: string) => void;
}

const PRIORITY_COLORS: Record<string, string> = {
  low: 'text-muted-foreground',
  medium: 'text-blue-600',
  high: 'text-orange-600',
  urgent: 'text-red-600 font-bold',
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return 'Less than 1h ago';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function PaymentDashboard({
  pendingRequests,
  overdueRequests,
  stats,
  currentUserRole,
  onViewRequest,
  onEscalate,
}: PaymentDashboardProps) {
  // Filter requests awaiting current user's role
  const awaitingMyApproval = pendingRequests.filter((r) => {
    const currentStepData = r.approval_chain[r.current_step];
    return currentStepData?.approver_role === currentUserRole && currentStepData.status === 'pending';
  });

  const urgentPayments = pendingRequests.filter(
    (r) => r.priority === 'urgent' || r.priority === 'high',
  );

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalPending}</div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Approved Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{stats.approvedToday}</div>
            <p className="text-xs text-muted-foreground mt-1">Payments approved</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Rejected Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{stats.rejectedToday}</div>
            <p className="text-xs text-muted-foreground mt-1">Payments rejected</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg. Approval Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.avgApprovalTimeHours}h</div>
            <p className="text-xs text-muted-foreground mt-1">Average processing time</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Awaiting My Approval */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Awaiting My Approval ({currentUserRole})</CardTitle>
              <Badge variant="secondary">{awaitingMyApproval.length}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {awaitingMyApproval.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No payments awaiting your approval.
              </p>
            ) : (
              awaitingMyApproval.map((req) => (
                <div
                  key={req.id}
                  className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent/50 cursor-pointer transition-colors"
                  onClick={() => onViewRequest?.(req)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{req.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <CurrencyDisplay
                        amount={req.amount}
                        currency={req.currency}
                        className="text-sm font-semibold"
                      />
                      <span className={`text-xs ${PRIORITY_COLORS[req.priority]}`}>
                        {req.priority.toUpperCase()}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {timeAgo(req.created_at)}
                      </span>
                    </div>
                  </div>
                  <ApprovalChainInline steps={req.approval_chain} currentStep={req.current_step} />
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Urgent Payments */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Urgent Payments</CardTitle>
              <Badge variant="destructive">{urgentPayments.length}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {urgentPayments.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No urgent payments.
              </p>
            ) : (
              urgentPayments.map((req) => (
                <div
                  key={req.id}
                  className="flex items-center justify-between rounded-lg border border-orange-200 bg-orange-50/50 p-3 cursor-pointer hover:bg-orange-100/50 transition-colors"
                  onClick={() => onViewRequest?.(req)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{req.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <CurrencyDisplay
                        amount={req.amount}
                        currency={req.currency}
                        className="text-sm font-semibold"
                      />
                      <Badge variant="destructive" className="text-xs">
                        {req.priority.toUpperCase()}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Due: {new Date(req.payment_date).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  </div>
                  <ApprovalChainInline steps={req.approval_chain} currentStep={req.current_step} />
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Overdue Approvals */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Overdue Approvals</CardTitle>
            <Badge variant="destructive">{overdueRequests.length}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Payments that have exceeded the maximum approval delay
          </p>
        </CardHeader>
        <CardContent>
          {overdueRequests.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No overdue approvals. All payments are within SLA.
            </p>
          ) : (
            <div className="space-y-3">
              {overdueRequests.map((req) => (
                <div
                  key={req.id}
                  className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50/50 p-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">{req.description}</p>
                      {req.escalated && (
                        <Badge variant="destructive" className="text-xs">
                          ESCALATED
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <CurrencyDisplay
                        amount={req.amount}
                        currency={req.currency}
                        className="text-sm font-semibold"
                      />
                      <span className="text-xs text-red-600 font-medium">
                        Submitted {timeAgo(req.created_at)}
                      </span>
                      {req.escalation_date && (
                        <span className="text-xs text-muted-foreground">
                          Escalated {timeAgo(req.escalation_date)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <ApprovalChainInline steps={req.approval_chain} currentStep={req.current_step} />
                    {!req.escalated && onEscalate && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => onEscalate(req.id)}
                      >
                        Escalate
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
