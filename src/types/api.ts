export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
}

export interface ApiError {
  message: string;
  code: string;
  details?: Record<string, string>;
}

export type SortDirection = 'asc' | 'desc';

export interface SortConfig {
  column: string;
  direction: SortDirection;
}

export interface FilterConfig {
  column: string;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'in';
  value: unknown;
}

export interface ListParams {
  page?: number;
  pageSize?: number;
  sort?: SortConfig;
  filters?: FilterConfig[];
  search?: string;
}
