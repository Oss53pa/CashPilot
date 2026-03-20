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
import { Badge } from '@/components/ui/badge';
import { CurrencyDisplay } from '@/components/shared/currency-display';
import { formatDate } from '@/lib/utils';

interface TaxRow {
  type: string;
  period: string;
  amount: number;
  due_date: string;
  status: 'upcoming' | 'paid' | 'overdue' | 'contested';
  paid_date: string | null;
}

const MOCK_DATA: TaxRow[] = [
  { type: 'TVA (VAT)', period: 'Jan 2026', amount: 18_500_000, due_date: '2026-02-20', status: 'paid', paid_date: '2026-02-18' },
  { type: 'TVA (VAT)', period: 'Feb 2026', amount: 21_200_000, due_date: '2026-03-20', status: 'paid', paid_date: '2026-03-17' },
  { type: 'TVA (VAT)', period: 'Mar 2026', amount: 19_800_000, due_date: '2026-04-20', status: 'upcoming', paid_date: null },
  { type: 'Impôt sur les sociétés', period: 'Q4 2025', amount: 45_000_000, due_date: '2026-03-31', status: 'upcoming', paid_date: null },
  { type: 'Retenue à la source', period: 'Feb 2026', amount: 8_700_000, due_date: '2026-03-15', status: 'paid', paid_date: '2026-03-14' },
  { type: 'Retenue à la source', period: 'Mar 2026', amount: 9_100_000, due_date: '2026-04-15', status: 'upcoming', paid_date: null },
  { type: 'Charges sociales', period: 'Feb 2026', amount: 14_300_000, due_date: '2026-03-10', status: 'paid', paid_date: '2026-03-09' },
  { type: 'Charges sociales', period: 'Mar 2026', amount: 14_800_000, due_date: '2026-04-10', status: 'upcoming', paid_date: null },
  { type: 'Patente', period: 'Annual 2026', amount: 6_500_000, due_date: '2026-03-31', status: 'overdue', paid_date: null },
  { type: 'Droits de douane', period: 'Feb 2026', amount: 12_400_000, due_date: '2026-03-05', status: 'paid', paid_date: '2026-03-04' },
];

const UPCOMING_CALENDAR: { month: string; obligations: { type: string; due_date: string; amount: number }[] }[] = [
  {
    month: 'April 2026',
    obligations: [
      { type: 'TVA (VAT)', due_date: '2026-04-20', amount: 19_800_000 },
      { type: 'Retenue à la source', due_date: '2026-04-15', amount: 9_100_000 },
      { type: 'Charges sociales', due_date: '2026-04-10', amount: 14_800_000 },
    ],
  },
  {
    month: 'May 2026',
    obligations: [
      { type: 'TVA (VAT)', due_date: '2026-05-20', amount: 20_500_000 },
      { type: 'Retenue à la source', due_date: '2026-05-15', amount: 9_300_000 },
      { type: 'Charges sociales', due_date: '2026-05-10', amount: 15_100_000 },
    ],
  },
  {
    month: 'June 2026',
    obligations: [
      { type: 'TVA (VAT)', due_date: '2026-06-20', amount: 22_000_000 },
      { type: 'Retenue à la source', due_date: '2026-06-15', amount: 9_500_000 },
      { type: 'Charges sociales', due_date: '2026-06-10', amount: 15_400_000 },
      { type: 'Impôt sur les sociétés (acompte)', due_date: '2026-06-30', amount: 22_500_000 },
    ],
  },
];

const statusVariants: Record<string, 'default' | 'secondary' | 'destructive' | 'success'> = {
  upcoming: 'default',
  paid: 'success',
  overdue: 'destructive',
  contested: 'secondary',
};

