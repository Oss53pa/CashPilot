import { supabase } from '@/config/supabase';
import type { CapexOperation } from '@/types/database';
import type {
  CapexOperationFormData,
  CapexDashboard,
  CapexPaymentSchedule,
  CapexOperationDetail,
  SlippageAlert,
  PaymentStatus,
} from '../types';

export const capexService = {
  async list(companyId: string): Promise<CapexOperation[]> {
    const { data, error } = await supabase
      .from('capex_operations')
      .select('*')
      .eq('company_id', companyId)
      .order('start_date', { ascending: false });

    if (error) throw error;
    return data ?? [];
  },

  async getById(id: string): Promise<CapexOperation | null> {
    const { data, error } = await supabase
      .from('capex_operations')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async create(companyId: string, userId: string, formData: CapexOperationFormData): Promise<CapexOperation> {
    const { data, error } = await supabase
      .from('capex_operations')
      .insert({
        ...formData,
        company_id: companyId,
        created_by: userId,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, formData: Partial<CapexOperationFormData>): Promise<CapexOperation> {
    const { data, error } = await supabase
      .from('capex_operations')
      .update(formData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('capex_operations')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async getDashboard(companyId: string): Promise<CapexDashboard> {
    const operations = await capexService.list(companyId);

    const totalBudget = operations.reduce((sum, op) => sum + op.budget_amount, 0);
    const totalCommitted = operations.reduce((sum, op) => sum + op.committed_amount, 0);
    const totalSpent = operations.reduce((sum, op) => sum + op.spent_amount, 0);
    const completionRate = totalBudget > 0 ? totalSpent / totalBudget : 0;

    // Group by category
    const categoryMap = new Map<string, { budget: number; spent: number }>();
    for (const op of operations) {
      const existing = categoryMap.get(op.category) ?? { budget: 0, spent: 0 };
      existing.budget += op.budget_amount;
      existing.spent += op.spent_amount;
      categoryMap.set(op.category, existing);
    }

    const byCategory = Array.from(categoryMap.entries()).map(([category, data]) => ({
      category,
      budget: data.budget,
      spent: data.spent,
    }));

    return {
      total_budget: totalBudget,
      total_committed: totalCommitted,
      total_spent: totalSpent,
      completion_rate: completionRate,
      by_category: byCategory,
    };
  },

  // --- Payment Schedule ---

  async getPaymentSchedule(capexId: string): Promise<CapexPaymentSchedule[]> {
    const { data, error } = await supabase
      .from('capex_payment_schedules')
      .select('*')
      .eq('capex_id', capexId)
      .order('due_date', { ascending: true });

    if (error) throw error;
    return (data ?? []) as CapexPaymentSchedule[];
  },

  async updatePaymentStatus(
    scheduleId: string,
    status: PaymentStatus,
  ): Promise<CapexPaymentSchedule> {
    const updateData: Record<string, unknown> = { status };
    if (status === 'paid') {
      updateData.actual_date = new Date().toISOString().split('T')[0];
    }

    const { data, error } = await supabase
      .from('capex_payment_schedules')
      .update(updateData)
      .eq('id', scheduleId)
      .select()
      .single();

    if (error) throw error;
    return data as CapexPaymentSchedule;
  },

  // --- Slippage Alerts ---

  async getSlippageAlerts(companyId: string): Promise<SlippageAlert[]> {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // Fetch all capex operations for the company
    const operations = await capexService.list(companyId);
    const operationIds = operations.map((op) => op.id);

    if (operationIds.length === 0) return [];

    // Fetch overdue payment schedules
    const { data: schedules, error } = await supabase
      .from('capex_payment_schedules')
      .select('*')
      .in('capex_id', operationIds)
      .lt('due_date', todayStr)
      .neq('status', 'paid');

    if (error) throw error;

    const alerts: SlippageAlert[] = [];
    for (const schedule of schedules ?? []) {
      const operation = operations.find((op) => op.id === schedule.capex_id);
      if (!operation) continue;

      const dueDate = new Date(schedule.due_date);
      const daysOverdue = Math.floor(
        (today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24),
      );

      alerts.push({
        capex_id: operation.id,
        capex_code: `CAPEX-${operation.id.slice(0, 8).toUpperCase()}`,
        capex_name: operation.name,
        payment_id: schedule.id,
        payment_label: schedule.label,
        due_date: schedule.due_date,
        days_overdue: daysOverdue,
        amount: schedule.amount,
        currency: operation.currency,
      });
    }

    return alerts;
  },

  // --- Full Detail ---

  async getCapexDetail(capexId: string): Promise<CapexOperationDetail | null> {
    const { data: operation, error: opError } = await supabase
      .from('capex_operations')
      .select('*')
      .eq('id', capexId)
      .single();

    if (opError) throw opError;
    if (!operation) return null;

    // Fetch company name
    const { data: company } = await supabase
      .from('companies')
      .select('name')
      .eq('id', operation.company_id)
      .maybeSingle();

    // Fetch payment schedule
    const paymentSchedule = await capexService.getPaymentSchedule(capexId);

    // Compute invoiced and retention amounts from payment schedule
    const invoicedAmount = paymentSchedule
      .filter((p) => p.invoice_reference !== null)
      .reduce((sum, p) => sum + p.amount, 0);
    const retentionAmount = paymentSchedule
      .filter((p) => p.label === 'retention')
      .reduce((sum, p) => sum + p.amount, 0);

    // Compute slippage days
    const overduePayments = paymentSchedule.filter(
      (p) => p.status !== 'paid' && new Date(p.due_date) < new Date(),
    );
    const slippageDays = overduePayments.length > 0
      ? Math.floor(
          (new Date().getTime() - new Date(overduePayments[0].due_date).getTime()) /
            (1000 * 60 * 60 * 24),
        )
      : 0;

    // Fetch contractor info from capex_contractors table if it exists
    const { data: contractor } = await supabase
      .from('capex_contractors')
      .select('*')
      .eq('capex_id', capexId)
      .maybeSingle();

    return {
      id: operation.id,
      code: `CAPEX-${operation.id.slice(0, 8).toUpperCase()}`,
      name: operation.name,
      description: operation.description,
      category: operation.category,
      company_id: operation.company_id,
      company_name: company?.name,
      budget_amount: operation.budget_amount,
      committed_amount: operation.committed_amount,
      spent_amount: operation.spent_amount,
      invoiced_amount: invoicedAmount,
      retention_amount: retentionAmount,
      slippage_days: slippageDays,
      currency: operation.currency,
      status: operation.status,
      start_date: operation.start_date,
      end_date: operation.end_date,
      contractor: contractor ?? {
        name: '',
        contract_reference: '',
        contract_amount_ht: 0,
        vat_rate: 18,
        amount_ttc: 0,
        retention_rate: 0,
        retention_amount: 0,
        retention_release_date: '',
      },
      payment_schedule: paymentSchedule,
    };
  },

  getAllMockDetailIds(): string[] {
    // No more mock data; return empty array
    return [];
  },

  getAllMockDetails(): CapexOperationDetail[] {
    // No more mock data; return empty array
    return [];
  },
};
