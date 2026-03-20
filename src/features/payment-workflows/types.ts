import { z } from 'zod';
import type { PaymentRequest, PaymentApproval } from '@/types/database';

// --- DOA Rule ---

export type PaymentNature = 'all' | 'capex' | 'intercompany' | 'emergency';
export type ApproverRole = 'DAF' | 'DGA' | 'DG' | 'CA';
export type ApprovalStepStatus = 'pending' | 'approved' | 'rejected';

export interface DOARule {
  id: string;
  tenant_id: string;
  company_id: string;
  payment_nature: PaymentNature;
  min_amount: number;
  max_amount: number;
  approvers: ApproverRole[];
  max_delay_hours: number;
  requires_convention: boolean;
  created_at: string;
}

export interface ApprovalStep {
  id: string;
  payment_request_id: string;
  approver_role: ApproverRole;
  approver_id: string | null;
  status: ApprovalStepStatus;
  comment: string | null;
  decided_at: string | null;
}

export interface PaymentRequestWithChain extends PaymentRequest {
  approval_chain: ApprovalStep[];
  current_step: number;
  escalated: boolean;
  escalation_date: string | null;
  payment_nature: PaymentNature;
}

// --- Schemas ---

export const paymentRequestSchema = z.object({
  counterparty_id: z.string().optional().nullable(),
  bank_account_id: z.string().optional().nullable(),
  amount: z.coerce.number().positive('Amount must be positive'),
  currency: z.string().min(1, 'Currency is required'),
  payment_date: z.string().min(1, 'Payment date is required'),
  category: z.string().min(1, 'Category is required'),
  description: z.string().min(1, 'Description is required'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  attachments: z.array(z.string()).default([]),
});

export const doaRuleSchema = z.object({
  payment_nature: z.enum(['all', 'capex', 'intercompany', 'emergency']),
  min_amount: z.coerce.number().min(0, 'Min amount must be >= 0'),
  max_amount: z.coerce.number().positive('Max amount must be positive'),
  approvers: z.array(z.enum(['DAF', 'DGA', 'DG', 'CA'])).min(1, 'At least one approver required'),
  max_delay_hours: z.coerce.number().min(0, 'Max delay must be >= 0'),
  requires_convention: z.boolean().default(false),
});

export const doaSettingsSchema = z.object({
  role: z.string().min(1, 'Role is required'),
  max_amount: z.coerce.number().positive('Amount must be positive'),
  currency: z.string().min(1, 'Currency is required'),
  requires_second_approval: z.boolean().default(false),
});

export type PaymentRequestFormData = z.infer<typeof paymentRequestSchema>;
export type DOARuleFormData = z.infer<typeof doaRuleSchema>;
export type DoaSettingsFormData = z.infer<typeof doaSettingsSchema>;

export type { PaymentRequest, PaymentApproval };
