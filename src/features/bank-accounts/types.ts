import { BankAccount } from '@/types/database';
import { z } from 'zod';

export const bankAccountSchema = z.object({
  bank_name: z.string().min(1, 'Required'),
  account_number: z.string().min(1, 'Required'),
  account_name: z.string().min(1, 'Required'),
  currency: z.string().min(1, 'Required'),
  account_type: z.enum(['current', 'savings', 'mobile_money', 'cash']),
  initial_balance: z.coerce.number(),
  iban: z.string().optional().nullable(),
  swift_code: z.string().optional().nullable(),
  is_active: z.boolean().default(true),
});

export type BankAccountFormData = z.infer<typeof bankAccountSchema>;

export type { BankAccount };

// --- Bank Statement Import ---

export type ImportFormat = 'mt940' | 'camt053' | 'csv' | 'excel';

export type StatementStatus = 'processing' | 'completed' | 'partial';

export interface BankStatement {
  id: string;
  account_id: string;
  file_name: string;
  format: ImportFormat;
  upload_date: string;
  period_start: string;
  period_end: string;
  transaction_count: number;
  matched_count: number;
  unmatched_count: number;
  status: StatementStatus;
}

export type MatchStatus = 'matched' | 'probable' | 'unmatched';

export interface BankTransaction {
  id: string;
  statement_id: string;
  date: string;
  value_date: string;
  amount: number;
  reference: string;
  description: string;
  counterparty_name: string;
  match_status: MatchStatus;
  match_confidence: number;
  matched_flow_id: string | null;
}

export type MatchType =
  | 'exact_ref'
  | 'exact_amount_counterparty'
  | 'amount_date_range'
  | 'approx_amount_counterparty'
  | 'manual';

export interface MatchResult {
  transaction_id: string;
  flow_id: string;
  match_type: MatchType;
  confidence: number;
}

export interface ImportFormatConfig {
  bank_name: string;
  default_format: ImportFormat;
  supported_formats: ImportFormat[];
}

export type AlertRuleType = 'min_balance' | 'max_balance' | 'forecast_deficit' | 'no_import';

export interface AlertRule {
  id: string;
  account_id: string;
  type: AlertRuleType;
  threshold: number;
  enabled: boolean;
}

export interface ActiveAlert {
  id: string;
  rule: AlertRule;
  account_name: string;
  bank_name: string;
  message: string;
  triggered_at: string;
  severity: 'warning' | 'critical';
}
