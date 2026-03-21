export type AnnotationType = 'comment' | 'tag' | 'flag' | 'document_link' | 'mention' | 'resolution';
export type AnnotationVisibility = 'shared' | 'private';
export type EntityType =
  | 'cash_flow'
  | 'receivable'
  | 'payable'
  | 'forecast'
  | 'alert'
  | 'budget_line'
  | 'dispute'
  | 'capex'
  | 'bank_account'
  | 'counterparty'
  | 'tft_line'
  | 'forecast_cell';

export interface Annotation {
  id: string;
  tenant_id: string;
  company_id: string;
  entity_type: EntityType;
  entity_id: string;
  entity_label?: string;
  parent_id?: string;
  author_id: string;
  author_name: string;
  author_avatar?: string;
  type: AnnotationType;
  content: string;
  tags?: string[];
  flag_level?: 'info' | 'warning' | 'critical';
  document_url?: string;
  mentioned_user_ids?: string[];
  visibility: AnnotationVisibility;
  is_resolved: boolean;
  resolved_by?: string;
  resolved_at?: string;
  resolution_note?: string;
  created_at: string;
  updated_at: string;
  replies_count: number;
}

export interface AnnotationFormData {
  entity_type: EntityType;
  entity_id: string;
  entity_label?: string;
  type: AnnotationType;
  content: string;
  tags?: string[];
  flag_level?: string;
  document_url?: string;
  mentioned_user_ids?: string[];
  visibility: AnnotationVisibility;
  parent_id?: string;
}

export interface AnnotationThread {
  root: Annotation;
  replies: Annotation[];
}

export interface AnnotationFilter {
  entity_type?: EntityType;
  entity_id?: string;
  author_id?: string;
  type?: AnnotationType;
  visibility?: AnnotationVisibility;
  is_resolved?: boolean;
  search?: string;
  date_from?: string;
  date_to?: string;
}

export interface AnnotationStats {
  total: number;
  unresolved: number;
  flags_critical: number;
  flags_warning: number;
  mentions_unread: number;
  recent: Annotation[];
}
