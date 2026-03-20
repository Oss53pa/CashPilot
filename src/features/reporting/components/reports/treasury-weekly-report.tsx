'use client';

import { useTranslation } from 'react-i18next';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';
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

interface WeeklyRow {
  week: string;
  opening: number;
  receipts: number;
  disbursements: number;
  net_flow: number;
  closing: number;
}

function generateMockWeeks(): WeeklyRow[] {
  const weeks: WeeklyRow[] = [];
  let balance = 285_000_000;

  const baseDate = new Date('2026-03-23');

  for (let i = 0; i < 13; i++) {
    const weekStart = new Date(baseDate);
    weekStart.setDate(baseDate.getDate() + i * 7);
    const weekLabel = `W${i + 1} (${weekStart.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })})`;

    const opening = balance;
    const receipts = 28_000_000 + Math.round(Math.random() * 18_000_000);
    const disbursements = 22_000_000 + Math.round(Math.random() * 15_000_000);
    const netFlow = receipts - disbursements;
    const closing = opening + netFlow;
    balance = closing;

    weeks.push({ week: weekLabel, opening, receipts, disbursements, net_flow: netFlow, closing });
  }

  return weeks;
}

const MOCK_WEEKS = generateMockWeeks();
const THRESHOLD = 200_000_000;

export function TreasuryWeeklyReport() {
  const { t } = useTranslation();

  const chartData = MOCK_WEEKS.map((w) => ({
    name: w.week,
    closing: w.closing,
    threshold: THRESHOLD,
  }));

  const minBalance = Math.min(...MOCK_WEEKS.map((w) => w.closing));
  const maxBalance = Math.max(...MOCK_WEEKS.map((w) => w.closing));
  const avgBalance = Math.round(
    MOCK_WEEKS.reduce((s, w) => s + w.closing, 0) / MOCK_WEEKS.length,
  );

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('reports.minBalance', 'Minimum Balance (13 weeks)')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${minBalance < THRESHOLD ? 'text-red-600' : ''}`}>
              <CurrencyDisplay amount={minBalance} currency="XOF" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('reports.maxBalance', 'Maximum Balance')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <CurrencyDisplay amount={maxBalance} currency="XOF" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('reports.avgBalance', 'Average Balance')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <CurrencyDisplay amount={avgBalance} currency="XOF" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Treasury line chart */}
      <Card>
        <CardHeader>
          <CardTitle>
            {t('reports.treasuryForecast13w', '13-Week Treasury Forecast')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="name" className="text-xs" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" height={60} />
              <YAxis className="text-xs" tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <ReferenceLine
                y={THRESHOLD}
                stroke="#ef4444"
                strokeDasharray="5 5"
                label={{ value: 'Threshold', position: 'insideTopLeft', fill: '#ef4444', fontSize: 12 }}
              />
              <Line
                type="monotone"
                dataKey="closing"
                stroke="#171717"
                name="Closing Balance"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 13-week table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {t('reports.weeklyDetail', '13-Week Detail')}
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('reports.week', 'Week')}</TableHead>
                <TableHead className="text-right">Opening</TableHead>
                <TableHead className="text-right">Receipts</TableHead>
                <TableHead className="text-right">Disbursements</TableHead>
                <TableHead className="text-right">Net Flow</TableHead>
                <TableHead className="text-right">Closing</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_WEEKS.map((row, idx) => (
                <TableRow
                  key={idx}
                  className={row.closing < THRESHOLD ? 'bg-red-50' : ''}
                >
                  <TableCell className="font-medium">{row.week}</TableCell>
                  <TableCell className="text-right">
                    <CurrencyDisplay amount={row.opening} currency="XOF" />
                  </TableCell>
                  <TableCell className="text-right text-green-600">
                    <CurrencyDisplay amount={row.receipts} currency="XOF" />
                  </TableCell>
                  <TableCell className="text-right text-red-600">
                    <CurrencyDisplay amount={row.disbursements} currency="XOF" />
                  </TableCell>
                  <TableCell className="text-right">
                    <CurrencyDisplay amount={row.net_flow} currency="XOF" colorize />
                  </TableCell>
                  <TableCell className={`text-right font-medium ${row.closing < THRESHOLD ? 'text-red-600' : ''}`}>
                    <CurrencyDisplay amount={row.closing} currency="XOF" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
