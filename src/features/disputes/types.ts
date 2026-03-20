import { z } from 'zod';
import type { DisputeFile } from '@/types/database';

export const disputeFileSchema = z.object({
  reference: z.string().min(1, 'Reference is required'),
  counterparty_id: z.string().min(1, 'Counterparty is required'),
  type: z.enum(['litigation', 'arbitration', 'mediation', 'recovery']),
  amount_disputed: z.coerce.number().positive('Amount must be positive'),
  amount_provision: z.coerce.number().min(0, 'Provision cannot be negative'),
  currency: z.string().min(1, 'Currency is required'),
  status: z.enum(['open', 'in_progress', 'settled', 'closed', 'written_off']).default('open'),
  opened_date: z.string().min(1, 'Opened date is required'),
  closed_date: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  lawyer: z.string().optional().nullable(),
  court: z.string().optional().nullable(),
  next_hearing: z.string().optional().nullable(),
  exit_scenario: z.enum(['favorable', 'neutral', 'unfavorable']).optional().nullable(),
  probability: z.coerce.number().min(0).max(100).optional().nullable(),
});

export type DisputeFileFormData = z.infer<typeof disputeFileSchema>;

export type { DisputeFile };

// Exit Scenario
export interface ExitScenario {
  id: string;
  dispute_id: string;
  label: string;
  probability_pct: number;
  expected_amount: number;
  expected_date: string;
  description: string;
}

// Dispute Dashboard
export interface DisputeDashboard {
  active_count: number;
  total_litigated: number;
  total_provisions: number;
  expected_net_value: number;
  upcoming_hearings: {
    dispute_id: string;
    reference: string;
    hearing_date: string;
    court: string;
    days_until: number;
  }[];
}
