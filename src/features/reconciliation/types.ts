export interface ReconciliationSession {
  id: string;
  tenant_id: string;
  company_id: string;
  account_id: string;
  account_name: string;
  statement_id?: string;
  status: 'active' | 'paused' | 'completed' | 'cancelled';
  created_by: string;
  created_at: string;
  completed_at?: string;
  participants: SessionParticipant[];
  metrics: SessionMetrics;
  unresolved_count: number;
  total_transactions: number;
  resolved_count: number;
}

export interface SessionParticipant {
  user_id: string;
  user_name: string;
  avatar_initial: string;
  color: string;
  role: 'owner' | 'participant';
  joined_at: string;
  last_active: string;
  is_online: boolean;
  current_item_id?: string;
}

export interface ReconciliationItem {
  id: string;
  session_id: string;
  transaction_id?: string;
  type: 'bank_transaction' | 'internal_flow' | 'unidentified';
  date: string;
  amount: number;
  description: string;
  counterparty?: string;
  reference?: string;
  status: 'pending' | 'in_progress' | 'proposed' | 'validated' | 'rejected' | 'skipped';
  locked_by?: string;
  locked_by_name?: string;
  locked_at?: string;
  proposed_match?: ProposedMatch;
  resolution?: ItemResolution;
  comments: ItemComment[];
}

export interface ProposedMatch {
  proposed_by: string;
  proposed_by_name: string;
  proposed_at: string;
  matched_flow_id?: string;
  matched_flow_label?: string;
  match_type: 'exact' | 'approximate' | 'split' | 'new_flow';
  confidence: number;
  notes?: string;
}

export interface ItemResolution {
  resolved_by: string;
  resolved_by_name: string;
  resolved_at: string;
  action: 'matched' | 'created_new' | 'split' | 'skipped' | 'rejected';
  notes?: string;
}

export interface ItemComment {
  id: string;
  user_id: string;
  user_name: string;
  content: string;
  created_at: string;
}

export interface SessionMetrics {
  total_items: number;
  auto_matched: number;
  manual_matched: number;
  pending: number;
  skipped: number;
  rejected: number;
  total_amount_reconciled: number;
  total_amount_pending: number;
  avg_resolution_time_seconds: number;
  session_duration_minutes: number;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  user_id: string;
  user_name: string;
  content: string;
  timestamp: string;
}

export type ReconciliationItemStatus = ReconciliationItem['status'];
export type SessionStatus = ReconciliationSession['status'];
