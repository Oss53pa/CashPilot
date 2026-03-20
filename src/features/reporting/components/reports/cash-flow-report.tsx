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
import { useCashFlowReport } from '../../hooks/use-reports';

export function CashFlowReport() {
  const { t } = useTranslation();
  const currentCompany = useCompanyStore((s) => s.currentCompany);
  const companyId = currentCompany?.id;

  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(firstDay);
  const [endDate, setEndDate] = useState(lastDay);

  const { data: report, isLoading } = useCashFlowReport(companyId, startDate, endDate);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div>
          <Label>{t('reports.startDate', 'Start Date')}</Label>
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-48" />
        </div>
        <div>
          <Label>{t('reports.endDate', 'End Date')}</Label>
          <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-48" />
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
          {/* Summary cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-green-600">
                  {t('reports.totalReceipts', 'Total Receipts')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  <CurrencyDisplay amount={report.total_receipts} currency="XOF" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-red-600">
                  {t('reports.totalDisbursements', 'Total Disbursements')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  <CurrencyDisplay amount={report.total_disbursements} currency="XOF" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {t('reports.netCashFlow', 'Net Cash Flow')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  <CurrencyDisplay amount={report.net_cash_flow} currency="XOF" colorize />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Receipts */}
          <Card>
            <CardHeader>
              <CardTitle className="text-green-600">{t('reports.receipts', 'Receipts')}</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('reports.category', 'Category')}</TableHead>
                    <TableHead className="text-right">{t('reports.amount', 'Amount')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.receipts.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item.category}</TableCell>
                      <TableCell className="text-right">
                        <CurrencyDisplay amount={item.amount} currency="XOF" />
                      </TableCell>
                    </TableRow>
                  ))}
                  {report.receipts.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={2} className="text-center text-muted-foreground">
                        {t('reports.noData', 'No data available')}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Disbursements */}
          <Card>
            <CardHeader>
              <CardTitle className="text-red-600">{t('reports.disbursements', 'Disbursements')}</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('reports.category', 'Category')}</TableHead>
                    <TableHead className="text-right">{t('reports.amount', 'Amount')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.disbursements.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item.category}</TableCell>
                      <TableCell className="text-right">
                        <CurrencyDisplay amount={item.amount} currency="XOF" />
                      </TableCell>
                    </TableRow>
                  ))}
                  {report.disbursements.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={2} className="text-center text-muted-foreground">
                        {t('reports.noData', 'No data available')}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}
