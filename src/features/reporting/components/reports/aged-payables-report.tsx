'use client';

import { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CurrencyDisplay } from '@/components/shared/currency-display';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronRight, AlertTriangle } from 'lucide-react';

// ============================================================================
// TYPES + MOCK DATA
// ============================================================================

interface AgedPayable {
  id: string;
  category: string;
  supplier: string;
  not_due: number;
  days_1_15: number;
  days_16_30: number;
  days_31_60: number;
  over_60: number;
  total: number;
  penalties: number;
  priority: 'normal' | 'due' | 'late' | 'critical' | 'paid' | 'future';
  dueDate?: string;
}

const MOCK_PAYABLES: AgedPayable[] = [
  // Exploitation
  { id: '1', category: 'Exploitation', supplier: 'Prestataire Securite', not_due: 4_956_000, days_1_15: 0, days_16_30: 0, days_31_60: 0, over_60: 0, total: 4_956_000, penalties: 0, priority: 'normal' },
  { id: '2', category: 'Exploitation', supplier: 'CIE Cote d\'Ivoire', not_due: 3_658_000, days_1_15: 0, days_16_30: 0, days_31_60: 0, over_60: 0, total: 3_658_000, penalties: 0, priority: 'normal' },
  { id: '3', category: 'Exploitation', supplier: 'SODECI Eau', not_due: 1_298_000, days_1_15: 1_298_000, days_16_30: 0, days_31_60: 0, over_60: 0, total: 2_596_000, penalties: 0, priority: 'due' },
  { id: '4', category: 'Exploitation', supplier: 'Nettoyage Pro', not_due: 2_124_000, days_1_15: 0, days_16_30: 0, days_31_60: 0, over_60: 0, total: 2_124_000, penalties: 0, priority: 'normal' },
  { id: '5', category: 'Exploitation', supplier: 'Cabinet Conseil X', not_due: 0, days_1_15: 0, days_16_30: 3_500_000, days_31_60: 0, over_60: 0, total: 3_500_000, penalties: 17_500, priority: 'late' },
  { id: '6', category: 'Exploitation', supplier: 'Assurance multirisque', not_due: 8_400_000, days_1_15: 0, days_16_30: 0, days_31_60: 0, over_60: 0, total: 8_400_000, penalties: 0, priority: 'normal' },
  // Personnel
  { id: '7', category: 'Personnel', supplier: 'Salaires avril 2026', not_due: 28_400_000, days_1_15: 0, days_16_30: 0, days_31_60: 0, over_60: 0, total: 28_400_000, penalties: 0, priority: 'future', dueDate: '25/04' },
  // Fiscal
  { id: '8', category: 'Fiscal', supplier: 'TVA mars 2026', not_due: 7_200_000, days_1_15: 0, days_16_30: 0, days_31_60: 0, over_60: 0, total: 7_200_000, penalties: 0, priority: 'normal', dueDate: '15/04' },
  { id: '9', category: 'Fiscal', supplier: 'Acompte IS (juin)', not_due: 4_800_000, days_1_15: 0, days_16_30: 0, days_31_60: 0, over_60: 0, total: 4_800_000, penalties: 0, priority: 'future', dueDate: '15/06' },
  { id: '10', category: 'Fiscal', supplier: 'Patente 2026', not_due: 0, days_1_15: 0, days_16_30: 0, days_31_60: 2_400_000, over_60: 0, total: 2_400_000, penalties: 96_000, priority: 'late' },
  // CAPEX
  { id: '11', category: 'CAPEX', supplier: 'Entrepreneur ABC — Sit. 2', not_due: 28_000_000, days_1_15: 0, days_16_30: 0, days_31_60: 0, over_60: 0, total: 28_000_000, penalties: 0, priority: 'normal', dueDate: '15/04' },
  { id: '12', category: 'CAPEX', supplier: 'Retenue garantie (5%)', not_due: -1_400_000, days_1_15: 0, days_16_30: 0, days_31_60: 0, over_60: 0, total: -1_400_000, penalties: 0, priority: 'normal' },
  { id: '13', category: 'CAPEX', supplier: 'Fournisseur equipements', not_due: 0, days_1_15: 0, days_16_30: 0, days_31_60: 8_400_000, over_60: 0, total: 8_400_000, penalties: 42_000, priority: 'late' },
  // Dette
  { id: '14', category: 'Service dette', supplier: 'SGBCI Emprunt — Avril', not_due: 9_850_000, days_1_15: 0, days_16_30: 0, days_31_60: 0, over_60: 0, total: 9_850_000, penalties: 0, priority: 'normal', dueDate: '01/04' },
  // Restitutions
  { id: '15', category: 'Restitutions', supplier: 'Depot garantie Locataire X', not_due: 5_800_000, days_1_15: 0, days_16_30: 0, days_31_60: 0, over_60: 0, total: 5_800_000, penalties: 0, priority: 'future', dueDate: '30/07' },
  { id: '16', category: 'Restitutions', supplier: 'Avoir locataire Y', not_due: 0, days_1_15: 350_000, days_16_30: 0, days_31_60: 0, over_60: 0, total: 350_000, penalties: 0, priority: 'due' },
];

