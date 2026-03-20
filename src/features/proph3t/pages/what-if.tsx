import { useState, useMemo } from 'react';
import {
  SlidersHorizontal, TrendingUp, TrendingDown, BarChart3, History, Calendar,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface WhatIfParams {
  recoveryRate: number;    // 50-100%
  paymentDelay: number;    // 0-60 days
  revenueChange: number;   // -30 to +30%
  expenseChange: number;   // -20 to +20%
  capexShift: number;      // -50 to +50%
}

interface HistoryEntry {
  id: string;
  label: string;
  date: string;
  netImpact: number;
}

// ---------------------------------------------------------------------------
// Base data
// ---------------------------------------------------------------------------

const baseMonthlyData = [
  { month: 'Avr', base: 42_000_000 },
  { month: 'Mai', base: 45_000_000 },
  { month: 'Jun', base: 38_000_000 },
  { month: 'Jul', base: 50_000_000 },
  { month: 'Aou', base: 35_000_000 },
  { month: 'Sep', base: 48_000_000 },
  { month: 'Oct', base: 52_000_000 },
  { month: 'Nov', base: 46_000_000 },
  { month: 'Dec', base: 55_000_000 },
];

const mockHistory: HistoryEntry[] = [
  { id: '1', label: 'Baisse recouvrement a 70%', date: '18 mars 2026', netImpact: -28_500_000 },
  { id: '2', label: 'CAPEX +30% renovation', date: '15 mars 2026', netImpact: -45_200_000 },
  { id: '3', label: 'Revenus +15% nouveaux baux', date: '12 mars 2026', netImpact: 32_000_000 },
  { id: '4', label: 'Delai paiement +30 jours', date: '10 mars 2026', netImpact: -18_000_000 },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatFCFA(amount: number) {
  const sign = amount >= 0 ? '+' : '';
  return sign + new Intl.NumberFormat('fr-FR', { style: 'decimal', maximumFractionDigits: 0 }).format(amount) + ' FCFA';
}

function computeModified(base: number, params: WhatIfParams): number {
  const recoveryFactor = params.recoveryRate / 85; // 85% is baseline
  const delayPenalty = 1 - (params.paymentDelay / 200);
  const revenueFactor = 1 + params.revenueChange / 100;
  const expenseFactor = 1 + params.expenseChange / 100;
  const capexFactor = 1 + params.capexShift / 100;

  const revenue = base * 0.6 * recoveryFactor * delayPenalty * revenueFactor;
  const expenses = base * 0.35 * expenseFactor;
  const capex = base * 0.05 * capexFactor;

  return Math.round(revenue - expenses - capex);
}

// ---------------------------------------------------------------------------
// Slider component
// ---------------------------------------------------------------------------

function ParamSlider({
  label, value, min, max, step, unit, onChange,
}: {
  label: string; value: number; min: number; max: number; step: number; unit: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">{label}</label>
        <span className="text-sm font-bold tabular-nums">
          {value > 0 && unit !== '%' ? '+' : ''}{value}{unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-foreground"
      />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{min}{unit}</span>
        <span>{max}{unit}</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function WhatIf() {
  const [params, setParams] = useState<WhatIfParams>({
    recoveryRate: 85,
    paymentDelay: 0,
    revenueChange: 0,
    expenseChange: 0,
    capexShift: 0,
  });

  const update = (key: keyof WhatIfParams) => (value: number) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  };

  // Compute chart data
  const chartData = useMemo(() => {
    return baseMonthlyData.map((d) => ({
      month: d.month,
      base: d.base,
      modifie: computeModified(d.base, params),
    }));
  }, [params]);

  // Impact summary
  const impact = useMemo(() => {
    const diffs = chartData.map((d) => d.modifie - d.base);
    const total = diffs.reduce((s, v) => s + v, 0);
    const worst = Math.min(...diffs);
    const best = Math.max(...diffs);
    const worstMonth = chartData[diffs.indexOf(worst)]?.month || '';
    const bestMonth = chartData[diffs.indexOf(best)]?.month || '';
    return { total, worst, worstMonth, best, bestMonth };
  }, [chartData]);

  const isModified = params.recoveryRate !== 85 || params.paymentDelay !== 0 || params.revenueChange !== 0 || params.expenseChange !== 0 || params.capexShift !== 0;

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <PageHeader title="Simulation What-If" description="Simulez l'impact de variations sur votre tresorerie previsionnelle" />

      <div className="grid gap-6 lg:grid-cols-[350px_1fr]">
        {/* Parameter Panel */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <SlidersHorizontal className="h-4 w-4" />
                Parametres de simulation
              </CardTitle>
              <CardDescription>Ajustez les curseurs pour voir l'impact en temps reel</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <ParamSlider
                label="Taux de recouvrement"
                value={params.recoveryRate}
                min={50} max={100} step={1} unit="%"
                onChange={update('recoveryRate')}
              />
              <ParamSlider
                label="Delai de paiement moyen"
                value={params.paymentDelay}
                min={0} max={60} step={5} unit="j"
                onChange={update('paymentDelay')}
              />
              <ParamSlider
                label="Variation revenus"
                value={params.revenueChange}
                min={-30} max={30} step={1} unit="%"
                onChange={update('revenueChange')}
              />
              <ParamSlider
                label="Variation depenses"
                value={params.expenseChange}
                min={-20} max={20} step={1} unit="%"
                onChange={update('expenseChange')}
              />
              <ParamSlider
                label="Decalage CAPEX"
                value={params.capexShift}
                min={-50} max={50} step={5} unit="%"
                onChange={update('capexShift')}
              />
            </CardContent>
          </Card>

          {/* Session History */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <History className="h-4 w-4" />
                Historique des simulations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {mockHistory.map((h) => (
                <div key={h.id} className="flex items-center justify-between rounded border px-3 py-2 text-sm">
                  <div>
                    <p className="font-medium">{h.label}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {h.date}
                    </p>
                  </div>
                  <span className={`text-sm font-bold ${h.netImpact >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatFCFA(h.netImpact)}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right: Chart + Impact */}
        <div className="space-y-4">
          {/* Impact Summary Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Impact net total</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-muted-foreground" />
                  <span className={`text-xl font-bold ${isModified ? (impact.total >= 0 ? 'text-green-600' : 'text-red-600') : ''}`}>
                    {isModified ? formatFCFA(impact.total) : '0 FCFA'}
                  </span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Pire mois</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-red-500" />
                  <div>
                    <span className="text-xl font-bold text-red-600">{isModified ? formatFCFA(impact.worst) : '-'}</span>
                    {isModified && <span className="text-xs text-muted-foreground ml-2">({impact.worstMonth})</span>}
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Meilleur mois</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  <div>
                    <span className="text-xl font-bold text-green-600">{isModified ? formatFCFA(impact.best) : '-'}</span>
                    {isModified && <span className="text-xs text-muted-foreground ml-2">({impact.bestMonth})</span>}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Chart: base vs modified */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Comparaison Base vs Scenario modifie</CardTitle>
              <CardDescription>
                {isModified
                  ? 'Les parametres ont ete modifies — le scenario ajuste est affiche en couleur.'
                  : 'Ajustez les curseurs pour comparer avec le scenario de base.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={380}>
                <AreaChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => `${(v / 1_000_000).toFixed(0)}M`} />
                  <Tooltip formatter={(value: number) => new Intl.NumberFormat('fr-FR').format(value) + ' FCFA'} />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="base"
                    stroke="#a3a3a3"
                    fill="#a3a3a3"
                    fillOpacity={0.12}
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    name="Scenario de base"
                  />
                  <Area
                    type="monotone"
                    dataKey="modifie"
                    stroke={impact.total >= 0 ? '#22c55e' : '#ef4444'}
                    fill={impact.total >= 0 ? '#22c55e' : '#ef4444'}
                    fillOpacity={0.15}
                    strokeWidth={2}
                    name="Scenario modifie"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
