import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { FederatedPerformance } from './federated-types';

// ---------------------------------------------------------------------------
// Mock trend data (6 months)
// ---------------------------------------------------------------------------

const trendData = [
  { month: 'Oct 2025', local: 8.2, federated: 7.1 },
  { month: 'Nov 2025', local: 7.8, federated: 6.5 },
  { month: 'Dec 2025', local: 7.5, federated: 6.2 },
  { month: 'Jan 2026', local: 7.2, federated: 5.8 },
  { month: 'Fev 2026', local: 7.0, federated: 5.5 },
  { month: 'Mar 2026', local: 6.8, federated: 5.2 },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface FederatedPerformanceVizProps {
  performance: FederatedPerformance[];
}

export function FederatedPerformanceViz({ performance }: FederatedPerformanceVizProps) {
  return (
    <div className="space-y-4">
      {/* Comparison bar chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Comparaison Local vs Federe</CardTitle>
          <CardDescription>Performance actuelle de vos modeles avec et sans apprentissage federe</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={performance}
              margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="metric" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="local_only" fill="#94a3b8" name="Local seul" radius={[3, 3, 0, 0]} />
              <Bar dataKey="with_federated" fill="#22c55e" name="Avec federe" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>

          {/* Improvement badges */}
          <div className="flex flex-wrap gap-3 mt-4 justify-center">
            {performance.map((p, idx) => (
              <div key={idx} className="flex items-center gap-2 rounded-lg border px-3 py-2">
                <span className="text-sm font-medium">{p.metric}</span>
                <Badge variant="success" className="text-xs">
                  {p.metric.startsWith('MAPE') ? '-' : '+'}{p.improvement_pct}%
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Trend over 6 months */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tendance MAPE J+30 (6 mois)</CardTitle>
          <CardDescription>Evolution de la precision avec l'apprentissage federe</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={trendData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} label={{ value: 'MAPE (%)', angle: -90, position: 'insideLeft', style: { fontSize: 11 } }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="local" fill="#94a3b8" name="Local seul" radius={[3, 3, 0, 0]} />
              <Bar dataKey="federated" fill="#22c55e" name="Avec federe" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
