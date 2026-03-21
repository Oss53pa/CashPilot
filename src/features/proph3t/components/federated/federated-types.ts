// ============================================================================
// Federated Learning Types
// ============================================================================

export interface FederatedConfig {
  is_opted_in: boolean;
  opted_in_at?: string;
  opted_out_at?: string;
  total_participants: number;
  global_model_version: string;
  last_aggregation: string;
  next_aggregation: string;
  privacy_level: 'standard' | 'high';
}

export interface FederatedPerformance {
  metric: string;
  local_only: number;
  with_federated: number;
  improvement_pct: number;
}

export interface FederatedAuditEntry {
  date: string;
  action: 'parameters_shared' | 'global_model_received' | 'opted_in' | 'opted_out';
  model_type: string;
  parameters_count: number;
  dp_noise_level: number;
  description: string;
}
