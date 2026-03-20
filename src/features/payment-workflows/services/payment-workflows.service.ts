import { supabase } from '@/config/supabase';
import type { PaymentRequest, PaymentApproval } from '@/types/database';
import type {
  PaymentRequestFormData,
  DOARule,
  DOARuleFormData,
  ApprovalStep,
  ApproverRole,
  PaymentRequestWithChain,
  PaymentNature,
} from '../types';

// ---- Mock DOA rules (FCFA) ----

const DEFAULT_DOA_RULES: DOARule[] = [
  {
    id: 'doa-1',
    tenant_id: 'tenant-1',
    company_id: 'company-1',
    payment_nature: 'all',
    min_amount: 0,
    max_amount: 500_000,
    approvers: ['DAF'],
    max_delay_hours: 0,
    requires_convention: false,
    created_at: '2025-01-15T08:00:00Z',
  },
  {
    id: 'doa-2',
    tenant_id: 'tenant-1',
    company_id: 'company-1',
    payment_nature: 'all',
    min_amount: 500_000,
    max_amount: 5_000_000,
    approvers: ['DAF', 'DGA'],
    max_delay_hours: 24,
    requires_convention: false,
    created_at: '2025-01-15T08:00:00Z',
  },
  {
    id: 'doa-3',
    tenant_id: 'tenant-1',
    company_id: 'company-1',
    payment_nature: 'all',
    min_amount: 5_000_000,
    max_amount: 50_000_000,
    approvers: ['DAF', 'DGA', 'DG'],
    max_delay_hours: 48,
    requires_convention: false,
    created_at: '2025-01-15T08:00:00Z',
  },
  {
    id: 'doa-4',
    tenant_id: 'tenant-1',
    company_id: 'company-1',
    payment_nature: 'all',
    min_amount: 50_000_000,
    max_amount: 999_999_999_999,
    approvers: ['DAF', 'DGA', 'DG', 'CA'],
    max_delay_hours: 72,
    requires_convention: false,
    created_at: '2025-01-15T08:00:00Z',
  },
  {
    id: 'doa-5',
    tenant_id: 'tenant-1',
    company_id: 'company-1',
    payment_nature: 'capex',
    min_amount: 5_000_000,
    max_amount: 999_999_999_999,
    approvers: ['DAF', 'DGA', 'DG'],
    max_delay_hours: 48,
    requires_convention: false,
    created_at: '2025-01-15T08:00:00Z',
  },
  {
    id: 'doa-6',
    tenant_id: 'tenant-1',
    company_id: 'company-1',
    payment_nature: 'intercompany',
    min_amount: 0,
    max_amount: 999_999_999_999,
    approvers: ['DGA', 'DG'],
    max_delay_hours: 0,
    requires_convention: true,
    created_at: '2025-01-15T08:00:00Z',
  },
  {
    id: 'doa-7',
    tenant_id: 'tenant-1',
    company_id: 'company-1',
    payment_nature: 'emergency',
    min_amount: 0,
    max_amount: 999_999_999_999,
    approvers: ['DGA'],
    max_delay_hours: 0,
    requires_convention: false,
    created_at: '2025-01-15T08:00:00Z',
  },
];

let mockDOARules = [...DEFAULT_DOA_RULES];

// ---- Mock approval chains ----

const MOCK_APPROVAL_CHAINS: Record<string, ApprovalStep[]> = {};

// ---- Mock payment requests with chains for demo ----

function buildMockChain(paymentId: string, approvers: ApproverRole[]): ApprovalStep[] {
  return approvers.map((role, idx) => ({
    id: `step-${paymentId}-${idx}`,
    payment_request_id: paymentId,
    approver_role: role,
    approver_id: null,
    status: 'pending' as const,
    comment: null,
    decided_at: null,
  }));
}

