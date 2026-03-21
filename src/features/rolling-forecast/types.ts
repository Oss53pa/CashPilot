// ---------------------------------------------------------------------------
// Rolling Forecast – Types
// ---------------------------------------------------------------------------

export type Granularity = 'weekly_monthly' | 'monthly' | 'quarterly' | 'plan_13_weeks';

export interface ForecastColumn {
  key: string; // S1, S2, ... S13, M4, M5, ... M12
  label: string; // "18-24 Mars", "Avr 2026"
  type: 'week' | 'month' | 'quarter';
  start_date: string;
  end_date: string;
  is_past: boolean;
  is_current: boolean;
  confidence_pct: number;
}

export interface ForecastCell {
  forecast: number; // central prediction
  low_80?: number; // 80% CI lower bound
  high_80?: number; // 80% CI upper bound
  realized?: number; // if past period
  variance?: number; // realized - forecast
  is_locked?: boolean;
  lock_note?: string;
  freshness?: string; // last update timestamp
  source?: string; // "Proph3t 06h42" / "manual"
}

export interface ForecastRow {
  code: string;
  label: string;
  level: number; // 0=category, 1=sub, 2=detail
  parent_code?: string;
  is_expandable: boolean;
  is_total: boolean;
  sign: '+' | '-';
  cells: Record<string, ForecastCell>; // keyed by column.key
  total: ForecastCell;
}

// Position block (always visible at top/bottom)
export interface PositionBlock {
  columns: Record<string, {
    opening: number;
    net_flow: number;
    closing: number;
    threshold: number;
    surplus_deficit: number;
    optimistic: number;
    pessimistic: number;
  }>;
}

// Risk summary row
export interface RiskSummary {
  tenants_at_risk: { count: number; monthly_amount: number };
  disputes_expected: number;
  capex_underfunded: { count: number; date: string; amount: number } | null;
  covenant_watch: { name: string; current: number; minimum: number } | null;
}

// Full rolling forecast
export interface RollingForecast {
  company_id: string;
  company_name: string;
  reference_date: string;
  period_start: string;
  period_end: string;
  granularity: Granularity;
  scenario: 'base' | 'optimistic' | 'pessimistic';
  currency: string;
  columns: ForecastColumn[];
  position: PositionBlock;
  receipts: ForecastRow[]; // hierarchical
  disbursements: ForecastRow[]; // hierarchical
  risk_summary: RiskSummary;
  last_updated: string;
}

// Simulation parameters
export interface SimulationParams {
  recovery_rate: number; // 50-100%
  payment_delay_days: number; // 0-60
  unplanned_charges_pct: number; // 0-30%
  capex_delay_days: number; // 0/15/30/60
  credit_line_activated: boolean;
  credit_line_amount?: number;
  excluded_tenants: string[];
}
