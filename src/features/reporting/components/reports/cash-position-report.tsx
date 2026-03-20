import { useState } from 'react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { CurrencyDisplay } from '@/components/shared/currency-display';
import { useCompanyStore } from '@/stores/company.store';
import { useCashPositionReport } from '../../hooks/use-reports';

export function CashPositionReport() {
  const { t } = useTranslation();
  const currentCompany = useCompanyStore((s) => s.currentCompany);
  const companyId = currentCompany?.id;

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const { data: report, isLoading } = useCashPositionReport(companyId, date);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div>
          <Label>{t('reports.reportDate', 'Report Date')}</Label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-48" />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : report ? (
        <>
          {/* Summary by currency */}
          <div className="grid gap-4 md:grid-cols-3">
            {report.total_by_currency.map((item) => (
              <Card key={item.currency}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {t('reports.totalBalance', 'Total Balance')} ({item.currency})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    <CurrencyDisplay amount={item.total} currency={item.currency} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Detail table */}
          <Card>
            <CardHeader>
              <CardTitle>{t('reports.accountDetails', 'Account Details')}</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('reports.bank', 'Bank')}</TableHead>
                    <TableHead>{t('reports.accountName', 'Account')}</TableHead>
                    <TableHead>{t('reports.currency', 'Currency')}</TableHead>
                    <TableHead className="text-right">{t('reports.balance', 'Balance')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.accounts.map((account, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{account.bank_name}</TableCell>
                      <TableCell>{account.account_name}</TableCell>
                      <TableCell>{account.currency}</TableCell>
                      <TableCell className="text-right">
                        <CurrencyDisplay amount={account.balance} currency={account.currency} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}
