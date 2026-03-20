import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CurrencyDisplay } from '@/components/shared/currency-display';
import type { ApprovalStep, PaymentRequestWithChain } from '../types';
import { cn } from '@/lib/utils';

interface ApprovalChainProps {
  request: PaymentRequestWithChain;
}

const STATUS_CONFIG: Record<
  ApprovalStep['status'],
  { label: string; color: string; bgColor: string; borderColor: string }
> = {
  approved: {
    label: 'Approved',
    color: 'text-green-700',
    bgColor: 'bg-green-100',
    borderColor: 'border-green-500',
  },
  rejected: {
    label: 'Rejected',
    color: 'text-red-700',
    bgColor: 'bg-red-100',
    borderColor: 'border-red-500',
  },
  pending: {
    label: 'Pending',
    color: 'text-amber-700',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-400',
  },
};

const ROLE_LABELS: Record<string, string> = {
  DAF: 'Directeur Administratif et Financier',
  DGA: 'Directeur General Adjoint',
  DG: 'Directeur General',
  CA: "Conseil d'Administration",
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function ApprovalChain({ request }: ApprovalChainProps) {
  const { approval_chain, current_step, escalated } = request;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Approval Chain</CardTitle>
          <div className="flex items-center gap-2">
            <CurrencyDisplay amount={request.amount} currency={request.currency} className="font-semibold" />
            {escalated && (
              <Badge variant="destructive" className="text-xs">
                Escalated
              </Badge>
            )}
          </div>
        </div>
        <p className="text-sm text-muted-foreground">{request.description}</p>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {approval_chain.map((step, idx) => {
            const config = STATUS_CONFIG[step.status];
            const isCurrent = idx === current_step && step.status === 'pending';

            return (
              <div key={step.id} className="relative flex gap-4">
                {/* Vertical line connector */}
                {idx < approval_chain.length - 1 && (
                  <div
                    className={cn(
                      'absolute left-[15px] top-[32px] w-0.5 h-[calc(100%-16px)]',
                      step.status === 'approved'
                        ? 'bg-green-300'
                        : step.status === 'rejected'
                          ? 'bg-red-300'
                          : 'bg-muted',
                    )}
                  />
                )}

                {/* Step circle */}
                <div className="relative z-10 flex-shrink-0">
                  <div
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2',
                      config.bgColor,
                      config.borderColor,
                      config.color,
                      isCurrent && 'ring-2 ring-offset-2 ring-amber-400',
                    )}
                  >
                    {step.status === 'approved'
                      ? '\u2713'
                      : step.status === 'rejected'
                        ? '\u2717'
                        : idx + 1}
                  </div>
                </div>

                {/* Step content */}
                <div
                  className={cn(
                    'flex-1 pb-6 rounded-lg',
                    isCurrent && 'bg-amber-50/50 -mx-2 px-2 py-2',
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-sm">{step.approver_role}</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        {ROLE_LABELS[step.approver_role] ?? ''}
                      </span>
                    </div>
                    <Badge
                      variant={
                        step.status === 'approved'
                          ? 'default'
                          : step.status === 'rejected'
                            ? 'destructive'
                            : 'secondary'
                      }
                      className="text-xs"
                    >
                      {config.label}
                    </Badge>
                  </div>

                  {step.decided_at && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Decision: {formatDate(step.decided_at)}
                    </p>
                  )}

                  {step.comment && (
                    <p className="text-sm mt-1 italic text-muted-foreground">
                      &quot;{step.comment}&quot;
                    </p>
                  )}

                  {isCurrent && (
                    <p className="text-xs text-amber-600 font-medium mt-1">
                      Awaiting decision...
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// --- Compact inline version for table rows ---

interface ApprovalChainInlineProps {
  steps: ApprovalStep[];
  currentStep: number;
}

export function ApprovalChainInline({ steps, currentStep }: ApprovalChainInlineProps) {
  return (
    <div className="flex items-center gap-1">
      {steps.map((step, idx) => {
        const isCurrent = idx === currentStep && step.status === 'pending';
        return (
          <div key={step.id} className="flex items-center gap-1">
            <div
              className={cn(
                'w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border',
                step.status === 'approved' && 'bg-green-100 border-green-500 text-green-700',
                step.status === 'rejected' && 'bg-red-100 border-red-500 text-red-700',
                step.status === 'pending' && !isCurrent && 'bg-muted border-muted-foreground/30 text-muted-foreground',
                isCurrent && 'bg-amber-100 border-amber-500 text-amber-700 ring-1 ring-amber-400',
              )}
              title={`${step.approver_role}: ${step.status}`}
            >
              {step.status === 'approved'
                ? '\u2713'
                : step.status === 'rejected'
                  ? '\u2717'
                  : step.approver_role.charAt(0)}
            </div>
            {idx < steps.length - 1 && (
              <div
                className={cn(
                  'w-3 h-0.5',
                  step.status === 'approved' ? 'bg-green-300' : 'bg-muted',
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
