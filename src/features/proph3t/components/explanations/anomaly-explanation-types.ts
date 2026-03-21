// ============================================================================
// Anomaly Explanation Types
// ============================================================================

export interface CounterfactualExplanation {
  id: string;
  anomaly_id: string;
  type: 'minimal' | 'contextual' | 'actionable';
  label: string; // "Contrefactuel minimal" etc.
  description_fr: string; // natural language explanation
  description_en: string;
  changed_features: { feature: string; original: string; counterfactual: string }[];
  confidence: number;
  is_helpful?: boolean; // user feedback
}

export interface AnomalyExplanation {
  anomaly_id: string;
  transaction_id: string;
  transaction_description: string;
  anomaly_score: number;
  anomaly_features: { name: string; value: string; contribution: number }[];
  counterfactuals: CounterfactualExplanation[];
  user_feedback?: 'helpful' | 'not_helpful' | null;
  generated_at: string;
}
