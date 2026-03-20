'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface TreasuryLineChartProps {
  data: { date: string; receipts: number; disbursements: number; net: number }[];
  height?: number;
}

export function TreasuryLineChart({ data, height = 350 }: TreasuryLineChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey="date" className="text-xs" tick={{ fontSize: 12 }} />
        <YAxis className="text-xs" tick={{ fontSize: 12 }} />
        <Tooltip />
        <Legend />
        <Line
          type="monotone"
          dataKey="receipts"
          stroke="#22c55e"
          name="Receipts"
          strokeWidth={2}
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="disbursements"
          stroke="#ef4444"
          name="Disbursements"
          strokeWidth={2}
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="net"
          stroke="#171717"
          name="Net"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
