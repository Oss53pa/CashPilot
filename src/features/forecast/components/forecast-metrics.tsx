import { useCompanyStore } from '@/stores/company.store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Target, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';
import { useForecastMetrics, useAccuracyTrend } from '../hooks/use-forecast';
import { formatCurrency } from '@/lib/utils';

interface MetricCardProps {
  label: string;
  value: string;
  target?: string;
  status: 'green' | 'yellow' | 'red';
  icon: React.ReactNode;
  subtitle?: string;
}

function MetricCard({ label, value, target, status, icon, subtitle }: MetricCardProps) {
  const statusColors = {
    green: 'bg-green-100 text-green-800 border-green-200',
    yellow: 'bg-amber-100 text-amber-800 border-amber-200',
    red: 'bg-red-100 text-red-800 border-red-200',
  };

  const statusLabels = {
    green: 'On Target',
    yellow: 'Near Target',
    red: 'Below Target',
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{label}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{value}</p>
        {target && (
          <p className="text-xs text-muted-foreground mt-1">Target: {target}</p>
        )}
        <Badge className={`mt-2 text-xs ${statusColors[status]}`} variant="outline">
          {statusLabels[status]}
        </Badge>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}

interface PrecisionRowProps {
  label: string;
  value: number;
  target: number;
}

function PrecisionRow({ label, value, target }: PrecisionRowProps) {
  const status = value >= target ? 'green' : value >= target - 5 ? 'yellow' : 'red';
  const statusColors = {
    green: 'text-green-600',
    yellow: 'text-amber-600',
    red: 'text-red-600',
  };

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-sm">
        <span>{label}</span>
        <div className="flex items-center gap-2">
          <span className={`font-medium ${statusColors[status]}`}>{value.toFixed(1)}%</span>
          <span className="text-muted-foreground">/ {target}%</span>
          {status === 'green' ? (
            <CheckCircle className="h-3.5 w-3.5 text-green-600" />
          ) : status === 'yellow' ? (
            <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
          ) : (
            <AlertTriangle className="h-3.5 w-3.5 text-red-600" />
          )}
        </div>
      </div>
      <Progress
        value={(value / target) * 100}
        className={`h-2 ${status === 'green' ? '' : status === 'yellow' ? '[&>div]:bg-amber-500' : '[&>div]:bg-red-500'}`}
      />
    </div>
  );
}

export function ForecastMetricsDashboard() {
  const currentCompany = useCompanyStore((s) => s.currentCompany);
  const companyId = currentCompany?.id ?? '';

  const { data: metrics, isLoading: loadingMetrics } = useForecastMetrics(companyId);
  const { data: trend = [], isLoading: loadingTrend } = useAccuracyTrend(companyId);

  if (loadingMetrics || loadingTrend) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        Loading performance metrics...
      </div>
    );
  }

  if (!metrics) return null;

  const mapeStatus = metrics.mape <= 5 ? 'green' : metrics.mape <= 10 ? 'yellow' : 'red';
  const accuracyStatus =
    metrics.accuracy >= 95 ? 'green' : metrics.accuracy >= 85 ? 'yellow' : 'red';
  const biasStatus =
    Math.abs(metrics.bias) <= 2 ? 'green' : Math.abs(metrics.bias) <= 5 ? 'yellow' : 'red';

  return (
    <div className="space-y-6">
      {/* Main KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard
          label="MAE (Mean Absolute Error)"
          value={formatCurrency(metrics.mae, 'XOF', 'fr-FR')}
          target="< 200 000 FCFA"
          status={metrics.mae <= 200000 ? 'green' : metrics.mae <= 400000 ? 'yellow' : 'red'}
          icon={<Target className="h-4 w-4 text-muted-foreground" />}
        />
        <MetricCard
          label="MAPE (Main KPI)"
          value={`${metrics.mape.toFixed(1)}%`}
          target="< 5%"
          status={mapeStatus}
          icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
          subtitle="Mean Absolute Percentage Error"
        />
        <MetricCard
          label="Bias"
          value={`${metrics.bias > 0 ? '+' : ''}${metrics.bias.toFixed(1)}%`}
          target="Between -2% and +2%"
          status={biasStatus}
          icon={
            <AlertTriangle
              className={`h-4 w-4 ${metrics.bias > 0 ? 'text-amber-500' : 'text-blue-500'}`}
            />
          }
          subtitle={metrics.bias > 0 ? 'Optimistic bias' : metrics.bias < 0 ? 'Pessimistic bias' : 'Neutral'}
        />
        <MetricCard
          label="Global Accuracy"
          value={`${metrics.accuracy.toFixed(1)}%`}
          target="> 95%"
          status={accuracyStatus}
          icon={<CheckCircle className="h-4 w-4 text-muted-foreground" />}
        />
      </div>

      {/* Precision by Horizon */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Precision by Forecast Horizon</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <PrecisionRow label="J+7 (7 days)" value={metrics.precision_j7} target={98} />
          <PrecisionRow label="J+30 (30 days)" value={metrics.precision_j30} target={92} />
          <PrecisionRow label="J+90 (90 days)" value={metrics.precision_j90} target={85} />
          <PrecisionRow label="J+365 (1 year)" value={metrics.precision_j365} target={75} />
        </CardContent>
      </Card>

      {/* Accuracy Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Accuracy Trend (Last 6 Months)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trend} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="month" className="text-xs" tick={{ fontSize: 12 }} />
              <YAxis domain={[80, 100]} className="text-xs" tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="accuracy"
                stroke="#171717"
                strokeWidth={2}
                name="Accuracy %"
                dot={{ fill: '#171717' }}
              />
              <Line
                type="monotone"
                dataKey="mape"
                stroke="#ef4444"
                strokeWidth={2}
                strokeDasharray="5 5"
                name="MAPE %"
                dot={{ fill: '#ef4444' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
