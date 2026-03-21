import {
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Line, LineChart, Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { CalibrationData } from './uncertainty-types';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface CalibrationChartProps {
  data: CalibrationData;
  height?: number;
}

export function CalibrationChart({ data, height = 300 }: CalibrationChartProps) {
  const chartData = data.expected_coverage.map((exp, i) => ({
    expected: Math.round(exp * 100),
    actual: Math.round(data.actual_coverage[i] * 100),
    perfect: Math.round(exp * 100),
  }));

  const ecePercent = (data.ece * 100).toFixed(1);
  const eceBadgeVariant = data.ece < 0.05 ? 'success' : data.ece < 0.1 ? 'warning' : 'destructive';
  const eceLabel = data.ece < 0.05 ? 'Bien calibre' : data.ece < 0.1 ? 'Calibrage acceptable' : 'Mal calibre';

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Diagramme de fiabilite</CardTitle>
            <CardDescription>Couverture observee vs attendue des intervalles de confiance</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">ECE:</span>
            <Badge variant={eceBadgeVariant}>{ecePercent}% — {eceLabel}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="expected"
              tick={{ fontSize: 11 }}
              label={{ value: 'Couverture attendue (%)', position: 'insideBottom', offset: -2, fontSize: 11 }}
            />
            <YAxis
              tick={{ fontSize: 11 }}
              domain={[0, 100]}
              label={{ value: 'Couverture observee (%)', angle: -90, position: 'insideLeft', fontSize: 11 }}
            />
            <Tooltip
              formatter={(value: number, name: string) => {
                if (name === 'Calibration parfaite') return [`${value}%`, name];
                return [`${value}%`, 'Couverture observee'];
              }}
              labelFormatter={(label) => `Niveau attendu: ${label}%`}
            />
            <Legend />

            {/* Perfect calibration diagonal */}
            <Line
              type="monotone"
              dataKey="perfect"
              stroke="#a3a3a3"
              strokeDasharray="6 3"
              strokeWidth={1.5}
              dot={false}
              name="Calibration parfaite"
            />

            {/* Actual calibration */}
            <Line
              type="monotone"
              dataKey="actual"
              stroke="#6366f1"
              strokeWidth={2.5}
              dot={{ r: 4, fill: '#6366f1' }}
              name="Couverture observee"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
