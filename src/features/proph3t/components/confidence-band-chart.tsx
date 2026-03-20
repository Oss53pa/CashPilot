'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { formatAmount } from '@/lib/format';

interface ConfidenceBandDataPoint {
  date: string;
  actual?: number;
  central?: number;
  lower80?: number;
  upper80?: number;
  lower95?: number;
  upper95?: number;
}

interface ConfidenceBandChartProps {
  data: ConfidenceBandDataPoint[];
  height?: number;
  showLegend?: boolean;
  currency?: string;
}

export function ConfidenceBandChart({
  data,
  height = 350,
  showLegend = true,
  currency = 'XOF',
}: ConfidenceBandChartProps) {
  const formatValue = (value: number) => formatAmount(value / 100, currency);

  // Find the split point between actual and forecast
  const todayIdx = data.findIndex(d => d.central !== undefined && d.actual === undefined);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis
          dataKey="date"
          className="text-xs"
          tick={{ fontSize: 11 }}
          tickFormatter={(d) => new Date(d).toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })}
        />
        <YAxis
          className="text-xs"
          tick={{ fontSize: 11 }}
          tickFormatter={(v) => `${(v / 100_000_000).toFixed(0)}M`}
        />
        <Tooltip
          formatter={(value: number, name: string) => [formatValue(value), name]}
          labelFormatter={(d) => new Date(d as string).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
        />
        {showLegend && <Legend />}

        {todayIdx > 0 && (
          <ReferenceLine x={data[todayIdx - 1]?.date} stroke="#888" strokeDasharray="3 3" label="Aujourd'hui" />
        )}

        {/* 95% CI band */}
        <Area
          type="monotone"
          dataKey="upper95"
          stroke="none"
          fill="#93c5fd"
          fillOpacity={0.15}
          name="IC 95%"
          dot={false}
        />
        <Area
          type="monotone"
          dataKey="lower95"
          stroke="none"
          fill="#ffffff"
          fillOpacity={1}
          name=""
          legendType="none"
          dot={false}
        />

        {/* 80% CI band */}
        <Area
          type="monotone"
          dataKey="upper80"
          stroke="none"
          fill="#60a5fa"
          fillOpacity={0.25}
          name="IC 80%"
          dot={false}
        />
        <Area
          type="monotone"
          dataKey="lower80"
          stroke="none"
          fill="#ffffff"
          fillOpacity={1}
          name=""
          legendType="none"
          dot={false}
        />

        {/* Forecast central line */}
        <Area
          type="monotone"
          dataKey="central"
          stroke="#3b82f6"
          fill="none"
          strokeWidth={2}
          strokeDasharray="5 5"
          name="Prévision"
          dot={false}
        />

        {/* Actual line */}
        <Area
          type="monotone"
          dataKey="actual"
          stroke="#171717"
          fill="#171717"
          fillOpacity={0.1}
          strokeWidth={2}
          name="Réalisé"
          dot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
