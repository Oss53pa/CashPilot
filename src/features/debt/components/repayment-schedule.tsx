import { useTranslation } from 'react-i18next';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { CurrencyDisplay } from '@/components/shared/currency-display';
import { useRepaymentSchedule } from '../hooks/use-debt';

interface RepaymentScheduleProps {
  contractId: string;
  currency: string;
}

export function RepaymentSchedule({ contractId, currency }: RepaymentScheduleProps) {
  const { t } = useTranslation();
  const { data: schedule = [], isLoading } = useRepaymentSchedule(contractId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent>
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full mb-2" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (schedule.length === 0) {
    return (
      <Card>
        <CardContent className="py-6 text-center text-muted-foreground">
          {t('debt.noSchedule', 'No repayment schedule available.')}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {t('debt.repaymentSchedule', 'Repayment Schedule')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('debt.date', 'Date')}</TableHead>
              <TableHead className="text-right">{t('debt.principal', 'Principal')}</TableHead>
              <TableHead className="text-right">{t('debt.interest', 'Interest')}</TableHead>
              <TableHead className="text-right">{t('debt.total', 'Total')}</TableHead>
              <TableHead className="text-right">{t('debt.remainingBalance', 'Remaining')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {schedule.map((item, index) => {
              const isPast = new Date(item.date) < new Date();
              return (
                <TableRow key={index} className={isPast ? 'opacity-50' : ''}>
                  <TableCell>{new Date(item.date).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <CurrencyDisplay amount={item.principal_portion} currency={currency} />
                  </TableCell>
                  <TableCell className="text-right">
                    <CurrencyDisplay amount={item.interest_portion} currency={currency} />
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    <CurrencyDisplay amount={item.total} currency={currency} />
                  </TableCell>
                  <TableCell className="text-right">
                    <CurrencyDisplay amount={item.remaining_balance} currency={currency} />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
