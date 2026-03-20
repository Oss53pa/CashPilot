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
import { CurrencyDisplay } from '@/components/shared/currency-display';
import { TreasuryLineChart } from '@/components/charts/treasury-line-chart';

interface CollectionRow {
  counterparty: string;
  amount_due: number;
  amount_collected: number;
  recovery_rate: number;
  dso: number;
}

const MOCK_DATA: CollectionRow[] = [
  { counterparty: 'SONATEL SA', amount_due: 23_800_000, amount_collected: 21_500_000, recovery_rate: 90.3, dso: 28 },
  { counterparty: 'Orange CI', amount_due: 27_800_000, amount_collected: 22_200_000, recovery_rate: 79.9, dso: 42 },
  { counterparty: 'Ecobank Togo', amount_due: 12_900_000, amount_collected: 10_400_000, recovery_rate: 80.6, dso: 35 },
  { counterparty: 'BCEAO', amount_due: 45_000_000, amount_collected: 45_000_000, recovery_rate: 100.0, dso: 15 },
  { counterparty: 'CFAO Motors', amount_due: 28_200_000, amount_collected: 16_800_000, recovery_rate: 59.6, dso: 68 },
  { counterparty: 'Bolloré Transport', amount_due: 15_400_000, amount_collected: 14_200_000, recovery_rate: 92.2, dso: 22 },
];

const DSO_TREND = [
  { date: 'Jan', receipts: 32, disbursements: 0, net: 32 },
  { date: 'Feb', receipts: 35, disbursements: 0, net: 35 },
  { date: 'Mar', receipts: 30, disbursements: 0, net: 30 },
  { date: 'Apr', receipts: 28, disbursements: 0, net: 28 },
  { date: 'May', receipts: 33, disbursements: 0, net: 33 },
  { date: 'Jun', receipts: 31, disbursements: 0, net: 31 },
];

export function CollectionReport() {
  const { t } = useTranslation();

  const totalDue = MOCK_DATA.reduce((s, r) => s + r.amount_due, 0);
  const totalCollected = MOCK_DATA.reduce((s, r) => s + r.amount_collected, 0);
  const globalRate = totalDue > 0 ? (totalCollected / totalDue) * 100 : 0;
  const avgDso = Math.round(MOCK_DATA.reduce((s, r) => s + r.dso, 0) / MOCK_DATA.length);

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('reports.globalRecoveryRate', 'Global Recovery Rate')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {globalRate.toFixed(1)}%
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('reports.averageDso', 'Average DSO')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgDso} days</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('reports.outstandingBalance', 'Outstanding Balance')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              <CurrencyDisplay amount={totalDue - totalCollected} currency="XOF" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Collection table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {t('reports.recoveryByCounterparty', 'Recovery Rate by Counterparty')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('reports.counterparty', 'Counterparty')}</TableHead>
                <TableHead className="text-right">
                  {t('reports.amountDue', 'Amount Due')}
                </TableHead>
                <TableHead className="text-right">
                  {t('reports.amountCollected', 'Amount Collected')}
                </TableHead>
                <TableHead className="text-right">
                  {t('reports.rate', 'Rate %')}
                </TableHead>
                <TableHead className="text-right">DSO</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_DATA.map((row, idx) => (
                <TableRow key={idx}>
                  <TableCell className="font-medium">{row.counterparty}</TableCell>
                  <TableCell className="text-right">
                    <CurrencyDisplay amount={row.amount_due} currency="XOF" />
                  </TableCell>
                  <TableCell className="text-right">
                    <CurrencyDisplay amount={row.amount_collected} currency="XOF" />
                  </TableCell>
                  <TableCell
                    className={`text-right font-medium ${
                      row.recovery_rate >= 90
                        ? 'text-green-600'
                        : row.recovery_rate >= 70
                          ? 'text-amber-600'
                          : 'text-red-600'
                    }`}
                  >
                    {row.recovery_rate.toFixed(1)}%
                  </TableCell>
                  <TableCell className="text-right">{row.dso}d</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* DSO Trend */}
      <Card>
        <CardHeader>
          <CardTitle>{t('reports.dsoTrend', 'DSO Trend (Monthly Average)')}</CardTitle>
        </CardHeader>
        <CardContent>
          <TreasuryLineChart data={DSO_TREND} height={250} />
        </CardContent>
      </Card>
    </div>
  );
}
