import { useCompanyStore } from '@/stores/company.store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useMethodRecommendations, useColdStartPhase } from '../hooks/use-forecast';
import type { ForecastMethod } from '../types';

const METHOD_LABELS: Record<ForecastMethod, string> = {
  deterministic: 'Deterministic',
  statistical_moving_avg: 'Moving Average',
  statistical_holt_winters: 'Holt-Winters',
  statistical_arima: 'ARIMA',
  ml_lstm: 'LSTM (Deep Learning)',
  ml_xgboost: 'XGBoost',
  ml_ensemble: 'Ensemble ML',
};

const CATEGORY_INFO = [
  {
    key: 'deterministic' as const,
    title: 'Deterministic',
    description:
      'For certain or quasi-certain flows: contracts, salaries, loan repayments. Uses known schedules and amounts directly.',
    color: 'bg-emerald-500',
    badge: 'default' as const,
  },
  {
    key: 'statistical' as const,
    title: 'Statistical',
    description:
      'For regular variable flows: tenant payments, energy charges. Uses time-series models (moving averages, Holt-Winters, ARIMA) to capture trends and seasonality.',
    color: 'bg-blue-500',
    badge: 'secondary' as const,
  },
  {
    key: 'ml' as const,
    title: 'Machine Learning',
    description:
      'For complex non-linear flows: variable revenue, long-term trends. Uses neural networks (LSTM) and gradient boosting (XGBoost) for pattern recognition.',
    color: 'bg-purple-500',
    badge: 'secondary' as const,
  },
];

const PHASE_LABELS: Record<number, string> = {
  1: 'Phase 1 - Cold Start (0-3 mois)',
  2: 'Phase 2 - Deterministic Only (3-6 mois)',
  3: 'Phase 3 - Statistical Active (6-18 mois)',
  4: 'Phase 4 - Full ML (18+ mois)',
};

export function ForecastMethods() {
  const currentCompany = useCompanyStore((s) => s.currentCompany);
  const companyId = currentCompany?.id ?? '';

  const { data: recommendations = [], isLoading: loadingMethods } =
    useMethodRecommendations(companyId);
  const { data: coldStart, isLoading: loadingColdStart } = useColdStartPhase(companyId);

  if (loadingMethods || loadingColdStart) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        Loading engine data...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cold Start Indicator */}
      {coldStart && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Engine Maturity</CardTitle>
              <Badge variant={coldStart.phase >= 3 ? 'default' : 'secondary'}>
                {PHASE_LABELS[coldStart.phase]}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">{coldStart.description}</p>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>Historical data progress</span>
                <span>
                  {coldStart.current_months} / {coldStart.months_required} months
                </span>
              </div>
              <Progress
                value={(coldStart.current_months / coldStart.months_required) * 100}
                className="h-3"
              />
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2">
              <span className="text-xs text-muted-foreground mr-1">Available methods:</span>
              {coldStart.methods_available.map((m) => (
                <Badge key={m} variant="secondary" className="text-xs">
                  {METHOD_LABELS[m]}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Method Categories */}
      <div className="grid gap-4 md:grid-cols-3">
        {CATEGORY_INFO.map((cat) => {
          const catMethods = recommendations.filter((r) => r.method_category === cat.key);
          const avgAccuracy =
            catMethods.length > 0
              ? (catMethods.reduce((s, r) => s + r.accuracy, 0) / catMethods.length).toFixed(1)
              : '---';

          return (
            <Card key={cat.key}>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${cat.color}`} />
                  <CardTitle className="text-base">{cat.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">{cat.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm">
                    {catMethods.length} flow{catMethods.length !== 1 ? 's' : ''}
                  </span>
                  <span className="text-sm font-medium">Avg accuracy: {avgAccuracy}%</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Method Recommendations Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Method Recommendations per Flow</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Flow Category</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Recommended</TableHead>
                <TableHead>Current</TableHead>
                <TableHead className="text-right">Accuracy</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recommendations.map((rec) => {
                const isOptimal = rec.recommended_method === rec.current_method;
                return (
                  <TableRow key={rec.flow_category}>
                    <TableCell className="font-medium">{rec.flow_category}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {rec.description}
                    </TableCell>
                    <TableCell>
                      <Badge variant="default" className="text-xs">
                        {METHOD_LABELS[rec.recommended_method]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={isOptimal ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {METHOD_LABELS[rec.current_method]}
                      </Badge>
                      {!isOptimal && (
                        <span className="ml-1 text-xs text-amber-600">*</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={
                          rec.accuracy >= 95
                            ? 'text-green-600 font-medium'
                            : rec.accuracy >= 85
                              ? 'text-amber-600 font-medium'
                              : 'text-red-600 font-medium'
                        }
                      >
                        {rec.accuracy}%
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          <p className="text-xs text-muted-foreground mt-3">
            * Current method differs from recommendation. Consider upgrading for better accuracy.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
