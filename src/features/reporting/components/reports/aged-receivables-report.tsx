'use client';

import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line,
  PieChart, Pie, Cell,
} from 'recharts';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { CurrencyDisplay } from '@/components/shared/currency-display';
import { cn } from '@/lib/utils';
import {
  AlertTriangle, TrendingUp, TrendingDown, Users, Send, FileText,
  ChevronDown, ChevronRight,
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface AgedReceivable {
  id: string;
  zone: string;
  counterparty: string;
  not_due: number;
  days_1_30: number;
  days_31_60: number;
  days_61_90: number;
  over_90: number;
  total: number;
  probability: number;
  score: number | null;
  status: 'normal' | 'late' | 'litigious' | 'contentieux' | 'irrecoverable' | 'vacant';
  reminderStep: number | null;
}

// ============================================================================
// MOCK DATA
// ============================================================================

const MOCK_RECEIVABLES: AgedReceivable[] = [
  // Zone A
  { id: '1', zone: 'Zone A', counterparty: 'ZARA CI', not_due: 2_478_000, days_1_30: 0, days_31_60: 0, days_61_90: 0, over_90: 0, total: 2_478_000, probability: 94, score: 87, status: 'normal', reminderStep: null },
  { id: '2', zone: 'Zone A', counterparty: 'CARREFOUR Market', not_due: 2_124_000, days_1_30: 1_800_000, days_31_60: 0, days_61_90: 0, over_90: 0, total: 3_924_000, probability: 92, score: 78, status: 'late', reminderStep: 1 },
  { id: '3', zone: 'Zone A', counterparty: 'MTN Boutique', not_due: 3_775_200, days_1_30: 0, days_31_60: 3_200_000, days_61_90: 0, over_90: 0, total: 6_975_200, probability: 71, score: 61, status: 'late', reminderStep: 2 },
  { id: '4', zone: 'Zone A', counterparty: 'Orange CI', not_due: 1_770_000, days_1_30: 0, days_31_60: 0, days_61_90: 0, over_90: 0, total: 1_770_000, probability: 98, score: 88, status: 'normal', reminderStep: null },
  { id: '5', zone: 'Zone A', counterparty: 'Local A-12 (vacant)', not_due: 0, days_1_30: 0, days_31_60: 0, days_61_90: 0, over_90: 0, total: 0, probability: 0, score: null, status: 'vacant', reminderStep: null },
  // Zone B
  { id: '6', zone: 'Zone B', counterparty: 'Banque Atlantique', not_due: 5_500_000, days_1_30: 0, days_31_60: 0, days_61_90: 0, over_90: 0, total: 5_500_000, probability: 98, score: 94, status: 'normal', reminderStep: null },
  { id: '7', zone: 'Zone B', counterparty: 'Total Energies', not_due: 2_800_000, days_1_30: 0, days_31_60: 0, days_61_90: 0, over_90: 0, total: 2_800_000, probability: 96, score: 86, status: 'normal', reminderStep: null },
  { id: '8', zone: 'Zone B', counterparty: 'CFAO Motors', not_due: 2_360_000, days_1_30: 0, days_31_60: 0, days_61_90: 2_800_000, over_90: 0, total: 5_160_000, probability: 65, score: 55, status: 'litigious', reminderStep: 3 },
  // Contentieux
  { id: '9', zone: 'Contentieux', counterparty: 'MY PLACE', not_due: 0, days_1_30: 0, days_31_60: 0, days_61_90: 0, over_90: 24_800_000, total: 24_800_000, probability: 0, score: 12, status: 'contentieux', reminderStep: 4 },
  { id: '10', zone: 'Contentieux', counterparty: 'ADEAL SA', not_due: 0, days_1_30: 0, days_31_60: 0, days_61_90: 0, over_90: 8_400_000, total: 8_400_000, probability: 0, score: 8, status: 'contentieux', reminderStep: 4 },
  // Autres
  { id: '11', zone: 'Autres', counterparty: 'Regularisation charges', not_due: 0, days_1_30: 2_400_000, days_31_60: 0, days_61_90: 0, over_90: 0, total: 2_400_000, probability: 85, score: null, status: 'late', reminderStep: 1 },
  { id: '12', zone: 'Autres', counterparty: 'Droits entree (att.)', not_due: 5_000_000, days_1_30: 0, days_31_60: 0, days_61_90: 0, over_90: 0, total: 5_000_000, probability: 90, score: null, status: 'normal', reminderStep: null },
];

const DSO_HISTORY = [
  { month: 'Avr 25', dso: 28 }, { month: 'Mai', dso: 29 }, { month: 'Jun', dso: 30 },
  { month: 'Jul', dso: 31 }, { month: 'Aou', dso: 30 }, { month: 'Sep', dso: 32 },
  { month: 'Oct', dso: 33 }, { month: 'Nov', dso: 34 }, { month: 'Dec', dso: 35 },
  { month: 'Jan 26', dso: 35 }, { month: 'Fev', dso: 36 }, { month: 'Mar', dso: 38 },
];

const bucketColors: Record<string, string> = {
  not_due: '#e5e7eb', days_1_30: '#fef08a', days_31_60: '#fdba74',
  days_61_90: '#f97316', over_90: '#ef4444',
};

const statusConfig: Record<string, { label: string; cls: string }> = {
  normal: { label: 'Normal', cls: 'text-green-700 bg-green-50' },
  late: { label: 'En retard', cls: 'text-orange-700 bg-orange-50' },
  litigious: { label: 'Litigieux', cls: 'text-red-700 bg-red-50' },
  contentieux: { label: 'Contentieux', cls: 'text-red-800 bg-red-100 italic' },
  irrecoverable: { label: 'Irrecouv.', cls: 'text-gray-500 bg-gray-100 line-through' },
  vacant: { label: 'Vacant', cls: 'text-gray-400 bg-gray-50' },
};

// ============================================================================
// COMPONENT
// ============================================================================

export function AgedReceivablesReport() {
  const { t } = useTranslation();
  const [view, setView] = useState<string>('standard');
  const [expandedZones, setExpandedZones] = useState<Set<string>>(new Set(['Zone A', 'Zone B', 'Contentieux', 'Autres']));

  const toggleZone = (zone: string) => {
    setExpandedZones(prev => {
      const next = new Set(prev);
      if (next.has(zone)) next.delete(zone);
      else next.add(zone);
      return next;
    });
  };

  // Group by zone
  const zones = useMemo(() => {
    const map = new Map<string, AgedReceivable[]>();
    for (const r of MOCK_RECEIVABLES) {
      if (!map.has(r.zone)) map.set(r.zone, []);
      map.get(r.zone)!.push(r);
    }
    return map;
  }, []);

  // Summary
  const summary = useMemo(() => {
    const totals = { not_due: 0, d1_30: 0, d31_60: 0, d61_90: 0, over_90: 0, total: 0 };
    for (const r of MOCK_RECEIVABLES) {
      totals.not_due += r.not_due;
      totals.d1_30 += r.days_1_30;
      totals.d31_60 += r.days_31_60;
      totals.d61_90 += r.days_61_90;
      totals.over_90 += r.over_90;
      totals.total += r.total;
    }
    const healthy = totals.not_due + totals.d1_30;
    const atRisk = totals.d31_60 + totals.d61_90;
    const critical = totals.over_90;
    const recoverable = MOCK_RECEIVABLES.reduce((s, r) => s + r.total * r.probability / 100, 0);
    const lateCount = MOCK_RECEIVABLES.filter(r => r.status !== 'normal' && r.status !== 'vacant').length;
    return { ...totals, healthy, atRisk, critical, recoverable, lateCount };
  }, []);

  // Chart data
  const bucketChart = [
    { name: 'Non echu', value: summary.not_due, color: '#e5e7eb' },
    { name: '1-30j', value: summary.d1_30, color: '#fef08a' },
    { name: '31-60j', value: summary.d31_60, color: '#fdba74' },
    { name: '61-90j', value: summary.d61_90, color: '#f97316' },
    { name: '>90j', value: summary.over_90, color: '#ef4444' },
  ];

  const top5 = [...MOCK_RECEIVABLES]
    .filter(r => r.total > 0 && r.status !== 'vacant')
    .sort((a, b) => (b.days_1_30 + b.days_31_60 + b.days_61_90 + b.over_90) - (a.days_1_30 + a.days_31_60 + a.days_61_90 + a.over_90))
    .slice(0, 5)
    .map(r => ({ name: r.counterparty, amount: r.total - r.not_due }));

  function fmtPct(val: number, total: number) {
    return total > 0 ? `${(val / total * 100).toFixed(1)}%` : '—';
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-2">
        <Badge variant="outline">Au 31/03/2026</Badge>
        <Badge variant="outline">Cosmos Yopougon SA</Badge>
        <div className="flex-1" />
        <Select value={view} onValueChange={setView}>
          <SelectTrigger className="w-[160px] h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="standard">Vue standard</SelectItem>
            <SelectItem value="recouvrement">Vue recouvrement</SelectItem>
            <SelectItem value="critique">Vue critique</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPI Summary */}
      <div className="grid gap-3 md:grid-cols-5">
        <Card>
          <CardContent className="p-3">
            <p className="text-[10px] text-muted-foreground">Total creances</p>
            <p className="text-lg font-bold"><CurrencyDisplay amount={summary.total} currency="XOF" /></p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <p className="text-[10px] text-muted-foreground">Saines (&lt;30j)</p>
            <p className="text-lg font-bold text-green-600">{fmtPct(summary.healthy, summary.total)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <p className="text-[10px] text-muted-foreground">A risque (30-90j)</p>
            <p className="text-lg font-bold text-orange-500">{fmtPct(summary.atRisk, summary.total)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <p className="text-[10px] text-muted-foreground">Critiques (&gt;90j)</p>
            <p className="text-lg font-bold text-red-600">{fmtPct(summary.critical, summary.total)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <p className="text-[10px] text-muted-foreground">DSO</p>
            <p className="text-lg font-bold">38 jours <span className="text-xs text-orange-500">+8 vs budget</span></p>
          </CardContent>
        </Card>
      </div>

      {/* Charts row */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Pie chart */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Repartition par tranche</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={bucketChart} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {bucketChart.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={(v: number) => `${(v / 100).toLocaleString('fr-FR')} FCFA`} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* DSO trend */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Evolution DSO (12 mois)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={DSO_HISTORY}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis domain={[20, 45]} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Line type="monotone" dataKey="dso" stroke="#171717" strokeWidth={2} dot={{ r: 2 }} name="DSO (jours)" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top 5 debtors */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Top 5 debiteurs en retard</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={top5} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={(v: number) => `${(v / 1_000_000).toFixed(0)}M`} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={120} />
              <Tooltip formatter={(v: number) => `${(v / 100).toLocaleString('fr-FR')} FCFA`} />
              <Bar dataKey="amount" fill="#ef4444" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Main aged table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Balance agee des creances</CardTitle>
          <CardDescription>Par zone et par locataire — montants en FCFA</CardDescription>
        </CardHeader>
        <CardContent className="overflow-auto">
          <Table>
            <TableHeader>
              <TableRow className="text-xs">
                <TableHead className="min-w-[200px]">Locataire</TableHead>
                <TableHead className="text-right bg-gray-50">Non echu</TableHead>
                <TableHead className="text-right bg-yellow-50">1-30j</TableHead>
                <TableHead className="text-right bg-orange-50">31-60j</TableHead>
                <TableHead className="text-right bg-orange-100">61-90j</TableHead>
                <TableHead className="text-right bg-red-50">&gt;90j</TableHead>
                <TableHead className="text-right font-bold">TOTAL</TableHead>
                <TableHead className="text-center">Prob.</TableHead>
                <TableHead className="text-center">Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...zones.entries()].map(([zone, items]) => {
                const isExpanded = expandedZones.has(zone);
                const zoneTotal = items.reduce((s, r) => s + r.total, 0);
                const zoneNotDue = items.reduce((s, r) => s + r.not_due, 0);
                const zoneD130 = items.reduce((s, r) => s + r.days_1_30, 0);
                const zoneD3160 = items.reduce((s, r) => s + r.days_31_60, 0);
                const zoneD6190 = items.reduce((s, r) => s + r.days_61_90, 0);
                const zoneOver90 = items.reduce((s, r) => s + r.over_90, 0);

                return (
                  <>
                    {/* Zone header */}
                    <TableRow key={zone} className="bg-muted/40 cursor-pointer hover:bg-muted/60" onClick={() => toggleZone(zone)}>
                      <TableCell className="font-semibold text-sm" colSpan={1}>
                        <div className="flex items-center gap-1">
                          {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                          {zone}
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-xs font-medium">{zoneNotDue > 0 ? <CurrencyDisplay amount={zoneNotDue} currency="XOF" /> : '—'}</TableCell>
                      <TableCell className="text-right text-xs font-medium">{zoneD130 > 0 ? <CurrencyDisplay amount={zoneD130} currency="XOF" /> : '—'}</TableCell>
                      <TableCell className="text-right text-xs font-medium">{zoneD3160 > 0 ? <CurrencyDisplay amount={zoneD3160} currency="XOF" /> : '—'}</TableCell>
                      <TableCell className="text-right text-xs font-medium">{zoneD6190 > 0 ? <CurrencyDisplay amount={zoneD6190} currency="XOF" /> : '—'}</TableCell>
                      <TableCell className="text-right text-xs font-medium">{zoneOver90 > 0 ? <CurrencyDisplay amount={zoneOver90} currency="XOF" /> : '—'}</TableCell>
                      <TableCell className="text-right text-xs font-bold"><CurrencyDisplay amount={zoneTotal} currency="XOF" /></TableCell>
                      <TableCell />
                      <TableCell />
                    </TableRow>

                    {/* Zone items */}
                    {isExpanded && items.map(r => {
                      const cfg = statusConfig[r.status];
                      return (
                        <TableRow key={r.id} className={cn('text-xs', r.status === 'contentieux' && 'bg-red-50/30 italic', r.status === 'vacant' && 'text-gray-400')}>
                          <TableCell className="pl-8">{r.counterparty}</TableCell>
                          <TableCell className="text-right">{r.not_due > 0 ? <CurrencyDisplay amount={r.not_due} currency="XOF" /> : '—'}</TableCell>
                          <TableCell className={cn('text-right', r.days_1_30 > 0 && 'text-yellow-700 bg-yellow-50/50')}>{r.days_1_30 > 0 ? <CurrencyDisplay amount={r.days_1_30} currency="XOF" /> : '—'}</TableCell>
                          <TableCell className={cn('text-right', r.days_31_60 > 0 && 'text-orange-600 bg-orange-50/50')}>{r.days_31_60 > 0 ? <CurrencyDisplay amount={r.days_31_60} currency="XOF" /> : '—'}</TableCell>
                          <TableCell className={cn('text-right', r.days_61_90 > 0 && 'text-orange-700 bg-orange-100/50')}>{r.days_61_90 > 0 ? <CurrencyDisplay amount={r.days_61_90} currency="XOF" /> : '—'}</TableCell>
                          <TableCell className={cn('text-right', r.over_90 > 0 && 'text-red-600 bg-red-50/50 font-medium')}>{r.over_90 > 0 ? <CurrencyDisplay amount={r.over_90} currency="XOF" /> : '—'}</TableCell>
                          <TableCell className="text-right font-medium"><CurrencyDisplay amount={r.total} currency="XOF" /></TableCell>
                          <TableCell className="text-center">
                            {r.probability > 0 ? (
                              <span className={cn('text-xs font-medium', r.probability >= 90 ? 'text-green-600' : r.probability >= 70 ? 'text-orange-500' : 'text-red-600')}>
                                {r.probability}%
                              </span>
                            ) : '—'}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge className={cn('text-[9px] px-1.5 py-0', cfg.cls)}>{cfg.label}</Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </>
                );
              })}

              {/* Grand total */}
              <TableRow className="font-bold border-t-2 bg-muted/20">
                <TableCell>TOTAL GENERAL</TableCell>
                <TableCell className="text-right"><CurrencyDisplay amount={summary.not_due} currency="XOF" /></TableCell>
                <TableCell className="text-right"><CurrencyDisplay amount={summary.d1_30} currency="XOF" /></TableCell>
                <TableCell className="text-right"><CurrencyDisplay amount={summary.d31_60} currency="XOF" /></TableCell>
                <TableCell className="text-right"><CurrencyDisplay amount={summary.d61_90} currency="XOF" /></TableCell>
                <TableCell className="text-right"><CurrencyDisplay amount={summary.over_90} currency="XOF" /></TableCell>
                <TableCell className="text-right"><CurrencyDisplay amount={summary.total} currency="XOF" /></TableCell>
                <TableCell className="text-center text-xs">{fmtPct(summary.recoverable, summary.total)}</TableCell>
                <TableCell />
              </TableRow>
              <TableRow className="text-xs text-muted-foreground">
                <TableCell>En % du total</TableCell>
                <TableCell className="text-right">{fmtPct(summary.not_due, summary.total)}</TableCell>
                <TableCell className="text-right">{fmtPct(summary.d1_30, summary.total)}</TableCell>
                <TableCell className="text-right">{fmtPct(summary.d31_60, summary.total)}</TableCell>
                <TableCell className="text-right">{fmtPct(summary.d61_90, summary.total)}</TableCell>
                <TableCell className="text-right">{fmtPct(summary.over_90, summary.total)}</TableCell>
                <TableCell className="text-right">100%</TableCell>
                <TableCell /><TableCell />
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
