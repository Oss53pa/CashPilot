import { supabase } from '@/config/supabase';

export interface AuditLogFilters {
  dateFrom?: string;
  dateTo?: string;
  userId?: string;
  module?: string;
  action?: string;
}

export type ClosingStepStatus = 'pending' | 'in_progress' | 'completed' | 'blocked';

export interface ClosingStep {
  step: number;
  label: string;
  description: string;
  status: ClosingStepStatus;
  completed_at?: string;
  completed_by?: string;
}

export interface PeriodClosingStatus {
  id: string;
  company_id: string;
  period: string;
  status: 'open' | 'in_progress' | 'closed';
  steps: ClosingStep[];
  initiated_at: string;
  initiated_by: string;
  closed_at?: string;
  closed_by?: string;
}

export interface ReconciliationLine {
  label: string;
  amount: number;
}

export interface ReconciliationResult {
  company_id: string;
  period: string;
  lines: ReconciliationLine[];
  bank_position: number;
  computed_position: number;
  variance: number;
  status: 'OK' | 'BLOCKED';
}

const DEFAULT_CLOSING_STEPS: Omit<ClosingStep, 'status'>[] = [
  { step: 1, label: 'Bank Reconciliation', description: 'All bank accounts reconciled' },
  { step: 2, label: 'Unidentified Flows', description: 'Validation queue empty — all flows identified' },
  { step: 3, label: 'Cash & Mobile Money Counts', description: 'Physical cash and mobile money counts completed' },
  { step: 4, label: 'Inter-module Reconciliation', description: 'Variance between modules equals zero' },
  { step: 5, label: 'Accounting Export', description: 'General ledger export generated and validated' },
  { step: 6, label: 'CFO Validation', description: 'Digital signature from CFO obtained' },
];

export const auditTrailService = {
  async list(companyId: string, filters?: AuditLogFilters) {
    let query = supabase
      .from('audit_logs')
      .select('*, user:user_id(id, full_name, email, avatar_url)')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (filters?.dateFrom) {
      query = query.gte('created_at', filters.dateFrom);
    }
    if (filters?.dateTo) {
      query = query.lte('created_at', filters.dateTo);
    }
    if (filters?.userId) {
      query = query.eq('user_id', filters.userId);
    }
    if (filters?.module) {
      query = query.eq('module', filters.module);
    }
    if (filters?.action) {
      query = query.eq('action', filters.action);
    }

    const { data, error } = await query.limit(500);
    if (error) throw error;
    return data;
  },

  async getByEntity(entityType: string, entityId: string) {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*, user:user_id(id, full_name, email, avatar_url)')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async getAuditLog(logId: string) {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*, user:user_id(id, full_name, email, avatar_url)')
      .eq('id', logId)
      .single();
    if (error) throw error;
    // Include reason field from new_values if present
    return {
      ...data,
      reason: data?.new_values?.reason ?? data?.old_values?.reason ?? null,
    };
  },

  async getPeriodClosingStatus(
    companyId: string,
    period: string,
  ): Promise<PeriodClosingStatus> {
    // Mock implementation — in production this would query a period_closings table
    return {
      id: `closing-${companyId}-${period}`,
      company_id: companyId,
      period,
      status: 'open',
      steps: DEFAULT_CLOSING_STEPS.map((s) => ({
        ...s,
        status: 'pending' as ClosingStepStatus,
      })),
      initiated_at: new Date().toISOString(),
      initiated_by: 'system',
    };
  },

  async initiatePeriodClosing(
    companyId: string,
    period: string,
  ): Promise<PeriodClosingStatus> {
    // Mock: start a 6-step closing
    return {
      id: `closing-${companyId}-${period}`,
      company_id: companyId,
      period,
      status: 'in_progress',
      steps: DEFAULT_CLOSING_STEPS.map((s, idx) => ({
        ...s,
        status: (idx === 0 ? 'in_progress' : 'pending') as ClosingStepStatus,
      })),
      initiated_at: new Date().toISOString(),
      initiated_by: 'current-user',
    };
  },

  async updateClosingStep(
    closingId: string,
    step: number,
    status: ClosingStepStatus,
  ): Promise<PeriodClosingStatus> {
    // Mock: update the step status
    const steps = DEFAULT_CLOSING_STEPS.map((s) => ({
      ...s,
      status: (s.step < step
        ? 'completed'
        : s.step === step
          ? status
          : 'pending') as ClosingStepStatus,
      completed_at: s.step < step ? new Date().toISOString() : undefined,
    }));

    return {
      id: closingId,
      company_id: '',
      period: '',
      status: 'in_progress',
      steps,
      initiated_at: new Date().toISOString(),
      initiated_by: 'current-user',
    };
  },

  async completePeriodClosing(closingId: string): Promise<PeriodClosingStatus> {
    return {
      id: closingId,
      company_id: '',
      period: '',
      status: 'closed',
      steps: DEFAULT_CLOSING_STEPS.map((s) => ({
        ...s,
        status: 'completed' as ClosingStepStatus,
        completed_at: new Date().toISOString(),
        completed_by: 'current-user',
      })),
      initiated_at: new Date().toISOString(),
      initiated_by: 'current-user',
      closed_at: new Date().toISOString(),
      closed_by: 'current-user',
    };
  },

  async getReconciliation(
    companyId: string,
    period: string,
  ): Promise<ReconciliationResult> {
    // Mock reconciliation data with realistic FCFA amounts
    const lines: ReconciliationLine[] = [
      { label: 'Opening Balance', amount: 245_000_000 },
      { label: 'Confirmed Receipts', amount: 187_500_000 },
      { label: 'Confirmed Disbursements', amount: -142_300_000 },
      { label: 'Incoming Transfers', amount: 35_000_000 },
      { label: 'Outgoing Transfers', amount: -28_750_000 },
      { label: 'Cash', amount: 12_800_000 },
      { label: 'Mobile Money', amount: 8_450_000 },
      { label: 'Gift Card Liabilities', amount: -2_700_000 },
    ];

    const computedPosition = lines.reduce((sum, l) => sum + l.amount, 0);
    const bankPosition = 315_000_000;
    const variance = computedPosition - bankPosition;

    return {
      company_id: companyId,
      period,
      lines,
      bank_position: bankPosition,
      computed_position: computedPosition,
      variance,
      status: variance === 0 ? 'OK' : 'BLOCKED',
    };
  },
};
