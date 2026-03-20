import { z } from 'zod';

export const scenarioAdjustmentSchema = z.object({
  category: z.string().min(1, 'Category is required'),
  percentage_change: z.coerce.number(),
});

export const scenarioSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  base_forecast_id: z.string().min(1, 'Base forecast is required'),
  type: z.enum(['optimistic', 'pessimistic', 'custom']),
  adjustments: z.array(scenarioAdjustmentSchema).default([]),
});

export type ScenarioAdjustment = z.infer<typeof scenarioAdjustmentSchema>;
export type ScenarioFormData = z.infer<typeof scenarioSchema>;

export interface Scenario {
  id: string;
  company_id: string;
  name: string;
  base_forecast_id: string;
  type: 'optimistic' | 'pessimistic' | 'custom';
  adjustments: ScenarioAdjustment[];
  result_data: Record<string, number> | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// --- Stress Test Types ---

export type StressTestType =
  | 'tenant_loss'
  | 'mass_delay'
  | 'charge_shock'
  | 'bank_blockage'
  | 'fx_shock'
  | 'credit_revocation';

export interface StressTest {
  id: string;
  name: string;
  type: StressTestType;
  description: string;
  parameters: Record<string, string | number>;
}

export interface StressTestResult {
  stress_test_id: string;
  stress_test_name: string;
  position_under_stress: number;
  days_to_threshold: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  available_levers: StressTestLever[];
}

export interface StressTestLever {
  name: string;
  description: string;
  estimated_impact: number;
}

// --- What-If Types ---

export interface WhatIfParameters {
  recovery_rate: number;
  payment_delay_adjustment: number;
  additional_expense: number;
  revenue_change: number;
  capex_timing_shift: number;
}

export interface WhatIfResult {
  parameters: WhatIfParameters;
  projected_data: WhatIfDataPoint[];
  base_data: WhatIfDataPoint[];
  net_impact: number;
}

export interface WhatIfDataPoint {
  month: string;
  position: number;
}
