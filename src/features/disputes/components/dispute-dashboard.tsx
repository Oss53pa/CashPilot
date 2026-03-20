import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CurrencyDisplay } from '@/components/shared/currency-display';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import type { DisputeDashboard } from '../types';
import type { DisputeFile } from '@/types/database';

interface DisputeDashboardProps {
  dashboard: DisputeDashboard | undefined;
  disputes: DisputeFile[];
  isLoading?: boolean;
}

const STATUS_COLORS: Record<string, string> = {
  open: '#facc15',
  in_progress: '#3b82f6',
  settled: '#22c55e',
  closed: '#6b7280',
  written_off: '#ef4444',
};

export function DisputeDashboardPanel({ dashboard, disputes, isLoading }: DisputeDashboardProps) {
  if (isLoading || !dashboard) {
    return (
      <div className="grid gap-4 md:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Loading...</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-7 w-24 animate-pulse rounded bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Status distribution for pie chart
  const statusCounts = disputes.reduce<Record<string, number>>((acc, d) => {
    acc[d.status] = (acc[d.status] ?? 0) + 1;
    return acc;
  }, {});

  const pieData = Object.entries(statusCounts).map(([status, count]) => ({
    name: status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    value: count,
    color: STATUS_COLORS[status] ?? '#9ca3af',
  }));

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Dossiers Actifs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard.active_count}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Montant Total en Litige
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <CurrencyDisplay amount={dashboard.total_litigated} currency="XOF" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Provisions Totales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <CurrencyDisplay amount={dashboard.total_provisions} currency="XOF" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Valeur Nette Attendue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              <CurrencyDisplay amount={dashboard.expected_net_value} currency="XOF" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Upcoming Hearings */}
        <Card>
          <CardHeader>
            <CardTitle>Audiences a Venir (30 jours)</CardTitle>
          </CardHeader>
          <CardContent>
            {dashboard.upcoming_hearings.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">Aucune audience programmee</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reference</TableHead>
                    <TableHead>Juridiction</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Compte a rebours</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dashboard.upcoming_hearings.map((h) => (
                    <TableRow key={h.dispute_id}>
                      <TableCell className="font-medium">{h.reference}</TableCell>
                      <TableCell className="text-sm">{h.court}</TableCell>
                      <TableCell>{new Date(h.hearing_date).toLocaleDateString('fr-FR')}</TableCell>
                      <TableCell>
                        <Badge
                          className={
                            h.days_until <= 7
                              ? 'bg-red-100 text-red-800'
                              : h.days_until <= 14
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-blue-100 text-blue-800'
                          }
                          variant="outline"
                        >
                          J-{h.days_until}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Repartition par Statut</CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">Aucune donnee</p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={90}
                    dataKey="value"
                    nameKey="name"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