const priorityConfig: Record<string, { label: string; cls: string }> = {
  normal: { label: 'Normal', cls: 'text-green-700 bg-green-50' },
  due: { label: 'Echu', cls: 'text-yellow-700 bg-yellow-50' },
  late: { label: 'En retard', cls: 'text-orange-700 bg-orange-50' },
  critical: { label: 'Critique', cls: 'text-red-800 bg-red-100' },
  paid: { label: 'Paye', cls: 'text-gray-500 bg-gray-50' },
  future: { label: 'Futur', cls: 'text-blue-600 bg-blue-50' },
};

const NATURE_COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#6b7280'];

// ============================================================================
// COMPONENT
// ============================================================================

export function AgedPayablesReport() {
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set(['Exploitation', 'Fiscal', 'CAPEX', 'Service dette', 'Personnel', 'Restitutions']));

  const toggleCat = (cat: string) => {
    setExpandedCats(prev => { const n = new Set(prev); n.has(cat) ? n.delete(cat) : n.add(cat); return n; });
  };

  const categories = useMemo(() => {
    const map = new Map<string, AgedPayable[]>();
    for (const p of MOCK_PAYABLES) {
      if (!map.has(p.category)) map.set(p.category, []);
      map.get(p.category)!.push(p);
    }
    return map;
  }, []);

  const summary = useMemo(() => {
    const t = { not_due: 0, d1_15: 0, d16_30: 0, d31_60: 0, over_60: 0, total: 0, penalties: 0 };
    for (const p of MOCK_PAYABLES) {
      t.not_due += p.not_due; t.d1_15 += p.days_1_15; t.d16_30 += p.days_16_30;
      t.d31_60 += p.days_31_60; t.over_60 += p.over_60; t.total += p.total; t.penalties += p.penalties;
    }
    const lateCount = MOCK_PAYABLES.filter(p => p.priority === 'late' || p.priority === 'critical').length;
    const urgentAmount = MOCK_PAYABLES.filter(p => p.priority === 'due' || (p.dueDate && p.priority === 'normal')).reduce((s, p) => s + p.total, 0);
    return { ...t, lateCount, urgentAmount };
  }, []);

  const natureData = [...categories.entries()].map(([name, items], i) => ({
    name, value: items.reduce((s, p) => s + p.total, 0), color: NATURE_COLORS[i % NATURE_COLORS.length],
  }));

  function fmtPct(val: number, total: number) { return total > 0 ? `${(val / total * 100).toFixed(1)}%` : '—'; }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Badge variant="outline">Au 31/03/2026</Badge>
        <Badge variant="outline">Cosmos Yopougon SA</Badge>
      </div>

      {/* KPIs */}
      <div className="grid gap-3 md:grid-cols-5">
        <Card><CardContent className="p-3"><p className="text-[10px] text-muted-foreground">Total dettes</p><p className="text-lg font-bold"><CurrencyDisplay amount={summary.total} currency="XOF" /></p></CardContent></Card>
        <Card><CardContent className="p-3"><p className="text-[10px] text-muted-foreground">Non echu</p><p className="text-lg font-bold text-green-600">{fmtPct(summary.not_due, summary.total)}</p></CardContent></Card>
        <Card><CardContent className="p-3"><p className="text-[10px] text-muted-foreground">En retard</p><p className="text-lg font-bold text-orange-500">{summary.lateCount} dossiers</p></CardContent></Card>
        <Card><CardContent className="p-3"><p className="text-[10px] text-muted-foreground">Penalites encourues</p><p className="text-lg font-bold text-red-600"><CurrencyDisplay amount={summary.penalties} currency="XOF" /></p></CardContent></Card>
        <Card><CardContent className="p-3"><p className="text-[10px] text-muted-foreground">DPO</p><p className="text-lg font-bold">42 jours <span className="text-xs text-orange-500">+4 vs cible</span></p></CardContent></Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Repartition par nature</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={natureData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {natureData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={(v: number) => `${(v / 100).toLocaleString('fr-FR')} FCFA`} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Decaissements urgents (&lt;15j)</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {MOCK_PAYABLES.filter(p => p.days_1_15 > 0 || (p.dueDate && p.priority !== 'future')).slice(0, 5).map(p => (
                <div key={p.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    {p.priority === 'due' && <AlertTriangle className="h-3 w-3 text-yellow-600" />}
                    <span>{p.supplier}</span>
                    {p.dueDate && <Badge variant="outline" className="text-[9px]">{p.dueDate}</Badge>}
                  </div>
                  <span className="font-medium text-red-600"><CurrencyDisplay amount={p.total} currency="XOF" /></span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Balance agee des dettes</CardTitle>
          <CardDescription>Par nature et par fournisseur — montants en FCFA</CardDescription>
        </CardHeader>
        <CardContent className="overflow-auto">
          <Table>
            <TableHeader>
              <TableRow className="text-xs">
                <TableHead className="min-w-[200px]">Fournisseur</TableHead>
                <TableHead className="text-right bg-gray-50">A venir</TableHead>
                <TableHead className="text-right bg-yellow-50">1-15j</TableHead>
                <TableHead className="text-right bg-orange-50">16-30j</TableHead>
                <TableHead className="text-right bg-orange-100">31-60j</TableHead>
                <TableHead className="text-right bg-red-50">&gt;60j</TableHead>
                <TableHead className="text-right font-bold">TOTAL</TableHead>
                <TableHead className="text-right">Penalites</TableHead>
                <TableHead className="text-center">Priorite</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...categories.entries()].map(([cat, items]) => {
                const isExpanded = expandedCats.has(cat);
                const catTotal = items.reduce((s, p) => s + p.total, 0);
                return (
                  <>
                    <TableRow key={cat} className="bg-muted/40 cursor-pointer hover:bg-muted/60" onClick={() => toggleCat(cat)}>
                      <TableCell className="font-semibold text-sm" colSpan={1}>
                        <div className="flex items-center gap-1">
                          {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                          {cat}
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-xs font-medium"><CurrencyDisplay amount={items.reduce((s, p) => s + p.not_due, 0)} currency="XOF" /></TableCell>
                      <TableCell className="text-right text-xs">{items.reduce((s, p) => s + p.days_1_15, 0) > 0 ? <CurrencyDisplay amount={items.reduce((s, p) => s + p.days_1_15, 0)} currency="XOF" /> : '—'}</TableCell>
                      <TableCell className="text-right text-xs">{items.reduce((s, p) => s + p.days_16_30, 0) > 0 ? <CurrencyDisplay amount={items.reduce((s, p) => s + p.days_16_30, 0)} currency="XOF" /> : '—'}</TableCell>
                      <TableCell className="text-right text-xs">{items.reduce((s, p) => s + p.days_31_60, 0) > 0 ? <CurrencyDisplay amount={items.reduce((s, p) => s + p.days_31_60, 0)} currency="XOF" /> : '—'}</TableCell>
                      <TableCell className="text-right text-xs">{items.reduce((s, p) => s + p.over_60, 0) > 0 ? <CurrencyDisplay amount={items.reduce((s, p) => s + p.over_60, 0)} currency="XOF" /> : '—'}</TableCell>
                      <TableCell className="text-right text-xs font-bold"><CurrencyDisplay amount={catTotal} currency="XOF" /></TableCell>
                      <TableCell className="text-right text-xs">{items.reduce((s, p) => s + p.penalties, 0) > 0 ? <CurrencyDisplay amount={items.reduce((s, p) => s + p.penalties, 0)} currency="XOF" /> : '—'}</TableCell>
                      <TableCell />
                    </TableRow>
                    {isExpanded && items.map(p => {
                      const cfg = priorityConfig[p.priority];
                      return (
                        <TableRow key={p.id} className="text-xs">
                          <TableCell className="pl-8">
                            {p.supplier}
                            {p.dueDate && <span className="text-[10px] text-muted-foreground ml-1">({p.dueDate})</span>}
                          </TableCell>
                          <TableCell className="text-right">{p.not_due !== 0 ? <CurrencyDisplay amount={p.not_due} currency="XOF" /> : '—'}</TableCell>
                          <TableCell className={cn('text-right', p.days_1_15 > 0 && 'text-yellow-700 bg-yellow-50/50')}>{p.days_1_15 > 0 ? <CurrencyDisplay amount={p.days_1_15} currency="XOF" /> : '—'}</TableCell>
                          <TableCell className={cn('text-right', p.days_16_30 > 0 && 'text-orange-600 bg-orange-50/50')}>{p.days_16_30 > 0 ? <CurrencyDisplay amount={p.days_16_30} currency="XOF" /> : '—'}</TableCell>
                          <TableCell className={cn('text-right', p.days_31_60 > 0 && 'text-orange-700 bg-orange-100/50')}>{p.days_31_60 > 0 ? <CurrencyDisplay amount={p.days_31_60} currency="XOF" /> : '—'}</TableCell>
                          <TableCell className={cn('text-right', p.over_60 > 0 && 'text-red-600 bg-red-50/50')}>{p.over_60 > 0 ? <CurrencyDisplay amount={p.over_60} currency="XOF" /> : '—'}</TableCell>
                          <TableCell className="text-right font-medium"><CurrencyDisplay amount={p.total} currency="XOF" /></TableCell>
                          <TableCell className={cn('text-right', p.penalties > 0 && 'text-red-600')}>{p.penalties > 0 ? <CurrencyDisplay amount={p.penalties} currency="XOF" /> : '—'}</TableCell>
                          <TableCell className="text-center"><Badge className={cn('text-[9px] px-1.5 py-0', cfg.cls)}>{cfg.label}</Badge></TableCell>
                        </TableRow>
                      );
                    })}
                  </>
                );
              })}

              <TableRow className="font-bold border-t-2 bg-muted/20">
                <TableCell>TOTAL GENERAL</TableCell>
                <TableCell className="text-right"><CurrencyDisplay amount={summary.not_due} currency="XOF" /></TableCell>
                <TableCell className="text-right"><CurrencyDisplay amount={summary.d1_15} currency="XOF" /></TableCell>
                <TableCell className="text-right"><CurrencyDisplay amount={summary.d16_30} currency="XOF" /></TableCell>
                <TableCell className="text-right"><CurrencyDisplay amount={summary.d31_60} currency="XOF" /></TableCell>
                <TableCell className="text-right"><CurrencyDisplay amount={summary.over_60} currency="XOF" /></TableCell>
                <TableCell className="text-right"><CurrencyDisplay amount={summary.total} currency="XOF" /></TableCell>
                <TableCell className="text-right text-red-600"><CurrencyDisplay amount={summary.penalties} currency="XOF" /></TableCell>
                <TableCell />
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
