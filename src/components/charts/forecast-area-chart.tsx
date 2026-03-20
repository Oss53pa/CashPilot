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
} from 'recharts';

interface ForecastAreaChartProps {
  data: { date: string; forecast: number; actual: number }[];
  height?: number;
}

export function ForecastAreaChart({ data, height = 350 }: ForecastAreaChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey="date" className="text-xs" tick={{ fontSize: 12 }} />
        <YAxis className="text-xs" tick={{ fontSize: 12 }} />
        <Tooltip />
        <Legend />
        <Area
          type="monotone"
          dataKey="forecast"
          stroke="#a3a3a3"
          fill="#a3a3a3"
          fillOpacity={0.15}
          strokeDasharray="5 5"
          strokeWidth={2}
          name="Forecast"
        />
        <Area
          type="monotone"
          dataKey="actual"
          stroke="#171717"
          fill="#171717"
          fillOpacity={0.3}
          strokeWidth={2}
          name="Actual"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
