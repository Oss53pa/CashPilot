import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, AlertTriangle } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CurrencyDisplay } from '@/components/shared/currency-display';
import { useCompanyStore } from '@/stores/company.store';
import { useReconciliation } from '../hooks/use-audit-trail';

export function ReconciliationView() {
  const { t } = useTranslation('audit-trail');
  const currentCompany = useCompanyStore((s) => s.currentCompany);
  const companyId = currentCompany?.id ?? '';

  const now = new Date();
  const defaultPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const [period, setPeriod] = useState(defaultPeriod);

  const { data: recon, isLoading } = useReconciliation(companyId, period);

  return (
    <div className="space-y-6">
      {/* Period selector */}
      <div className="space-y-1.5">
        <Label>{t('period', 'Period')}</Label>
        <Input
          type="month"
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="w-48"
        />
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Loading...
          </CardContent>
        </Card>
      ) : recon ? (
        <>
          {/* Status banner */}
          <Card
            className={
              recon.status === 'OK'
                ? 'border-green-500 bg-green-50'
                : 'border-red-500 bg-red-50'
            }
          >
            <CardContent className="flex items-center gap-3 py-4">
              {recon.status === 'OK' ? (
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              ) : (
                <AlertTriangle className="h-6 w-6 text-red-600" />
              )}
              <div className="flex-1">
                <p
                  className={`font-medium ${
                    recon.status === 'OK' ? 'text-green-700' : 'text-red-700'
                  }`}
                >
                  {recon.status === 'OK'
                    ? t('reconciliation_ok', 'Reconciliation OK — Variance is zero')
                    : t('reconciliation_blocked', 'BLOCKED — Investigation required')}
                </p>
              </div>
              <Badge variant={recon.status === 'OK' ? 'success' : 'destructive'}>
                {recon.status}
              </Badge>
            </CardContent>
          </Card>

          {/* Reconciliation equation */}
          <Card>
            <CardHeader>
              <CardTitle>
                {t('reconciliation_equation', 'Inter-Module Reconciliation')} — {period}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-muted-foreground">
                {t(
                  'equation_description',
                  'Opening Balance + Confirmed Receipts - Confirmed Disbursements + Incoming Transfers - Outgoing Transfers + Cash + Mobile Money - Gift Card Liabilities = Bank Position',
                )}
              </p>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[60%]">
                      {t('line_item', 'Line Item')}
                    </TableHead>
                    <TableHead className="text-right">
                      {t('amount', 'Amount (FCFA)')}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recon.lines.map((line, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{line.label}</TableCell>
                      <TableCell className="text-right">
                        <CurrencyDisplay
                          amount={line.amount}
                          currency="XOF"
                          colorize
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                  {/* Computed position */}
                  <TableRow className="border-t-2 font-bold">
                    <TableCell>
                      {t('computed_position', 'Computed Position')}
                    </TableCell>
                    <TableCell className="text-right">
                      <CurrencyDisplay
                        amount={recon.computed_position}
                        currency="XOF"
                      />
                    </TableCell>
                  </TableRow>
                  {/* Bank position */}
                  <TableRow className="font-bold">
                    <TableCell>
                      {t('bank_position', 'Bank Position')}
                    </TableCell>
                    <TableCell className="text-right">
                      <CurrencyDisplay
                        amount={recon.bank_position}
                        currency="XOF"
                      />
                    </TableCell>
                  </TableRow>
                  {/* Variance */}
                  <TableRow
                    className={`font-bold ${
                      recon.variance !== 0
                        ? 'bg-red-50 text-red-700'
                        : 'bg-green-50 text-green-700'
                    }`}
                  >
                    <TableCell>{t('variance', 'Variance')}</TableCell>
                    <TableCell className="text-right">
                      <CurrencyDisplay
                        amount={recon.variance}
                        currency="XOF"
                        colorize
                      />
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}
