import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { GitCompare } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from '@/components/ui/table';
import { cn, formatCurrency } from '@/lib/utils';
import { useCompareBudgetVersions } from '../hooks/use-budget';

interface BudgetOption {
  id: string;
  name: string;
  fiscal_year: number;
}

interface BudgetComparisonProps {
  budgets: BudgetOption[];
}

export function BudgetComparisonView({ budgets }: BudgetComparisonProps) {
  const { t } = useTranslation('budget');
  const [versionA, setVersionA] = useState('');
  const [versionB, setVersionB] = useState('');

  const { data: comparison, isLoading } = useCompareBudgetVersions(versionA, versionB);

  const receiptLines = comparison?.lines.filter((l) => l.type === 'receipt') ?? [];
  const disbursementLines = comparison?.lines.filter((l) => l.type === 'disbursement') ?? [];

  const totalVarianceReceipts = receiptLines.reduce((s, l) => s + l.variance_total, 0);
  const totalVarianceDisbursements = disbursementLines.reduce((s, l) => s + l.variance_total, 0);

  function varianceColor(value: number, type: 'receipt' | 'disbursement') {
    // For receipts: positive variance = good (green), negative = bad (red)
    // For disbursements: positive variance = bad (red), negative = good (green)
    const isGood = type === 'receipt' ? value > 0 : value < 0;
    if (value === 0) return '';
    return isGood ? 'text-green-600 bg-green-50 dark:bg-green-950/20' : 'text-red-600 bg-red-50 dark:bg-red-950/20';
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GitCompare className="h-5 w-5" />
          {t('comparison.title', 'Budget Comparison')}
        </CardTitle>
        <CardDescription>
          {t('comparison.description', 'Compare two budget versions side by side.')}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Version selectors */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>{t('comparison.version_a', 'Version A')}</Label>
            <Select value={versionA} onValueChange={setVersionA}>
              <SelectTrigger>
                <SelectValue placeholder={t('comparison.select_budget', 'Select budget...')} />
              </SelectTrigger>
              <SelectContent>
                {budgets.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name} ({b.fiscal_year})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t('comparison.version_b', 'Version B')}</Label>
            <Select value={versionB} onValueChange={setVersionB}>
              <SelectTrigger>
                <SelectValue placeholder={t('comparison.select_budget', 'Select budget...')} />
              </SelectTrigger>
              <SelectContent>
                {budgets.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name} ({b.fiscal_year})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoading && (
          <p className="text-sm text-muted-foreground">{t('comparison.loading', 'Loading comparison...')}</p>
        )}

        {comparison && (
          <>
            {/* Comparison Table */}
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[160px]">{t('comparison.category', 'Category')}</TableHead>
                    <TableHead className="text-right">{t('comparison.version_a_total', 'Version A')}</TableHead>
                    <TableHead className="text-right">{t('comparison.version_b_total', 'Version B')}</TableHead>
                    <TableHead className="text-right">{t('comparison.variance', 'Variance')}</TableHead>
                    <TableHead className="text-right">{t('comparison.variance_pct', 'Var %')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Receipts */}
                  <TableRow className="bg-muted/50">
                    <TableCell colSpan={5} className="font-bold">
                      {t('comparison.receipts', 'Receipts')}
                    </TableCell>
                  </TableRow>
                  {receiptLines.map((line) => (
                    <TableRow key={`receipt-${line.category}`}>
                      <TableCell className="pl-6">{line.category}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(line.version_a_total, 'XOF')}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(line.version_b_total, 'XOF')}
                      </TableCell>
                      <TableCell className={cn('text-right', varianceColor(line.variance_total, 'receipt'))}>
                        {formatCurrency(line.variance_total, 'XOF')}
                      </TableCell>
                      <TableCell className={cn('text-right', varianceColor(line.variance_total, 'receipt'))}>
                        {line.variance_pct_total !== null
                          ? `${line.variance_pct_total > 0 ? '+' : ''}${line.variance_pct_total.toFixed(1)}%`
                          : '-'}
                      </TableCell>
                    </TableRow>
                  ))}

                  {/* Disbursements */}
                  <TableRow className="bg-muted/50">
                    <TableCell colSpan={5} className="font-bold">
                      {t('comparison.disbursements', 'Disbursements')}
                    </TableCell>
                  </TableRow>
                  {disbursementLines.map((line) => (
                    <TableRow key={`disbursement-${line.category}`}>
                      <TableCell className="pl-6">{line.category}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(line.version_a_total, 'XOF')}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(line.version_b_total, 'XOF')}
                      </TableCell>
                      <TableCell className={cn('text-right', varianceColor(line.variance_total, 'disbursement'))}>
                        {formatCurrency(line.variance_total, 'XOF')}
                      </TableCell>
                      <TableCell className={cn('text-right', varianceColor(line.variance_total, 'disbursement'))}>
                        {line.variance_pct_total !== null
                          ? `${line.variance_pct_total > 0 ? '+' : ''}${line.variance_pct_total.toFixed(1)}%`
                          : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell className="font-bold">
                      {t('comparison.total_variance_receipts', 'Total Variance Receipts')}
                    </TableCell>
                    <TableCell colSpan={2} />
                    <TableCell className={cn('text-right font-bold', totalVarianceReceipts >= 0 ? 'text-green-600' : 'text-red-600')}>
                      {formatCurrency(totalVarianceReceipts, 'XOF')}
                    </TableCell>
                    <TableCell />
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-bold">
                      {t('comparison.total_variance_disbursements', 'Total Variance Disbursements')}
                    </TableCell>
                    <TableCell colSpan={2} />
                    <TableCell className={cn('text-right font-bold', totalVarianceDisbursements <= 0 ? 'text-green-600' : 'text-red-600')}>
                      {formatCurrency(totalVarianceDisbursements, 'XOF')}
                    </TableCell>
                    <TableCell />
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
