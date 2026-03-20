'use client';

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface CategoryPieChartProps {
  data: { name: string; value: number; color?: string }[];
  height?: number;
}

const DEFAULT_COLORS = [
  '#171717',
  '#22c55e',
  '#f59e0b',
  '#ef4444',
  '#737373',
  '#a3a3a3',
  '#404040',
  '#d4d4d4',
];

export function CategoryPieChart({ data, height = 350 }: CategoryPieChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={2}
          dataKey="value"
          nameKey="name"
        >
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={entry.color ?? DEFAULT_COLORS[index % DEFAULT_COLORS.length]}
            />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
