'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

interface MapeDataPoint {
  date: string;
  mape: number;
  model?: string;
}

interface MapeChartProps {
  data: MapeDataPoint[];
  height?: number;
}

export function MapeChart({ data, height = 300 }: MapeChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis
          dataKey="date"
          className="text-xs"
          tick={{ fontSize: 11 }}
          tickFormatter={(d) => new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
        />
        <YAxis
          className="text-xs"
          tick={{ fontSize: 11 }}
          tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
          domain={[0, 'auto']}
        />
        <Tooltip
          formatter={(value: number) => [`${(value * 100).toFixed(1)}%`, 'MAPE']}
          labelFormatter={(d) => new Date(d as string).toLocaleDateString('fr-FR')}
        />
        <ReferenceLine y={0.10} stroke="#22c55e" strokeDasharray="3 3" label="10%" />
        <ReferenceLine y={0.20} stroke="#ef4444" strokeDasharray="3 3" label="20%" />
        <Line
          type="monotone"
          dataKey="mape"
          stroke="#3b82f6"
          strokeWidth={2}
          dot={{ r: 3 }}
          name="MAPE"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
