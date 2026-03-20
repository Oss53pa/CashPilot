import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CurrencyDisplay } from '@/components/shared/currency-display';
import type { GroupSummary } from '../services/consolidation.service';

interface GroupSummaryCardsProps {
  summary: GroupSummary | undefined;
  currency?: string;
  isLoading?: boolean;
}

export function GroupSummaryCards({ summary, currency = 'XOF', isLoading }: GroupSummaryCardsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
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
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Companies
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{summary?.company_count ?? 0}</div>
          <p className="text-xs text-muted-foreground">Active entities</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Receipts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            <CurrencyDisplay amount={summary?.total_receipts ?? 0} currency={currency} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Disbursements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            <CurrencyDisplay amount={summary?.total_disbursements ?? 0} currency={currency} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Net Position
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            <CurrencyDisplay
              amount={summary?.net_position ?? 0}
              currency={currency}
              colorize
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
