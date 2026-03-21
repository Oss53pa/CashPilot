// ============================================================================
// Uncertainty Quantification Types
// ============================================================================

export interface UncertaintyDistribution {
  forecast_id: string;
  target_date: string;
  central: number;
  mean: number;
  median: number;
  std_dev: number;
  percentiles: Record<string, number>; // p5, p10, p25, p50, p75, p90, p95
  density_points: { x: number; y: number }[]; // for violin/density plot
  aleatoric_variance: number; // irreducible randomness
  epistemic_variance: number; // model uncertainty (reducible)
  total_variance: number;
  credible_interval_80: [number, number];
  credible_interval_95: [number, number];
  mc_dropout_samples: number; // how many MC passes were used
}

export interface CalibrationData {
  expected_coverage: number[]; // [0.1, 0.2, ..., 0.9]
  actual_coverage: number[]; // observed coverage at each level
  ece: number; // Expected Calibration Error
  is_well_calibrated: boolean; // ECE < 0.05
}

export interface UncertaintyDecomposition {
  horizon: string;
  aleatoric_pct: number;
  epistemic_pct: number;
  description_aleatoric: string;
  description_epistemic: string;
}

export interface ProbabilityQuery {
  date: string;
  threshold: number; // "What's the probability position < threshold?"
  probability: number; // result
}

export interface FanChartPoint {
  date: string;
  central: number;
  ci80_lower: number;
  ci80_upper: number;
  ci95_lower: number;
  ci95_upper: number;
}
