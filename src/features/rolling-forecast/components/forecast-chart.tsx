'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';
import type { ForecastColumn, PositionBlock } from '../types';

interface ForecastChartProps {
  columns: ForecastColumn[];
  position: PositionBlock;
  height?: number;
}

function formatMillions(value: number): string {
  return `${(value / 1_000_000).toFixed(0)}M`;
}

export function ForecastChart({ columns, position, height = 400 }: ForecastChartProps) {
  const data = columns.map((col) => {
    const pos = position.columns[col.key];
    return {
      name: col.key,
      label: col.label,
      base: pos?.closing ?? 0,
      optimistic: pos?.optimistic ?? 0,
      pessimistic: pos?.pessimistic ?? 0,
    };
  });

  // Find critical point (first column where pessimistic drops below threshold)
  const criticalIdx = data.findIndex((d) => d.pessimistic < 50_000_000);

  return (
    <div className="rounded-lg border bg-card p-4">
      <h3 className="mb-4 text-sm font-semibold">
        Position de trésorerie projetée (FCFA)
      </h3>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            dataKey="name"
            className="text-xs"
            tick={{ fontSize: 11 }}
          />
          <YAxis
            className="text-xs"
            tick={{ fontSize: 11 }}
            tickFormatter={formatMillions}
          />
          <Tooltip
            formatter={(value: number) => [formatMillions(value), '']}
            labelFormatter={(label) => {
              const col = columns.find((c) => c.key === label);
              return col ? `${col.key} — ${col.label}` : label;
            }}
          />
          <Legend />

          {/* Confidence band (pessimistic -> optimistic) */}
          <Area
            type="monotone"
            dataKey="optimistic"
            stroke="transparent"
            fill="#22c55e"
            fillOpacity={0.08}
            name="Optimiste"
            strokeWidth={0}
          />
          <Area
            type="monotone"
            dataKey="pessimistic"
            stroke="#ef4444"
            fill="transparent"
            fillOpacity={0}
            name="Pessimiste"
            strokeWidth={1.5}
            strokeDasharray="4 4"
          />

          {/* Base line */}
          <Area
            type="monotone"
            dataKey="base"
            stroke="#171717"
            fill="#171717"
            fillOpacity={0.1}
            name="Base"
            strokeWidth={2}
          />

          {/* Threshold */}
          <ReferenceLine
            y={50_000_000}
            stroke="#ef4444"
            strokeDasharray="6 3"
            strokeWidth={1.5}
            label={{
              value: 'Seuil 50M',
              position: 'right',
              fill: '#ef4444',
              fontSize: 11,
            }}
          />

          {/* Critical point annotation */}
          {criticalIdx >= 0 && (
            <ReferenceLine
              x={data[criticalIdx].name}
              stroke="#f97316"
              strokeDasharray="3 3"
              label={{
                value: 'Point critique',
                position: 'top',
                fill: '#f97316',
                fontSize: 10,
              }}
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
