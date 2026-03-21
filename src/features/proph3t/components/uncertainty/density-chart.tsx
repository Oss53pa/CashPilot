import { useState, useMemo } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import type { UncertaintyDistribution } from './uncertainty-types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatFCFA(amount: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'decimal', maximumFractionDigits: 0 }).format(amount) + ' FCFA';
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface DensityChartProps {
  distribution: UncertaintyDistribution;
  availableDates?: string[];
  onDateChange?: (date: string) => void;
  threshold?: number;
  height?: number;
}

export function DensityChart({
  distribution,
  availableDates,
  onDateChange,
  threshold,
  height = 300,
}: DensityChartProps) {
  const [selectedDate, setSelectedDate] = useState(distribution.target_date);

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    onDateChange?.(date);
  };

  const dates = availableDates || [
    '2026-03-28', '2026-04-04', '2026-04-11', '2026-04-15', '2026-04-20',
  ];

  // Mark points within 80% credible interval
  const chartData = useMemo(() =>
    distribution.density_points.map((p) => ({
      x: p.x,
      y: p.y,
      inCI80: p.x >= distribution.credible_interval_80[0] && p.x <= distribution.credible_interval_80[1]
        ? p.y : 0,
    })),
    [distribution]
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Distribution de probabilite</CardTitle>
            <CardDescription>Densite de la prevision pour la date selectionnee</CardDescription>
          </div>
          <Select value={selectedDate} onValueChange={handleDateChange}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Date" />
            </SelectTrigger>
            <SelectContent>
              {dates.map((d) => (
                <SelectItem key={d} value={d}>{d}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <AreaChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="x"
              type="number"
              domain={['dataMin', 'dataMax']}
              tick={{ fontSize: 10 }}
              tickFormatter={(v: number) => `${(v / 1_000_000).toFixed(0)}M`}
            />
            <YAxis
              tick={{ fontSize: 10 }}
              tickFormatter={(v: number) => v.toExponential(1)}
            />
            <Tooltip
              formatter={(value: number, name: string) => {
                if (name === 'inCI80') return [value.toExponential(3), 'IC 80%'];
                return [value.toExponential(3), 'Densite'];
              }}
              labelFormatter={(label: number) => formatFCFA(label)}
            />

            {/* Full density */}
            <Area
              type="monotone"
              dataKey="y"
              stroke="#6366f1"
              fill="#6366f1"
              fillOpacity={0.1}
              strokeWidth={2}
              name="Densite"
              dot={false}
            />

            {/* 80% CI shaded area */}
            <Area
              type="monotone"
              dataKey="inCI80"
              stroke="none"
              fill="#6366f1"
              fillOpacity={0.25}
              name="IC 80%"
              dot={false}
            />

            {/* Central forecast line */}
            <ReferenceLine
              x={distribution.central}
              stroke="#171717"
              strokeWidth={2}
              label={{ value: 'Central', position: 'top', fill: '#171717', fontSize: 11 }}
            />

            {/* Threshold line */}
            {threshold && (
              <ReferenceLine
                x={threshold}
                stroke="#ef4444"
                strokeDasharray="6 3"
                strokeWidth={1.5}
                label={{ value: 'Seuil', position: 'top', fill: '#ef4444', fontSize: 11 }}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>

        <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
          <span>Centrale: <strong className="text-foreground">{formatFCFA(distribution.central)}</strong></span>
          <span>Ecart-type: <strong className="text-foreground">{formatFCFA(distribution.std_dev)}</strong></span>
          <span>IC 80%: <strong className="text-foreground">{formatFCFA(distribution.credible_interval_80[0])} - {formatFCFA(distribution.credible_interval_80[1])}</strong></span>
          <span>MC Dropout: <strong className="text-foreground">{distribution.mc_dropout_samples} passes</strong></span>
        </div>
      </CardContent>
    </Card>
  );
}
