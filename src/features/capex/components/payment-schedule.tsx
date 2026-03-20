import { useTranslation } from 'react-i18next';
import { AlertTriangle, CheckCircle2, Clock, FileText, Receipt } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CurrencyDisplay } from '@/components/shared/currency-display';

import type { CapexPaymentSchedule as PaymentScheduleType, PaymentLabel, PaymentStatus } from '../types';

interface PaymentScheduleProps {
  payments: PaymentScheduleType[];
  currency: string;
  totalBudget: number;
}

const LABEL_MAP: Record<PaymentLabel, string> = {
  advance: 'Avance',
  progress_1: 'Situation 1',
  progress_2: 'Situation 2',
  final: 'Solde Final',
  retention: 'Retenue de Garantie',
};

const STATUS_CONFIG: Record<PaymentStatus, { icon: React.ElementType; color: string; badgeVariant: string }> = {
  scheduled: { icon: Clock, color: 'text-muted-foreground', badgeVariant: 'secondary' },
  invoiced: { icon: FileText, color: 'text-blue-500', badgeVariant: 'default' },
  paid: { icon: CheckCircle2, color: 'text-green-500', badgeVariant: 'success' },
  overdue: { icon: AlertTriangle, color: 'text-red-500', badgeVariant: 'destructive' },
};

function SlippageIndicator({ dueDate }: { dueDate: string }) {
  const today = new Date('2026-03-19');
  const due = new Date(dueDate);
  const daysLate = Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));

  if (daysLate <= 0) return null;

  return (
    <span className="inline-flex items-center gap-1 text-xs text-red-600 font-medium">
      <AlertTriangle className="h-3 w-3" />
      +{daysLate}j retard
    </span>
  );
}

export function PaymentSchedule({ payments, currency, totalBudget }: PaymentScheduleProps) {
  const { t } = useTranslation();

  const totalPaid = payments
    .filter((p) => p.status === 'paid')
    .reduce((sum, p) => sum + p.amount, 0);

  const totalScheduled = payments.reduce((sum, p) => sum + p.amount, 0);
  const progressPct = totalScheduled > 0 ? Math.round((totalPaid / totalScheduled) * 100) : 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            {t('capex.paymentSchedule', 'Payment Schedule')}
          </CardTitle>
          <div className="flex items-center gap-3">
            <div className="text-sm text-muted-foreground">
              <CurrencyDisplay amount={totalPaid} currency={currency} /> /{' '}
              <CurrencyDisplay amount={totalScheduled} currency={currency} />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 mt-2">
          <Progress value={progressPct} className="flex-1" />
          <span className="text-sm font-medium w-12 text-right">{progressPct}%</span>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('capex.paymentLabel', 'Echeance')}</TableHead>
              <TableHead className="text-right">{t('common.amount', 'Montant')}</TableHead>
              <TableHead>{t('capex.dueDate', 'Date prevue')}</TableHead>
              <TableHead>{t('capex.actualDate', 'Date reelle')}</TableHead>
              <TableHead>{t('common.status', 'Statut')}</TableHead>
              <TableHead>{t('capex.invoiceRef', 'Ref. facture')}</TableHead>
              <TableHead>{t('capex.slippage', 'Glissement')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.map((payment) => {
              const statusConfig = STATUS_CONFIG[payment.status];
              const StatusIcon = statusConfig.icon;

              return (
                <TableRow key={payment.id}>
                  <TableCell className="font-medium">
                    {LABEL_MAP[payment.label] ?? payment.label}
                  </TableCell>
                  <TableCell className="text-right">
                    <CurrencyDisplay amount={payment.amount} currency={currency} />
                  </TableCell>
                  <TableCell className="text-sm">
                    {new Date(payment.due_date).toLocaleDateString('fr-FR')}
                  </TableCell>
                  <TableCell className="text-sm">
                    {payment.actual_date
                      ? new Date(payment.actual_date).toLocaleDateString('fr-FR')
                      : '-'}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={statusConfig.badgeVariant as 'default' | 'secondary' | 'destructive'}
                      className="gap-1"
                    >
                      <StatusIcon className="h-3 w-3" />
                      {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm font-mono text-muted-foreground">
                    {payment.invoice_reference ?? '-'}
                  </TableCell>
                  <TableCell>
                    {payment.status === 'overdue' && (
                      <SlippageIndicator dueDate={payment.due_date} />
                    )}
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
