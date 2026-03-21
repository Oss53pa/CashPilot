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

export const paymentWorkflowsService = {
  // ---- Payment Requests ----

  async listRequests(companyId: string): Promise<PaymentRequest[]> {
    const { data, error } = await supabase
      .from('payment_requests')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data ?? [];
  },

  async listMyRequests(companyId: string, userId: string): Promise<PaymentRequest[]> {
    const { data, error } = await supabase
      .from('payment_requests')
      .select('*')
      .eq('company_id', companyId)
      .eq('requester_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data ?? [];
  },

  async getById(id: string): Promise<PaymentRequest | null> {
    const { data, error } = await supabase
      .from('payment_requests')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
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

  async getDOARules(companyId: string): Promise<DOARule[]> {
    const { data, error } = await supabase
      .from('doa_rules')
      .select('*')
      .eq('company_id', companyId)
      .order('min_amount', { ascending: true });

    if (error) throw error;
    return (data ?? []) as DOARule[];
  },

  async createDOARule(data: DOARuleFormData & { company_id: string; tenant_id: string }): Promise<DOARule> {
    const { data: created, error } = await supabase
      .from('doa_rules')
      .insert({
        tenant_id: data.tenant_id,
        company_id: data.company_id,
        payment_nature: data.payment_nature,
        min_amount: data.min_amount,
        max_amount: data.max_amount,
        approvers: data.approvers,
        max_delay_hours: data.max_delay_hours,
        requires_convention: data.requires_convention,
      })
      .select()
      .single();

    if (error) throw error;
    return created as DOARule;
  },

  async updateDOARule(id: string, data: Partial<DOARuleFormData>): Promise<DOARule> {
    const { data: updated, error } = await supabase
      .from('doa_rules')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return updated as DOARule;
  },

  async deleteDOARule(id: string): Promise<void> {
    const { error } = await supabase
      .from('doa_rules')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // ---- Approval Chain ----

  async getApprovalChain(paymentRequestId: string): Promise<ApprovalStep[]> {
    const { data, error } = await supabase
      .from('approval_steps')
      .select('*')
      .eq('payment_request_id', paymentRequestId)
      .order('id', { ascending: true });

    if (error) throw error;
    return (data ?? []) as ApprovalStep[];
  },

  routePayment(amount: number, nature: PaymentNature, rules: DOARule[]): { approvers: ApproverRole[]; max_delay_hours: number; requires_convention: boolean } {
    // Find the most specific rule first (specific nature), then fallback to 'all'
    let rule = rules.find(
      (r) => r.payment_nature === nature && amount >= r.min_amount && amount < r.max_amount,
    );
    if (!rule && nature !== 'all') {
      rule = rules.find(
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
    const { data: requests, error } = await supabase
      .from('payment_requests')
      .select('*')
      .eq('status', 'pending_approval')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Enrich with approval chain data
    const enriched: PaymentRequestWithChain[] = [];
    for (const req of requests ?? []) {
      const chain = await this.getApprovalChain(req.id);
      const currentStep = chain.findIndex((s) => s.status === 'pending');

      const enrichedReq: PaymentRequestWithChain = {
        ...req,
        approval_chain: chain,
        current_step: currentStep >= 0 ? currentStep : chain.length - 1,
        escalated: false,
        escalation_date: null,
        payment_nature: 'all' as PaymentNature,
      };

      // Filter by role if specified
      if (role) {
        const currentStepData = chain[currentStep];
        if (currentStepData?.approver_role === role && currentStepData.status === 'pending') {
          enriched.push(enrichedReq);
        }
      } else {
        enriched.push(enrichedReq);
      }
    }

    return enriched;
  },

  // ---- Overdue Approvals ----

  async getOverdueApprovals(companyId: string): Promise<PaymentRequestWithChain[]> {
    // Fetch pending requests and check if they have exceeded max delay
    const { data: requests, error } = await supabase
      .from('payment_requests')
      .select('*')
      .eq('company_id', companyId)
      .eq('status', 'pending_approval')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const rules = await this.getDOARules(companyId);
    const now = new Date();
    const overdue: PaymentRequestWithChain[] = [];

    for (const req of requests ?? []) {
      const chain = await this.getApprovalChain(req.id);
      const currentStep = chain.findIndex((s) => s.status === 'pending');

      // Determine max delay for this request
      const routing = this.routePayment(req.amount, 'all' as PaymentNature, rules);
      const maxDelayMs = routing.max_delay_hours * 60 * 60 * 1000;

      if (maxDelayMs > 0) {
        const createdAt = new Date(req.created_at);
        const elapsed = now.getTime() - createdAt.getTime();
        if (elapsed > maxDelayMs) {
          overdue.push({
            ...req,
            approval_chain: chain,
            current_step: currentStep >= 0 ? currentStep : 0,
            escalated: true,
            escalation_date: new Date(createdAt.getTime() + maxDelayMs).toISOString(),
            payment_nature: 'all' as PaymentNature,
          });
        }
      }
    }

    return overdue;
  },

  // ---- Escalation ----

  async escalatePayment(paymentRequestId: string): Promise<PaymentRequestWithChain> {
    const req = await this.getById(paymentRequestId);
    if (!req) throw new Error('Payment request not found');

    const chain = await this.getApprovalChain(paymentRequestId);
    const currentStep = chain.findIndex((s) => s.status === 'pending');

    return {
      ...req,
      approval_chain: chain,
      current_step: currentStep >= 0 ? currentStep : 0,
      escalated: true,
      escalation_date: new Date().toISOString(),
      payment_nature: 'all' as PaymentNature,
    };
  },

  // ---- Dashboard Stats ----

  async getDashboardStats(companyId: string): Promise<{
    totalPending: number;
    approvedToday: number;
    rejectedToday: number;
    avgApprovalTimeHours: number;
  }> {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayStr = todayStart.toISOString();

    const { count: totalPending } = await supabase
      .from('payment_requests')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .eq('status', 'pending_approval');

    const { count: approvedToday } = await supabase
      .from('payment_requests')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .eq('status', 'approved')
      .gte('updated_at', todayStr);

    const { count: rejectedToday } = await supabase
      .from('payment_requests')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .eq('status', 'rejected')
      .gte('updated_at', todayStr);

    // Average approval time: compute from recent approvals
    const { data: recentApprovals } = await supabase
      .from('payment_approvals')
      .select('decided_at, payment_request_id')
      .order('decided_at', { ascending: false })
      .limit(50);

    let avgApprovalTimeHours = 0;
    if (recentApprovals && recentApprovals.length > 0) {
      // Fetch corresponding requests to compute time delta
      const requestIds = recentApprovals.map((a) => a.payment_request_id);
      const { data: requests } = await supabase
        .from('payment_requests')
        .select('id, created_at')
        .in('id', requestIds);

      if (requests && requests.length > 0) {
        let totalHours = 0;
        let count = 0;
        for (const approval of recentApprovals) {
          const request = requests.find((r) => r.id === approval.payment_request_id);
          if (request && approval.decided_at) {
            const delta =
              new Date(approval.decided_at).getTime() - new Date(request.created_at).getTime();
            totalHours += delta / (1000 * 60 * 60);
            count++;
          }
        }
        avgApprovalTimeHours = count > 0 ? Math.round((totalHours / count) * 10) / 10 : 0;
      }
    }

    return {
      totalPending: totalPending ?? 0,
      approvedToday: approvedToday ?? 0,
      rejectedToday: rejectedToday ?? 0,
      avgApprovalTimeHours,
    };
  },

  // ---- All requests with chain info ----

  async listRequestsWithChain(companyId: string): Promise<PaymentRequestWithChain[]> {
    const requests = await this.listRequests(companyId);
    const enriched: PaymentRequestWithChain[] = [];

    for (const req of requests) {
      const chain = await this.getApprovalChain(req.id);
      const currentStep = chain.findIndex((s) => s.status === 'pending');

      enriched.push({
        ...req,
        approval_chain: chain,
        current_step: currentStep >= 0 ? currentStep : chain.length - 1,
        escalated: false,
        escalation_date: null,
        payment_nature: 'all' as PaymentNature,
      });
    }

    return enriched;
  },
};
