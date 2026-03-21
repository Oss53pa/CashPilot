import { useMemo } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine,
} from 'recharts';
import type { FanChartPoint } from './uncertainty-types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatFCFA(amount: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'decimal', maximumFractionDigits: 0 }).format(amount) + ' FCFA';
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface FanChartProps {
  data: FanChartPoint[];
  threshold?: number;
  height?: number;
}

export function FanChart({ data, threshold = 50_000_000, height = 400 }: FanChartProps) {
  // Recharts stacked area requires "band" values for the intervals
  const chartData = useMemo(() =>
    data.map((p) => ({
      date: p.date,
      central: p.central,
      // We use ranges: area between lower and upper
      ci95_lower: p.ci95_lower,
      ci95_upper: p.ci95_upper,
      ci80_lower: p.ci80_lower,
      ci80_upper: p.ci80_upper,
    })),
    [data]
  );

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey="date" className="text-xs" tick={{ fontSize: 11 }} />
        <YAxis
          className="text-xs"
          tick={{ fontSize: 11 }}
          tickFormatter={(v: number) => `${(v / 1_000_000).toFixed(0)}M`}
        />
        <Tooltip
          formatter={(value: number, name: string) => {
            const labels: Record<string, string> = {
              central: 'Central',
              ci80_upper: 'IC 80% haut',
              ci80_lower: 'IC 80% bas',
              ci95_upper: 'IC 95% haut',
              ci95_lower: 'IC 95% bas',
            };
            return [formatFCFA(value), labels[name] || name];
          }}
        />
        <Legend
          payload={[
            { value: 'Central', type: 'line', color: '#171717' },
            { value: 'IC 80%', type: 'rect', color: 'rgba(59, 130, 246, 0.3)' },
            { value: 'IC 95%', type: 'rect', color: 'rgba(59, 130, 246, 0.12)' },
            { value: 'Seuil', type: 'line', color: '#ef4444' },
          ]}
        />

        {/* 95% credible interval band */}
        <Area
          type="monotone"
          dataKey="ci95_upper"
          stroke="none"
          fill="#3b82f6"
          fillOpacity={0.08}
          name="IC 95% haut"
          dot={false}
        />
        <Area
          type="monotone"
          dataKey="ci95_lower"
          stroke="none"
          fill="#ffffff"
          fillOpacity={0}
          name="IC 95% bas"
          dot={false}
        />

        {/* 80% credible interval band */}
        <Area
          type="monotone"
          dataKey="ci80_upper"
          stroke="none"
          fill="#3b82f6"
          fillOpacity={0.2}
          name="IC 80% haut"
          dot={false}
        />
        <Area
          type="monotone"
          dataKey="ci80_lower"
          stroke="none"
          fill="#ffffff"
          fillOpacity={0}
          name="IC 80% bas"
          dot={false}
        />

        {/* Central forecast line */}
        <Area
          type="monotone"
          dataKey="central"
          stroke="#171717"
          strokeWidth={2.5}
          fill="none"
          name="Central"
          dot={false}
        />

        {/* Threshold reference line */}
        {threshold && (
          <ReferenceLine
            y={threshold}
            stroke="#ef4444"
            strokeDasharray="8 4"
            strokeWidth={1.5}
            label={{ value: 'Seuil', position: 'right', fill: '#ef4444', fontSize: 11 }}
          />
        )}
      </AreaChart>
    </ResponsiveContainer>
  );
}