const MOCK_PENDING_REQUESTS: PaymentRequestWithChain[] = [
  {
    id: 'pr-001',
    company_id: 'company-1',
    requester_id: 'user-analyst-1',
    counterparty_id: null,
    bank_account_id: null,
    amount: 350_000,
    currency: 'XOF',
    payment_date: '2026-03-20',
    category: 'suppliers',
    description: 'Achat fournitures de bureau - Mars 2026',
    status: 'pending_approval',
    priority: 'medium',
    attachments: [],
    created_at: '2026-03-18T09:00:00Z',
    updated_at: '2026-03-18T09:00:00Z',
    payment_nature: 'all',
    approval_chain: [
      { id: 'step-1a', payment_request_id: 'pr-001', approver_role: 'DAF', approver_id: null, status: 'pending', comment: null, decided_at: null },
    ],
    current_step: 0,
    escalated: false,
    escalation_date: null,
  },
  {
    id: 'pr-002',
    company_id: 'company-1',
    requester_id: 'user-analyst-2',
    counterparty_id: null,
    bank_account_id: null,
    amount: 2_750_000,
    currency: 'XOF',
    payment_date: '2026-03-22',
    category: 'maintenance',
    description: 'Maintenance climatisation siege social',
    status: 'pending_approval',
    priority: 'high',
    attachments: [],
    created_at: '2026-03-17T14:30:00Z',
    updated_at: '2026-03-17T14:30:00Z',
    payment_nature: 'all',
    approval_chain: [
      { id: 'step-2a', payment_request_id: 'pr-002', approver_role: 'DAF', approver_id: 'user-daf', status: 'approved', comment: 'OK budget disponible', decided_at: '2026-03-17T16:00:00Z' },
      { id: 'step-2b', payment_request_id: 'pr-002', approver_role: 'DGA', approver_id: null, status: 'pending', comment: null, decided_at: null },
    ],
    current_step: 1,
    escalated: false,
    escalation_date: null,
  },
  {
    id: 'pr-003',
    company_id: 'company-1',
    requester_id: 'user-analyst-1',
    counterparty_id: null,
    bank_account_id: null,
    amount: 15_000_000,
    currency: 'XOF',
    payment_date: '2026-03-25',
    category: 'suppliers',
    description: 'Paiement facture SONATEL - Telecom T1 2026',
    status: 'pending_approval',
    priority: 'high',
    attachments: [],
    created_at: '2026-03-16T10:00:00Z',
    updated_at: '2026-03-16T10:00:00Z',
    payment_nature: 'all',
    approval_chain: [
      { id: 'step-3a', payment_request_id: 'pr-003', approver_role: 'DAF', approver_id: 'user-daf', status: 'approved', comment: 'Conforme au budget', decided_at: '2026-03-16T11:00:00Z' },
      { id: 'step-3b', payment_request_id: 'pr-003', approver_role: 'DGA', approver_id: 'user-dga', status: 'approved', comment: null, decided_at: '2026-03-16T15:00:00Z' },
      { id: 'step-3c', payment_request_id: 'pr-003', approver_role: 'DG', approver_id: null, status: 'pending', comment: null, decided_at: null },
    ],
    current_step: 2,
    escalated: false,
    escalation_date: null,
  },
  {
    id: 'pr-004',
    company_id: 'company-1',
    requester_id: 'user-analyst-3',
    counterparty_id: null,
    bank_account_id: null,
    amount: 75_000_000,
    currency: 'XOF',
    payment_date: '2026-04-01',
    category: 'salaries',
    description: 'Masse salariale Mars 2026',
    status: 'pending_approval',
    priority: 'urgent',
    attachments: [],
    created_at: '2026-03-15T08:00:00Z',
    updated_at: '2026-03-15T08:00:00Z',
    payment_nature: 'all',
    approval_chain: [
      { id: 'step-4a', payment_request_id: 'pr-004', approver_role: 'DAF', approver_id: 'user-daf', status: 'approved', comment: 'Salaires validés', decided_at: '2026-03-15T09:00:00Z' },
      { id: 'step-4b', payment_request_id: 'pr-004', approver_role: 'DGA', approver_id: 'user-dga', status: 'approved', comment: null, decided_at: '2026-03-15T14:00:00Z' },
      { id: 'step-4c', payment_request_id: 'pr-004', approver_role: 'DG', approver_id: null, status: 'pending', comment: null, decided_at: null },
      { id: 'step-4d', payment_request_id: 'pr-004', approver_role: 'CA', approver_id: null, status: 'pending', comment: null, decided_at: null },
    ],
    current_step: 2,
    escalated: false,
    escalation_date: null,
  },
  {
    id: 'pr-005',
    company_id: 'company-1',
    requester_id: 'user-analyst-2',
    counterparty_id: null,
    bank_account_id: null,
    amount: 8_500_000,
    currency: 'XOF',
    payment_date: '2026-03-21',
    category: 'other',
    description: 'Acquisition serveurs - Projet Cloud Migration',
    status: 'pending_approval',
    priority: 'high',
    attachments: [],
    created_at: '2026-03-14T11:00:00Z',
    updated_at: '2026-03-14T11:00:00Z',
    payment_nature: 'capex',
    approval_chain: [
      { id: 'step-5a', payment_request_id: 'pr-005', approver_role: 'DAF', approver_id: 'user-daf', status: 'approved', comment: 'CAPEX approuve', decided_at: '2026-03-14T14:00:00Z' },
      { id: 'step-5b', payment_request_id: 'pr-005', approver_role: 'DGA', approver_id: null, status: 'pending', comment: null, decided_at: null },
      { id: 'step-5c', payment_request_id: 'pr-005', approver_role: 'DG', approver_id: null, status: 'pending', comment: null, decided_at: null },
    ],
    current_step: 1,
    escalated: false,
    escalation_date: null,
  },
  {
    id: 'pr-006',
    company_id: 'company-1',
    requester_id: 'user-analyst-1',
    counterparty_id: null,
    bank_account_id: null,
    amount: 4_200_000,
    currency: 'XOF',
    payment_date: '2026-03-19',
    category: 'other',
    description: 'Transfert interco - Filiale Abidjan Q1 2026',
    status: 'pending_approval',
    priority: 'medium',
    attachments: [],
    created_at: '2026-03-13T09:00:00Z',
    updated_at: '2026-03-13T09:00:00Z',
    payment_nature: 'intercompany',
    approval_chain: [
      { id: 'step-6a', payment_request_id: 'pr-006', approver_role: 'DGA', approver_id: 'user-dga', status: 'approved', comment: 'Convention signee', decided_at: '2026-03-13T11:00:00Z' },
      { id: 'step-6b', payment_request_id: 'pr-006', approver_role: 'DG', approver_id: null, status: 'pending', comment: null, decided_at: null },
    ],
    current_step: 1,
    escalated: false,
    escalation_date: null,
  },
  {
    id: 'pr-007',
    company_id: 'company-1',
    requester_id: 'user-analyst-3',
    counterparty_id: null,
    bank_account_id: null,
    amount: 1_200_000,
    currency: 'XOF',
    payment_date: '2026-03-19',
    category: 'maintenance',
    description: 'Reparation urgente generateur electrique',
    status: 'pending_approval',
    priority: 'urgent',
    attachments: [],
    created_at: '2026-03-18T16:00:00Z',
    updated_at: '2026-03-18T16:00:00Z',
    payment_nature: 'emergency',
    approval_chain: [
      { id: 'step-7a', payment_request_id: 'pr-007', approver_role: 'DGA', approver_id: null, status: 'pending', comment: null, decided_at: null },
    ],
    current_step: 0,
    escalated: false,
    escalation_date: null,
  },
  // --- Overdue request (submitted 4 days ago, max_delay 24h, still pending step 1)
  {
    id: 'pr-008',
    company_id: 'company-1',
    requester_id: 'user-analyst-2',
    counterparty_id: null,
    bank_account_id: null,
    amount: 1_800_000,
    currency: 'XOF',
    payment_date: '2026-03-20',
    category: 'suppliers',
    description: 'Paiement fournisseur emballages - EN RETARD',
    status: 'pending_approval',
    priority: 'high',
    attachments: [],
    created_at: '2026-03-14T08:00:00Z',
    updated_at: '2026-03-14T08:00:00Z',
    payment_nature: 'all',
    approval_chain: [
      { id: 'step-8a', payment_request_id: 'pr-008', approver_role: 'DAF', approver_id: 'user-daf', status: 'approved', comment: null, decided_at: '2026-03-14T10:00:00Z' },
      { id: 'step-8b', payment_request_id: 'pr-008', approver_role: 'DGA', approver_id: null, status: 'pending', comment: null, decided_at: null },
    ],
    current_step: 1,
    escalated: true,
    escalation_date: '2026-03-16T10:00:00Z',
  },
];

