import { useTranslation } from 'react-i18next';
import { AlertTriangle, TrendingUp } from 'lucide-react';
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
} from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { cn, formatCurrency } from '@/lib/utils';
import { useCompanyStore } from '@/stores/company.store';
import { useFinancingPlan } from '../hooks/use-debt';

export function FinancingPlan() {
  const { t } = useTranslation();
  const currentCompany = useCompanyStore((s) => s.currentCompany);
  const companyId = currentCompany?.id;

  const { data: plan, isLoading } = useFinancingPlan(companyId);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (!plan) return null;

  const deficitYears = plan.years.filter((y) => y.balance < 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          {t('debt.financingPlan', 'Plan de Financement')}
        </CardTitle>
        <CardDescription>
          {t('debt.financingPlanDescription', 'Multi-year financing needs vs. resources analysis (FCFA)')}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {deficitYears.length > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>{t('debt.financingGap', 'Financing Gap Detected')}</AlertTitle>
            <AlertDescription>
              {deficitYears.map((y) => (
                <span key={y.year} className="mr-2">
                  {y.year}: {formatCurrency(y.balance, 'XOF')}
                </span>
              ))}
            </AlertDescription>
          </Alert>
        )}

        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[220px]" />
                {plan.years.map((y) => (
                  <TableHead key={y.year} className="text-right min-w-[160px]">
                    {y.year}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* NEEDS Section */}
              <TableRow className="bg-red-50/50 dark:bg-red-950/20 font-bold">
                <TableCell colSpan={plan.years.length + 1}>
                  {t('debt.needs', 'BESOINS (Needs)')}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="pl-6">{t('debt.capex', 'CAPEX')}</TableCell>
                {plan.years.map((y) => (
                  <TableCell key={y.year} className="text-right">
                    {formatCurrency(y.needs.capex, 'XOF')}
                  </TableCell>
                ))}
              </TableRow>
              <TableRow>
                <TableCell className="pl-6">{t('debt.loanRepayments', 'Loan Repayments')}</TableCell>
                {plan.years.map((y) => (
                  <TableCell key={y.year} className="text-right">
                    {formatCurrency(y.needs.loan_repayments, 'XOF')}
                  </TableCell>
                ))}
              </TableRow>
              <TableRow>
                <TableCell className="pl-6">{t('debt.workingCapital', 'Working Capital')}</TableCell>
                {plan.years.map((y) => (
                  <TableCell key={y.year} className="text-right">
                    {formatCurrency(y.needs.working_capital, 'XOF')}
                  </TableCell>
                ))}
              </TableRow>
              <TableRow className="font-bold border-t">
                <TableCell className="pl-6">{t('debt.totalNeeds', 'Total Needs')}</TableCell>
                {plan.years.map((y) => (
                  <TableCell key={y.year} className="text-right text-red-600">
                    {formatCurrency(y.needs.total, 'XOF')}
                  </TableCell>
                ))}
              </TableRow>

              {/* RESOURCES Section */}
              <TableRow className="bg-green-50/50 dark:bg-green-950/20 font-bold">
                <TableCell colSpan={plan.years.length + 1}>
                  {t('debt.resources', 'RESSOURCES (Resources)')}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="pl-6">{t('debt.operatingCF', 'Operating Cash Flow')}</TableCell>
                {plan.years.map((y) => (
                  <TableCell key={y.year} className="text-right">
                    {formatCurrency(y.resources.operating_cash_flow, 'XOF')}
                  </TableCell>
                ))}
              </TableRow>
              <TableRow>
                <TableCell className="pl-6">{t('debt.availableCash', 'Available Cash')}</TableCell>
                {plan.years.map((y) => (
                  <TableCell key={y.year} className="text-right">
                    {formatCurrency(y.resources.available_cash, 'XOF')}
                  </TableCell>
                ))}
              </TableRow>
              <TableRow>
                <TableCell className="pl-6">{t('debt.maturingInvestments', 'Maturing Investments')}</TableCell>
                {plan.years.map((y) => (
                  <TableCell key={y.year} className="text-right">
                    {formatCurrency(y.resources.maturing_investments, 'XOF')}
                  </TableCell>
                ))}
              </TableRow>
              <TableRow>
                <TableCell className="pl-6">{t('debt.creditLines', 'Credit Lines')}</TableCell>
                {plan.years.map((y) => (
                  <TableCell key={y.year} className="text-right">
                    {formatCurrency(y.resources.credit_lines, 'XOF')}
                  </TableCell>
                ))}
              </TableRow>
              <TableRow className="font-bold border-t">
                <TableCell className="pl-6">{t('debt.totalResources', 'Total Resources')}</TableCell>
                {plan.years.map((y) => (
                  <TableCell key={y.year} className="text-right text-green-600">
                    {formatCurrency(y.resources.total, 'XOF')}
                  </TableCell>
                ))}
              </TableRow>

              {/* BALANCE */}
              <TableRow className="bg-muted font-bold text-lg">
                <TableCell>{t('debt.balance', 'BALANCE (Surplus / Deficit)')}</TableCell>
                {plan.years.map((y) => (
                  <TableCell
                    key={y.year}
                    className={cn(
                      'text-right',
                      y.balance >= 0 ? 'text-green-600' : 'text-red-600'
                    )}
                  >
                    {formatCurrency(y.balance, 'XOF')}
                    {y.balance < 0 && (
                      <AlertTriangle className="ml-1 inline h-4 w-4" />
                    )}
                  </TableCell>
                ))}
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
