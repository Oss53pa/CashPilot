import { z } from 'zod';

export const forecastSchema = z.object({
  type: z.enum(['receipt', 'disbursement']),
  category: z.string().min(1, 'Category is required'),
  amount: z.number().positive('Amount must be positive'),
  forecast_date: z.string().min(1, 'Forecast date is required'),
  horizon: z.enum(['daily', 'weekly', 'monthly', 'quarterly']),
  confidence: z.number().min(0).max(100).default(50),
  source: z.enum(['manual', 'recurring', 'ai']).default('manual'),
  notes: z.string().nullable().default(null),
});

export const forecastUpdateSchema = forecastSchema.partial();

export type ForecastInput = z.infer<typeof forecastSchema>;
export type ForecastUpdateInput = z.infer<typeof forecastUpdateSchema>;

export interface ForecastVsActual {
  date: string;
  forecast: number;
  actual: number;
}

export interface ForecastAccuracy {
  horizon: string;
  accuracy: number;
  sampleSize: number;
}

// --- Forecast Engine Types ---

export type ForecastMethod =
  | 'deterministic'
  | 'statistical_moving_avg'
  | 'statistical_holt_winters'
  | 'statistical_arima'
  | 'ml_lstm'
  | 'ml_xgboost'
  | 'ml_ensemble';

export type ForecastHorizonCode = 'j7' | 'j30' | 'j90' | 'j365';

export interface ForecastHorizon {
  code: ForecastHorizonCode;
  label: string;
  days: number;
  granularity: 'daily' | 'weekly' | 'monthly';
}

export interface ForecastMetrics {
  mae: number;
  mape: number;
  bias: number;
  accuracy: number;
  precision_j7: number;
  precision_j30: number;
  precision_j90: number;
  precision_j365: number;
}

export interface ForecastMetricTarget {
  label: string;
  value: number;
  target: number;
  status: 'green' | 'yellow' | 'red';
  unit: string;
}

export interface ColdStartPhase {
  phase: 1 | 2 | 3 | 4;
  description: string;
  methods_available: ForecastMethod[];
  months_required: number;
  current_months: number;
}

export interface RecalibrationEvent {
  id: string;
  trigger: string;
  timestamp: string;
  counterparty: string;
  old_profile: string;
  new_profile: string;
  forecasts_updated_count: number;
}

export interface MethodRecommendation {
  flow_category: string;
  description: string;
  recommended_method: ForecastMethod;
  current_method: ForecastMethod;
  accuracy: number;
  method_category: 'deterministic' | 'statistical' | 'ml';
}

export interface AccuracyTrend {
  month: string;
  accuracy: number;
  mape: number;
}