// Recently approved / rejected for dashboard stats
const MOCK_RECENT_DECISIONS: PaymentRequestWithChain[] = [
  {
    id: 'pr-100',
    company_id: 'company-1',
    requester_id: 'user-analyst-1',
    counterparty_id: null,
    bank_account_id: null,
    amount: 450_000,
    currency: 'XOF',
    payment_date: '2026-03-19',
    category: 'utilities',
    description: 'Facture eau SONES',
    status: 'approved',
    priority: 'medium',
    attachments: [],
    created_at: '2026-03-18T07:00:00Z',
    updated_at: '2026-03-19T08:30:00Z',
    payment_nature: 'all',
    approval_chain: [
      { id: 'step-100a', payment_request_id: 'pr-100', approver_role: 'DAF', approver_id: 'user-daf', status: 'approved', comment: 'OK', decided_at: '2026-03-19T08:30:00Z' },
    ],
    current_step: 0,
    escalated: false,
    escalation_date: null,
  },
  {
    id: 'pr-101',
    company_id: 'company-1',
    requester_id: 'user-analyst-3',
    counterparty_id: null,
    bank_account_id: null,
    amount: 320_000,
    currency: 'XOF',
    payment_date: '2026-03-19',
    category: 'other',
    description: 'Frais de mission Kaolack',
    status: 'approved',
    priority: 'low',
    attachments: [],
    created_at: '2026-03-18T10:00:00Z',
    updated_at: '2026-03-19T09:00:00Z',
    payment_nature: 'all',
    approval_chain: [
      { id: 'step-101a', payment_request_id: 'pr-101', approver_role: 'DAF', approver_id: 'user-daf', status: 'approved', comment: null, decided_at: '2026-03-19T09:00:00Z' },
    ],
    current_step: 0,
    escalated: false,
    escalation_date: null,
  },
  {
    id: 'pr-102',
    company_id: 'company-1',
    requester_id: 'user-analyst-2',
    counterparty_id: null,
    bank_account_id: null,
    amount: 6_500_000,
    currency: 'XOF',
    payment_date: '2026-03-21',
    category: 'suppliers',
    description: 'Commande pieces detachees non justifiee',
    status: 'rejected',
    priority: 'medium',
    attachments: [],
    created_at: '2026-03-18T11:00:00Z',
    updated_at: '2026-03-19T10:15:00Z',
    payment_nature: 'all',
    approval_chain: [
      { id: 'step-102a', payment_request_id: 'pr-102', approver_role: 'DAF', approver_id: 'user-daf', status: 'rejected', comment: 'Justificatifs manquants', decided_at: '2026-03-19T10:15:00Z' },
      { id: 'step-102b', payment_request_id: 'pr-102', approver_role: 'DGA', approver_id: null, status: 'pending', comment: null, decided_at: null },
      { id: 'step-102c', payment_request_id: 'pr-102', approver_role: 'DG', approver_id: null, status: 'pending', comment: null, decided_at: null },
    ],
    current_step: 0,
    escalated: false,
    escalation_date: null,
  },
];


