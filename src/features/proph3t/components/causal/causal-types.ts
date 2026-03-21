// ============================================================================
// Causal AI Types
// ============================================================================

export interface CausalGraphNode {
  id: string;
  label: string;
  category: 'revenue' | 'expense' | 'external' | 'position';
  x?: number;
  y?: number;
}

export interface CausalGraphEdge {
  source: string;
  target: string;
  strength: number; // 0-1
  direction: 'causes' | 'prevents';
  confidence: number;
  lag_days?: number;
  description: string;
}

export interface CausalGraph {
  nodes: CausalGraphNode[];
  edges: CausalGraphEdge[];
  last_updated: string;
  min_history_months: number;
}

export interface CausalDecomposition {
  period: string;
  total_variation: number;
  causes: CausalCause[];
  residual_pct: number;
  residual_amount: number;
}

export interface CausalCause {
  label: string;
  amount: number;
  pct: number;
  type: 'direct' | 'indirect' | 'root_cause';
  confidence: number;
  description: string;
  children?: CausalCause[];
}

export interface CausalIntervention {
  question: string;
  intervention_variable: string;
  intervention_value: string;
  estimated_effect: number;
  confidence: number;
  explanation: string;
}

export interface GrangerCausalityResult {
  source: string;
  target: string;
  lag_days: number;
  p_value: number;
  is_significant: boolean;
  description: string;
}
