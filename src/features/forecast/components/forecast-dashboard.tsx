import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { TrendingUp, TrendingDown, Target, BarChart3 } from 'lucide-react';
import type { Forecast } from '@/types/database';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { ForecastAreaChart } from '@/components/charts/forecast-area-chart';
import { formatCurrency } from '@/lib/utils';
import type { ForecastVsActual, ForecastAccuracy } from '../types';

interface ForecastDashboardProps {
  forecasts: Forecast[];
  forecastVsActual?: ForecastVsActual[];
  accuracy?: ForecastAccuracy[];
  activeHorizon: string;
  onHorizonChange: (horizon: string) => void;
  currency?: string;
}

export function ForecastDashboard({
  forecasts,
  forecastVsActual = [],
  accuracy = [],
  activeHorizon,
  onHorizonChange,
  currency = 'USD',
}: ForecastDashboardProps) {
  const { t } = useTranslation('forecast');

  const summary = useMemo(() => {
    const filtered = activeHorizon === 'all'
      ? forecasts
      : forecasts.filter((f) => f.horizon === activeHorizon);

    const totalReceipts = filtered
      .filter((f) => f.type === 'receipt')
      .reduce((sum, f) => sum + f.amount, 0);

    const totalDisbursements = filtered
      .filter((f) => f.type === 'disbursement')
      .reduce((sum, f) => sum + f.amount, 0);

    const avgConfidence = filtered.length > 0
      ? Math.round(filtered.reduce((sum, f) => sum + f.confidence, 0) / filtered.length)
      : 0;

    return {
      totalReceipts,
      totalDisbursements,
      net: totalReceipts - totalDisbursements,
      count: filtered.length,
      avgConfidence,
    };
  }, [forecasts, activeHorizon]);

  const overallAccuracy = useMemo(() => {
    if (accuracy.length === 0) return 0;
    return Math.round(
      accuracy.reduce((sum, a) => sum + a.accuracy, 0) / accuracy.length
    );
  }, [accuracy]);

  return (
    <div className="space-y-6">
      <Tabs value={activeHorizon} onValueChange={onHorizonChange}>
        <TabsList>
          <TabsTrigger value="daily">{t('horizon.daily', 'Daily')}</TabsTrigger>
          <TabsTrigger value="weekly">{t('horizon.weekly', 'Weekly')}</TabsTrigger>
          <TabsTrigger value="monthly">{t('horizon.monthly', 'Monthly')}</TabsTrigger>
          <TabsTrigger value="quarterly">{t('horizon.quarterly', 'Quarterly')}</TabsTrigger>
        </TabsList>

        <TabsContent value={activeHorizon} className="mt-4">
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {t('dashboard.receipts', 'Expected Receipts')}
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(summary.totalReceipts, currency)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {t('dashboard.disbursements', 'Expected Disbursements')}
                </CardTitle>
                <TrendingDown className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(summary.totalDisbursements, currency)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {t('dashboard.net', 'Net Forecast')}
                </CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className={`text-2xl font-bold ${summary.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(summary.net, currency)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {t('dashboard.accuracy', 'Accuracy')}
                </CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold">{overallAccuracy}%</p>
                  <Progress value={overallAccuracy} className="h-2 flex-1" />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t('dashboard.avg_confidence', 'Avg confidence')}: {summary.avgConfidence}%
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {forecastVsActual.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.chart_title', 'Forecast vs Actual')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ForecastAreaChart data={forecastVsActual} height={350} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