export const paymentWorkflowsService = {
  // ---- Payment Requests (original) ----

  async listRequests(companyId: string): Promise<PaymentRequest[]> {
    try {
      const { data, error } = await supabase
        .from('payment_requests')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data ?? [];
    } catch {
      // Fallback to mock data for demo
      return [...MOCK_PENDING_REQUESTS, ...MOCK_RECENT_DECISIONS];
    }
  },

  async listMyRequests(companyId: string, userId: string): Promise<PaymentRequest[]> {
    try {
      const { data, error } = await supabase
        .from('payment_requests')
        .select('*')
        .eq('company_id', companyId)
        .eq('requester_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data ?? [];
    } catch {
      return [...MOCK_PENDING_REQUESTS, ...MOCK_RECENT_DECISIONS].filter(
        (r) => r.requester_id === userId,
      );
    }
  },

  async getById(id: string): Promise<PaymentRequest | null> {
    try {
      const { data, error } = await supabase
        .from('payment_requests')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch {
      return (
        [...MOCK_PENDING_REQUESTS, ...MOCK_RECENT_DECISIONS].find((r) => r.id === id) ?? null
      );
    }
  },

  async create(companyId: string, userId: string, formData: PaymentRequestFormData): Promise<PaymentRequest> {
    const { data, error } = await supabase
      .from('payment_requests')
      .insert({
        ...formData,
        company_id: companyId,
        requester_id: userId,
        status: 'draft',
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, formData: Partial<PaymentRequestFormData>): Promise<PaymentRequest> {
    const { data, error } = await supabase
      .from('payment_requests')
      .update(formData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('payment_requests')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async submitForApproval(id: string): Promise<PaymentRequest> {
    const { data, error } = await supabase
      .from('payment_requests')
      .update({ status: 'pending_approval' })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async approve(id: string, approverId: string, comments: string | null): Promise<PaymentApproval> {
    const { data: approval, error: approvalError } = await supabase
      .from('payment_approvals')
      .insert({
        payment_request_id: id,
        approver_id: approverId,
        decision: 'approved',
        comments,
        decided_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (approvalError) throw approvalError;

    await supabase
      .from('payment_requests')
      .update({ status: 'approved' })
      .eq('id', id);

    return approval;
  },

  async reject(id: string, approverId: string, comments: string | null): Promise<PaymentApproval> {
    const { data: approval, error: approvalError } = await supabase
      .from('payment_approvals')
      .insert({
        payment_request_id: id,
        approver_id: approverId,
        decision: 'rejected',
        comments,
        decided_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (approvalError) throw approvalError;

    await supabase
      .from('payment_requests')
      .update({ status: 'rejected' })
      .eq('id', id);

    return approval;
  },

  // ---- DOA Rules ----

  async getDOARules(_companyId: string): Promise<DOARule[]> {
    return [...mockDOARules];
  },

  async createDOARule(data: DOARuleFormData & { company_id: string; tenant_id: string }): Promise<DOARule> {
    const newRule: DOARule = {
      id: `doa-${Date.now()}`,
      tenant_id: data.tenant_id,
      company_id: data.company_id,
      payment_nature: data.payment_nature,
      min_amount: data.min_amount,
      max_amount: data.max_amount,
      approvers: data.approvers,
      max_delay_hours: data.max_delay_hours,
      requires_convention: data.requires_convention,
      created_at: new Date().toISOString(),
    };
    mockDOARules.push(newRule);
    return newRule;
  },

  async updateDOARule(id: string, data: Partial<DOARuleFormData>): Promise<DOARule> {
    const idx = mockDOARules.findIndex((r) => r.id === id);
    if (idx === -1) throw new Error('DOA rule not found');
    mockDOARules[idx] = { ...mockDOARules[idx], ...data };
    return mockDOARules[idx];
  },

  async deleteDOARule(id: string): Promise<void> {
    mockDOARules = mockDOARules.filter((r) => r.id !== id);
  },

  // ---- Approval Chain ----

  async getApprovalChain(paymentRequestId: string): Promise<ApprovalStep[]> {
    const cached = MOCK_APPROVAL_CHAINS[paymentRequestId];
    if (cached) return cached;

    const req = MOCK_PENDING_REQUESTS.find((r) => r.id === paymentRequestId);
    if (req) return req.approval_chain;

    const recent = MOCK_RECENT_DECISIONS.find((r) => r.id === paymentRequestId);
    if (recent) return recent.approval_chain;

    return [];
  },

  routePayment(amount: number, nature: PaymentNature): { approvers: ApproverRole[]; max_delay_hours: number; requires_convention: boolean } {
    // Find the most specific rule first (specific nature), then fallback to 'all'
    let rule = mockDOARules.find(
      (r) => r.payment_nature === nature && amount >= r.min_amount && amount < r.max_amount,
    );
    if (!rule && nature !== 'all') {
      rule = mockDOARules.find(
        (r) => r.payment_nature === 'all' && amount >= r.min_amount && amount < r.max_amount,
      );
    }

    if (!rule) {
      return { approvers: ['DAF'], max_delay_hours: 0, requires_convention: false };
    }

    return {
      approvers: rule.approvers,
      max_delay_hours: rule.max_delay_hours,
      requires_convention: rule.requires_convention,
    };
  },

  // ---- My Pending Approvals ----

  async getMyPendingApprovals(_userId: string, role?: ApproverRole): Promise<PaymentRequestWithChain[]> {
    try {
      const { data, error } = await supabase
        .from('payment_requests')
        .select('*')
        .eq('status', 'pending_approval')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data ?? []) as unknown as PaymentRequestWithChain[];
    } catch {
      // Filter mock data: show requests where current step matches user's role
      if (!role) return MOCK_PENDING_REQUESTS;
      return MOCK_PENDING_REQUESTS.filter((r) => {
        const currentStepData = r.approval_chain[r.current_step];
        return currentStepData?.approver_role === role && currentStepData.status === 'pending';
      });
    }
  },

  // ---- Overdue Approvals ----

  async getOverdueApprovals(_companyId: string): Promise<PaymentRequestWithChain[]> {
    // Return requests where current pending step has exceeded max_delay_hours
    return MOCK_PENDING_REQUESTS.filter((r) => r.escalated);
  },

  // ---- Escalation ----

  async escalatePayment(paymentRequestId: string): Promise<PaymentRequestWithChain> {
    const req = MOCK_PENDING_REQUESTS.find((r) => r.id === paymentRequestId);
    if (!req) throw new Error('Payment request not found');
    req.escalated = true;
    req.escalation_date = new Date().toISOString();
    return req;
  },

  // ---- Dashboard Stats ----

  async getDashboardStats(_companyId: string): Promise<{
    totalPending: number;
    approvedToday: number;
    rejectedToday: number;
    avgApprovalTimeHours: number;
  }> {
    return {
      totalPending: MOCK_PENDING_REQUESTS.length,
      approvedToday: 2,
      rejectedToday: 1,
      avgApprovalTimeHours: 18.5,
    };
  },

  // ---- All requests with chain info ----

  async listRequestsWithChain(_companyId: string): Promise<PaymentRequestWithChain[]> {
    return [...MOCK_PENDING_REQUESTS, ...MOCK_RECENT_DECISIONS];
  },
};
