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
import { CategoryPieChart } from '@/components/charts/category-pie-chart';

interface AgedReceivable {
  counterparty: string;
  current: number;
  days_1_30: number;
  days_31_60: number;
  days_61_90: number;
  days_over_90: number;
  total: number;
}

const MOCK_DATA: AgedReceivable[] = [
  { counterparty: 'SONATEL SA', current: 12_500_000, days_1_30: 8_200_000, days_31_60: 3_100_000, days_61_90: 0, days_over_90: 0, total: 23_800_000 },
  { counterparty: 'Orange CI', current: 18_000_000, days_1_30: 5_600_000, days_31_60: 2_400_000, days_61_90: 1_800_000, days_over_90: 0, total: 27_800_000 },
  { counterparty: 'Ecobank Togo', current: 6_300_000, days_1_30: 4_100_000, days_31_60: 0, days_61_90: 0, days_over_90: 2_500_000, total: 12_900_000 },
  { counterparty: 'BCEAO', current: 45_000_000, days_1_30: 0, days_31_60: 0, days_61_90: 0, days_over_90: 0, total: 45_000_000 },
  { counterparty: 'CFAO Motors', current: 3_200_000, days_1_30: 7_800_000, days_31_60: 5_400_000, days_61_90: 3_600_000, days_over_90: 8_200_000, total: 28_200_000 },
  { counterparty: 'Bolloré Transport', current: 9_700_000, days_1_30: 4_500_000, days_31_60: 1_200_000, days_61_90: 0, days_over_90: 0, total: 15_400_000 },
];

export function AgedReceivablesReport() {
  const { t } = useTranslation();

  const totals = MOCK_DATA.reduce(
    (acc, r) => ({
      current: acc.current + r.current,
      days_1_30: acc.days_1_30 + r.days_1_30,
      days_31_60: acc.days_31_60 + r.days_31_60,
      days_61_90: acc.days_61_90 + r.days_61_90,
      days_over_90: acc.days_over_90 + r.days_over_90,
      total: acc.total + r.total,
    }),
    { current: 0, days_1_30: 0, days_31_60: 0, days_61_90: 0, days_over_90: 0, total: 0 },
  );

  const pieData = [
    { name: 'Current', value: totals.current },
    { name: '1-30 days', value: totals.days_1_30 },
    { name: '31-60 days', value: totals.days_31_60 },
    { name: '61-90 days', value: totals.days_61_90 },
    { name: '>90 days', value: totals.days_over_90 },
  ].filter((d) => d.value > 0);

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('reports.totalReceivables', 'Total Receivables')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <CurrencyDisplay amount={totals.total} currency="XOF" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-600">
              {t('reports.current', 'Current (Not Due)')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              <CurrencyDisplay amount={totals.current} currency="XOF" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-600">
              {t('reports.overdue90', 'Overdue >90 days')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              <CurrencyDisplay amount={totals.days_over_90} currency="XOF" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Aging pie chart */}
        <Card>
          <CardHeader>
            <CardTitle>{t('reports.agingDistribution', 'Aging Distribution')}</CardTitle>
          </CardHeader>
          <CardContent>
            <CategoryPieChart data={pieData} height={300} />
          </CardContent>
        </Card>

        {/* Table */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>
              {t('reports.agedReceivablesByCounterparty', 'Aged Receivables by Counterparty')}
            </CardTitle>
          </CardHeader>
          <CardContent className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('reports.counterparty', 'Counterparty')}</TableHead>
                  <TableHead className="text-right">Current</TableHead>
                  <TableHead className="text-right">1-30d</TableHead>
                  <TableHead className="text-right">31-60d</TableHead>
                  <TableHead className="text-right">61-90d</TableHead>
                  <TableHead className="text-right">&gt;90d</TableHead>
                  <TableHead className="text-right font-bold">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {MOCK_DATA.map((row, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{row.counterparty}</TableCell>
                    <TableCell className="text-right">
                      <CurrencyDisplay amount={row.current} currency="XOF" />
                    </TableCell>
                    <TableCell className="text-right">
                      <CurrencyDisplay amount={row.days_1_30} currency="XOF" />
                    </TableCell>
                    <TableCell className="text-right">
                      <CurrencyDisplay amount={row.days_31_60} currency="XOF" />
                    </TableCell>
                    <TableCell className="text-right">
                      <CurrencyDisplay amount={row.days_61_90} currency="XOF" />
                    </TableCell>
                    <TableCell className="text-right">
                      <CurrencyDisplay amount={row.days_over_90} currency="XOF" />
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      <CurrencyDisplay amount={row.total} currency="XOF" />
                    </TableCell>
                  </TableRow>
                ))}
                {/* Total row */}
                <TableRow className="border-t-2 font-bold bg-muted/50">
                  <TableCell>TOTAL</TableCell>
                  <TableCell className="text-right">
                    <CurrencyDisplay amount={totals.current} currency="XOF" />
                  </TableCell>
                  <TableCell className="text-right">
                    <CurrencyDisplay amount={totals.days_1_30} currency="XOF" />
                  </TableCell>
                  <TableCell className="text-right">
                    <CurrencyDisplay amount={totals.days_31_60} currency="XOF" />
                  </TableCell>
                  <TableCell className="text-right">
                    <CurrencyDisplay amount={totals.days_61_90} currency="XOF" />
                  </TableCell>
                  <TableCell className="text-right">
                    <CurrencyDisplay amount={totals.days_over_90} currency="XOF" />
                  </TableCell>
                  <TableCell className="text-right">
                    <CurrencyDisplay amount={totals.total} currency="XOF" />
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
