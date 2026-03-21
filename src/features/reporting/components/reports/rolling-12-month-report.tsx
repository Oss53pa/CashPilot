'use client';

import { useTranslation } from 'react-i18next';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine,
} from 'recharts';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CurrencyDisplay } from '@/components/shared/currency-display';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// ============================================================================
// Rolling 12-Month Forecast Table
// ============================================================================

interface MonthData {
  month: string;
  label: string;
  isPast: boolean;
  receipts: number;
  disbursements: number;
  capex: number;
  debtService: number;
  netFlow: number;
  opening: number;
  closing: number;
}

function generateRolling12(): MonthData[] {
  const months: MonthData[] = [];
  const now = new Date();
  let balance = 130_823_700;

  for (let i = 0; i < 12; i++) {
    const d = new Date(now);
    d.setMonth(d.getMonth() + i);
    const label = d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
    const monthKey = d.toISOString().slice(0, 7);
    const isPast = i === 0; // only current month is partially past

    const opening = balance;
    const receipts = 33_275_000 + Math.round(Math.sin(i * 0.8) * 5_000_000 + Math.random() * 3_000_000);
    const disbursements = 25_800_000 + Math.round(Math.cos(i * 0.6) * 3_000_000 + Math.random() * 2_000_000);
    const capex = i === 3 || i === 4 || i === 5 ? 12_000_000 + Math.round(Math.random() * 8_000_000) : Math.round(Math.random() * 3_000_000);
    const debtService = 9_850_000;

    const netFlow = receipts - disbursements - capex - debtService;
    const closing = opening + netFlow;
    balance = closing;

    months.push({ month: monthKey, label, isPast, receipts, disbursements, capex, debtService, netFlow, opening, closing });
  }

  return months;
}

const THRESHOLD = 50_000_000;

export function Rolling12MonthReport() {
  const { t } = useTranslation();
  const data = generateRolling12();

  const minClosing = Math.min(...data.map(d => d.closing));
  const maxClosing = Math.max(...data.map(d => d.closing));
  const avgClosing = Math.round(data.reduce((s, d) => s + d.closing, 0) / data.length);
  const totalNetFlow = data.reduce((s, d) => s + d.netFlow, 0);

  const chartData = data.map(d => ({
    name: d.label,
    position: d.closing,
    encaissements: d.receipts,
    decaissements: -(d.disbursements + d.capex + d.debtService),
    seuil: THRESHOLD,
  }));

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Badge variant="outline">12 mois glissants</Badge>
        <Badge variant="outline">
          {data[0].label} — {data[11].label}
        </Badge>
      </div>

      {/* KPIs */}
      <div className="grid gap-3 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs text-muted-foreground">Position minimum</CardTitle>
          </CardHeader>
          <CardContent>
            <span className={cn('text-lg font-bold', minClosing < THRESHOLD && 'text-red-600')}>
              <CurrencyDisplay amount={minClosing} currency="XOF" />
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs text-muted-foreground">Position maximum</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-lg font-bold">
              <CurrencyDisplay amount={maxClosing} currency="XOF" />
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs text-muted-foreground">Position moyenne</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-lg font-bold">
              <CurrencyDisplay amount={avgClosing} currency="XOF" />
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs text-muted-foreground">Flux net cumule 12 mois</CardTitle>
          </CardHeader>
          <CardContent>
            <span className={cn('text-lg font-bold', totalNetFlow < 0 ? 'text-red-600' : 'text-green-600')}>
              <CurrencyDisplay amount={totalNetFlow} currency="XOF" colorize />
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Position de tresorerie — 12 mois glissants</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={(v: number) => `${(v / 1_000_000).toFixed(0)}M`} />
              <Tooltip formatter={(v: number) => `${new Intl.NumberFormat('fr-FR').format(v)} FCFA`} />
              <Legend />
              <ReferenceLine y={THRESHOLD} stroke="#ef4444" strokeDasharray="5 5" label={{ value: 'Seuil', fill: '#ef4444', fontSize: 10 }} />
              <Area type="monotone" dataKey="position" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} strokeWidth={2} name="Position" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Detail table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Detail mensuel</CardTitle>
        </CardHeader>
        <CardContent className="overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mois</TableHead>
                <TableHead className="text-right">Ouverture</TableHead>
                <TableHead className="text-right">Encaissements</TableHead>
                <TableHead className="text-right">Decaissements</TableHead>
                <TableHead className="text-right">CAPEX</TableHead>
                <TableHead className="text-right">Service dette</TableHead>
                <TableHead className="text-right">Flux net</TableHead>
                <TableHead className="text-right">Cloture</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row, idx) => (
                <TableRow key={idx} className={cn(row.closing < THRESHOLD && 'bg-red-50')}>
                  <TableCell className={cn('font-medium', row.isPast && 'text-muted-foreground')}>
                    {row.label}
                    {row.isPast && <Badge variant="secondary" className="ml-1 text-[9px]">en cours</Badge>}
                  </TableCell>
                  <TableCell className="text-right"><CurrencyDisplay amount={row.opening} currency="XOF" /></TableCell>
                  <TableCell className="text-right text-green-600"><CurrencyDisplay amount={row.receipts} currency="XOF" /></TableCell>
                  <TableCell className="text-right text-red-600"><CurrencyDisplay amount={row.disbursements} currency="XOF" /></TableCell>
                  <TableCell className="text-right text-red-600"><CurrencyDisplay amount={row.capex} currency="XOF" /></TableCell>
                  <TableCell className="text-right text-red-600"><CurrencyDisplay amount={row.debtService} currency="XOF" /></TableCell>
                  <TableCell className="text-right"><CurrencyDisplay amount={row.netFlow} currency="XOF" colorize /></TableCell>
                  <TableCell className={cn('text-right font-medium', row.closing < THRESHOLD && 'text-red-600')}>
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
