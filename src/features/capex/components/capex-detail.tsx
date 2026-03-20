import { useTranslation } from 'react-i18next';
import {
  Building2,
  User,
  FileText,
  AlertTriangle,
  ArrowRight,
  X,
} from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { CurrencyDisplay } from '@/components/shared/currency-display';
import { StatusBadge } from '@/components/shared/status-badge';

import { useCapexDetail } from '../hooks/use-capex';
import { PaymentSchedule } from './payment-schedule';
import type { CapexOperationDetail } from '../types';

interface CapexDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  capexId: string | null;
}

function FinancialPipeline({ detail }: { detail: CapexOperationDetail }) {
  const steps = [
    { label: 'Budget', amount: detail.budget_amount },
    { label: 'Engage', amount: detail.committed_amount },
    { label: 'Facture', amount: detail.invoiced_amount },
    { label: 'Decaisse', amount: detail.spent_amount },
    { label: 'Restant', amount: detail.budget_amount - detail.spent_amount },
  ];

  const maxAmount = Math.max(...steps.map((s) => s.amount));

  return (
    <div className="flex items-end gap-1">
      {steps.map((step, idx) => {
        const height = maxAmount > 0 ? Math.max(20, (step.amount / maxAmount) * 80) : 20;
        const isLast = idx === steps.length - 1;
        const color = isLast
          ? step.amount < 0
            ? 'bg-red-500'
            : 'bg-blue-200'
          : idx === 0
            ? 'bg-slate-400'
            : idx === 1
              ? 'bg-orange-400'
              : idx === 2
                ? 'bg-yellow-400'
                : 'bg-green-500';

        return (
          <div key={step.label} className="flex items-end gap-1">
            <div className="flex flex-col items-center min-w-[60px]">
              <span className="text-[10px] font-medium text-muted-foreground mb-1">
                {new Intl.NumberFormat('fr-FR', { notation: 'compact' }).format(step.amount)}
              </span>
              <div
                className={`w-full rounded-t ${color}`}
                style={{ height: `${height}px` }}
              />
              <span className="text-[10px] mt-1">{step.label}</span>
            </div>
            {idx < steps.length - 1 && (
              <ArrowRight className="h-3 w-3 text-muted-foreground mb-4 shrink-0" />
            )}
          </div>
        );
      })}
    </div>
  );
}

export function CapexDetailDialog({
  open,
  onOpenChange,
  capexId,
}: CapexDetailDialogProps) {
  const { t } = useTranslation();
  const { data: detail, isLoading } = useCapexDetail(capexId ?? undefined);

  if (!capexId) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {t('capex.operationDetail', 'CAPEX Operation Detail')}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : !detail ? (
          <div className="py-12 text-center text-muted-foreground">
            {t('capex.detailNotFound', 'Operation detail not available for this item.')}
            <p className="text-xs mt-2">
              (Mock detail data available for CAPEX IDs: capex-mock-001, capex-mock-002, capex-mock-003)
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Operation Header */}
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="font-mono">
                        {detail.code}
                      </Badge>
                      <StatusBadge status={detail.status} />
                    </div>
                    <h3 className="text-lg font-semibold">{detail.name}</h3>
                    {detail.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {detail.description}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">
                      {detail.company_name ?? 'N/A'}
                    </p>
                    <Badge variant="secondary" className="mt-1">
                      {detail.category.replace(/\b\w/g, (c) => c.toUpperCase())}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contractor Info */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {t('capex.contractor', 'Contractor')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Name</p>
                    <p className="text-sm font-medium">{detail.contractor.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Contract Ref.</p>
                    <p className="text-sm font-mono">{detail.contractor.contract_reference}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Amount HT</p>
                    <p className="text-sm font-medium">
                      <CurrencyDisplay
                        amount={detail.contractor.contract_amount_ht}
                        currency={detail.currency}
                      />
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      TVA ({detail.contractor.vat_rate}%)
                    </p>
                    <p className="text-sm">
                      <CurrencyDisplay
                        amount={detail.contractor.amount_ttc - detail.contractor.contract_amount_ht}
                        currency={detail.currency}
                      />
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Amount TTC</p>
                    <p className="text-sm font-bold">
                      <CurrencyDisplay
                        amount={detail.contractor.amount_ttc}
                        currency={detail.currency}
                      />
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Retention ({detail.contractor.retention_rate}%)
                    </p>
                    <p className="text-sm">
                      <CurrencyDisplay
                        amount={detail.contractor.retention_amount}
                        currency={detail.currency}
                      />{' '}
                      <span className="text-xs text-muted-foreground">
                        (release: {new Date(detail.contractor.retention_release_date).toLocaleDateString('fr-FR')})
                      </span>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Financial Tracking Pipeline */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  {t('capex.financialTracking', 'Financial Tracking')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <FinancialPipeline detail={detail} />

                <Separator className="my-4" />

                <div className="grid grid-cols-5 gap-2 text-center">
                  <div>
                    <p className="text-xs text-muted-foreground">Budget</p>
                    <p className="text-sm font-medium">
                      <CurrencyDisplay amount={detail.budget_amount} currency={detail.currency} />
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Engage</p>
                    <p className="text-sm font-medium">
                      <CurrencyDisplay amount={detail.committed_amount} currency={detail.currency} />
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Facture</p>
                    <p className="text-sm font-medium">
                      <CurrencyDisplay amount={detail.invoiced_amount} currency={detail.currency} />
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Decaisse</p>
                    <p className="text-sm font-medium">
                      <CurrencyDisplay amount={detail.spent_amount} currency={detail.currency} />
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Restant</p>
                    <p className="text-sm font-bold">
                      <CurrencyDisplay
                        amount={detail.budget_amount - detail.spent_amount}
                        currency={detail.currency}
                        colorize
                      />
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Slippage Alert */}
            {detail.slippage_days > 0 && (
              <div className="flex items-center gap-3 p-3 rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900">
                <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-red-700 dark:text-red-400">
                    {t('capex.slippageAlert', 'Slippage Alert')}
                  </p>
                  <p className="text-sm text-red-600 dark:text-red-300">
                    This operation has {detail.slippage_days} day(s) of slippage on overdue payments.
                    The forecast has been auto-adjusted accordingly.
                  </p>
                </div>
              </div>
            )}

            {/* Retention Info */}
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">
                      {t('capex.retentionGuarantee', 'Retention Guarantee')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Release date:{' '}
                      {new Date(detail.contractor.retention_release_date).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">
                      <CurrencyDisplay
                        amount={detail.retention_amount}
                        currency={detail.currency}
                      />
                    </p>
                    <Badge variant="secondary">
                      {new Date(detail.contractor.retention_release_date) > new Date('2026-03-19')
                        ? 'Pending'
                        : 'Released'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Schedule */}
            <PaymentSchedule
              payments={detail.payment_schedule}
              currency={detail.currency}
              totalBudget={detail.budget_amount}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
