import { AlertTriangle, ArrowRightLeft, Clock } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CurrencyDisplay } from '@/components/shared/currency-display';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

import type { TransitAccount } from '../types';

interface TransitBalanceProps {
  transitData: TransitAccount | undefined;
  isLoading: boolean;
}

function getDaysInTransit(oldestDate: string | null): number {
  if (!oldestDate) return 0;
  const now = new Date();
  const oldest = new Date(oldestDate);
  return Math.ceil((now.getTime() - oldest.getTime()) / (1000 * 60 * 60 * 24));
}

export function TransitBalance({ transitData, isLoading }: TransitBalanceProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-48" />
        </CardContent>
      </Card>
    );
  }

  if (!transitData) return null;

  const daysInTransit = getDaysInTransit(transitData.oldest_transfer_date);
  const isAgeAlert = daysInTransit > 3;

  return (
    <Card className={isAgeAlert ? 'border-destructive' : ''}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <ArrowRightLeft className="h-4 w-4" />
          Transit Balance
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-baseline justify-between">
          <div className="text-2xl font-bold">
            <CurrencyDisplay
              amount={transitData.total_in_transit}
              currency={transitData.currency}
            />
          </div>
          <Badge variant="secondary">
            {transitData.count_in_transit} transfer{transitData.count_in_transit !== 1 ? 's' : ''}
          </Badge>
        </div>

        {transitData.oldest_transfer_date && (
          <div className="flex items-center gap-2 text-sm">
            {isAgeAlert ? (
              <AlertTriangle className="h-4 w-4 text-destructive" />
            ) : (
              <Clock className="h-4 w-4 text-muted-foreground" />
            )}
            <span className={isAgeAlert ? 'text-destructive font-medium' : 'text-muted-foreground'}>
              Oldest: {daysInTransit} day{daysInTransit !== 1 ? 's' : ''} ago
              {isAgeAlert && ' - Requires attention'}
            </span>
          </div>
        )}

        {transitData.count_in_transit === 0 && (
          <p className="text-sm text-muted-foreground">No transfers currently in transit</p>
        )}
      </CardContent>
    </Card>
  );
}
