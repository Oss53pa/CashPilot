'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface BalanceBarChartProps {
  data: { name: string; balance: number }[];
  height?: number;
}

export function BalanceBarChart({ data, height = 350 }: BalanceBarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey="name" className="text-xs" tick={{ fontSize: 12 }} />
        <YAxis className="text-xs" tick={{ fontSize: 12 }} />
        <Tooltip />
        <Bar dataKey="balance" radius={[4, 4, 0, 0]}>
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={entry.balance >= 0 ? '#22c55e' : '#ef4444'}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
