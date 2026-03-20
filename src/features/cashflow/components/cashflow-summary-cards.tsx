import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CurrencyDisplay } from '@/components/shared/currency-display';
import type { MonthlySummary } from '../types';

interface CashFlowSummaryCardsProps {
  summary: MonthlySummary | undefined;
  type: 'receipt' | 'disbursement';
  currency?: string;
  isLoading?: boolean;
}

export function CashFlowSummaryCards({
  summary,
  type,
  currency = 'XOF',
  isLoading,
}: CashFlowSummaryCardsProps) {
  const totalAmount =
    type === 'receipt'
      ? summary?.total_receipts ?? 0
      : summary?.total_disbursements ?? 0;

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Loading...
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-7 w-24 animate-pulse rounded bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Validated
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            <CurrencyDisplay amount={totalAmount} currency={currency} />
          </div>
          <p className="text-xs text-muted-foreground">
            {summary?.count_validated ?? 0} validated operations
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Pending
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{summary?.count_pending ?? 0}</div>
          <p className="text-xs text-muted-foreground">Awaiting validation</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Reconciled
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{summary?.count_reconciled ?? 0}</div>
          <p className="text-xs text-muted-foreground">Reconciled operations</p>
        </CardContent>
      </Card>
    </div>
  );
}
