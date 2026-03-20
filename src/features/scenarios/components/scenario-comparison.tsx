import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Scenario } from '../types';

interface ScenarioComparisonProps {
  scenarios: Scenario[];
}

const COLORS = ['#171717', '#22c55e', '#f59e0b', '#ef4444', '#a3a3a3'];

export function ScenarioComparison({ scenarios }: ScenarioComparisonProps) {
  const scenariosWithData = scenarios.filter((s) => s.result_data);

  if (scenariosWithData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Scenario Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Run scenarios to see comparison data.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Collect all categories across all scenarios
  const allCategories = new Set<string>();
  scenariosWithData.forEach((s) => {
    if (s.result_data) {
      Object.keys(s.result_data).forEach((k) => allCategories.add(k));
    }
  });

  // Build chart data: one entry per category
  const chartData = Array.from(allCategories).map((category) => {
    const entry: Record<string, string | number> = { category };
    scenariosWithData.forEach((s) => {
      entry[s.name] = s.result_data?.[category] ?? 0;
    });
    return entry;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Scenario Comparison</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="category" />
            <YAxis />
            <Tooltip />
            <Legend />
            {scenariosWithData.map((s, i) => (
              <Bar
                key={s.id}
                dataKey={s.name}
                fill={COLORS[i % COLORS.length]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
