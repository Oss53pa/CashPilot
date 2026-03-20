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
import { cn } from '@/lib/utils';
import { useCompanyStore } from '@/stores/company.store';
import { useBudgetVarianceReport } from '../../hooks/use-reports';

export function BudgetVarianceReport() {
  const { t } = useTranslation();
  const currentCompany = useCompanyStore((s) => s.currentCompany);
  const companyId = currentCompany?.id;

  const [budgetId, setBudgetId] = useState('');
  const { data: report, isLoading } = useBudgetVarianceReport(companyId, budgetId);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div>
          <Label>{t('reports.budgetId', 'Budget ID')}</Label>
          <Input
            value={budgetId}
            onChange={(e) => setBudgetId(e.target.value)}
            placeholder="Enter budget ID..."
            className="w-64"
          />
        </div>
      </div>

      {!budgetId ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            {t('reports.enterBudgetId', 'Enter a Budget ID to generate the variance report.')}
          </CardContent>
        </Card>
      ) : isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : report ? (
        <>
          {/* Summary */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {t('reports.totalBudget', 'Total Budget')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  <CurrencyDisplay amount={report.total_budget} currency="XOF" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {t('reports.totalActual', 'Total Actual')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  <CurrencyDisplay amount={report.total_actual} currency="XOF" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {t('reports.totalVariance', 'Total Variance')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  <CurrencyDisplay amount={report.total_variance} currency="XOF" colorize />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detail table */}
          <Card>
            <CardHeader>
              <CardTitle>{t('reports.varianceDetails', 'Variance Details')}</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('reports.category', 'Category')}</TableHead>
                    <TableHead className="text-right">{t('reports.budget', 'Budget')}</TableHead>
                    <TableHead className="text-right">{t('reports.actual', 'Actual')}</TableHead>
                    <TableHead className="text-right">{t('reports.variance', 'Variance')}</TableHead>
                    <TableHead className="text-right">{t('reports.variancePct', 'Variance %')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.items.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.category}</TableCell>
                      <TableCell className="text-right">
                        <CurrencyDisplay amount={item.budget} currency="XOF" />
                      </TableCell>
                      <TableCell className="text-right">
                        <CurrencyDisplay amount={item.actual} currency="XOF" />
                      </TableCell>
                      <TableCell
                        className={cn(
                          'text-right font-medium',
                          item.variance > 0 ? 'text-red-600' : item.variance < 0 ? 'text-green-600' : '',
                        )}
                      >
                        <CurrencyDisplay amount={item.variance} currency="XOF" />
                      </TableCell>
                      <TableCell
                        className={cn(
                          'text-right',
                          item.variance_pct > 0 ? 'text-red-600' : item.variance_pct < 0 ? 'text-green-600' : '',
                        )}
                      >
                        {item.variance_pct > 0 ? '+' : ''}
                        {item.variance_pct}%
                      </TableCell>
                    </TableRow>
                  ))}
                  {report.items.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
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