export function FiscalReport() {
  const { t } = useTranslation();

  // Summary by tax type
  const typeMap = new Map<string, { total: number; paid: number; count: number }>();
  MOCK_DATA.forEach((row) => {
    const existing = typeMap.get(row.type) ?? { total: 0, paid: 0, count: 0 };
    existing.total += row.amount;
    if (row.status === 'paid') existing.paid += row.amount;
    existing.count += 1;
    typeMap.set(row.type, existing);
  });

  const totalAmount = MOCK_DATA.reduce((s, r) => s + r.amount, 0);
  const totalPaid = MOCK_DATA.filter((r) => r.status === 'paid').reduce((s, r) => s + r.amount, 0);
  const overdueCount = MOCK_DATA.filter((r) => r.status === 'overdue').length;

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('reports.totalObligations', 'Total Obligations')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <CurrencyDisplay amount={totalAmount} currency="XOF" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-600">
              {t('reports.totalPaid', 'Total Paid')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              <CurrencyDisplay amount={totalPaid} currency="XOF" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-amber-600">
              {t('reports.pending', 'Pending')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              <CurrencyDisplay amount={totalAmount - totalPaid} currency="XOF" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-600">
              {t('reports.overdueItems', 'Overdue Items')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{overdueCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tax obligations table */}
      <Card>
        <CardHeader>
          <CardTitle>{t('reports.taxObligations', 'Tax Obligations')}</CardTitle>
        </CardHeader>
        <CardContent className="overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('reports.taxType', 'Tax Type')}</TableHead>
                <TableHead>{t('reports.period', 'Period')}</TableHead>
                <TableHead className="text-right">{t('reports.amount', 'Amount')}</TableHead>
                <TableHead>{t('reports.dueDate', 'Due Date')}</TableHead>
                <TableHead>{t('reports.status', 'Status')}</TableHead>
                <TableHead>{t('reports.paidDate', 'Paid Date')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_DATA.map((row, idx) => (
                <TableRow key={idx} className={row.status === 'overdue' ? 'bg-red-50' : ''}>
                  <TableCell className="font-medium">{row.type}</TableCell>
                  <TableCell>{row.period}</TableCell>
                  <TableCell className="text-right">
                    <CurrencyDisplay amount={row.amount} currency="XOF" />
                  </TableCell>
                  <TableCell>{formatDate(row.due_date)}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariants[row.status]}>
                      {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>{row.paid_date ? formatDate(row.paid_date) : '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Summary by tax type */}
      <Card>
        <CardHeader>
          <CardTitle>{t('reports.summaryByType', 'Summary by Tax Type')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('reports.taxType', 'Tax Type')}</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Paid</TableHead>
                <TableHead className="text-right">Outstanding</TableHead>
                <TableHead className="text-right">Count</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from(typeMap.entries()).map(([type, data]) => (
                <TableRow key={type}>
                  <TableCell className="font-medium">{type}</TableCell>
                  <TableCell className="text-right">
                    <CurrencyDisplay amount={data.total} currency="XOF" />
                  </TableCell>
                  <TableCell className="text-right text-green-600">
                    <CurrencyDisplay amount={data.paid} currency="XOF" />
                  </TableCell>
                  <TableCell className="text-right text-amber-600">
                    <CurrencyDisplay amount={data.total - data.paid} currency="XOF" />
                  </TableCell>
                  <TableCell className="text-right">{data.count}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Upcoming 3 months calendar */}
      <Card>
        <CardHeader>
          <CardTitle>{t('reports.upcomingCalendar', 'Upcoming 3 Months — Tax Calendar')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {UPCOMING_CALENDAR.map((month) => (
              <div key={month.month}>
                <h4 className="mb-2 font-semibold">{month.month}</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('reports.taxType', 'Tax Type')}</TableHead>
                      <TableHead>{t('reports.dueDate', 'Due Date')}</TableHead>
                      <TableHead className="text-right">{t('reports.estimatedAmount', 'Estimated Amount')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {month.obligations.map((ob, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{ob.type}</TableCell>
                        <TableCell>{formatDate(ob.due_date)}</TableCell>
                        <TableCell className="text-right">
                          <CurrencyDisplay amount={ob.amount} currency="XOF" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
