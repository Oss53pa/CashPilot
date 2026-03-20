import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CurrencyDisplay } from '@/components/shared/currency-display';
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
import type { CapexDashboard } from '../types';

interface CapexDashboardCardsProps {
  dashboard: CapexDashboard | undefined;
  currency?: string;
  isLoading?: boolean;
}

export function CapexDashboardCards({
  dashboard,
  currency = 'XOF',
  isLoading,
}: CapexDashboardCardsProps) {
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Loading...
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-7 w-24 animate-pulse rounded bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const chartData = (dashboard?.by_category ?? []).map((c) => ({
    category: c.category.replace(/\b\w/g, (ch) => ch.toUpperCase()),
    Budget: c.budget,
    Spent: c.spent,
  }));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Budget
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <CurrencyDisplay amount={dashboard?.total_budget ?? 0} currency={currency} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Committed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <CurrencyDisplay amount={dashboard?.total_committed ?? 0} currency={currency} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Spent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <CurrencyDisplay amount={dashboard?.total_spent ?? 0} currency={currency} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completion Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round((dashboard?.completion_rate ?? 0) * 100)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Budget vs Spent by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="Budget" fill="#404040" />
                <Bar dataKey="Spent" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
