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

// --- Mock data for detailed CAPEX operations ---

const MOCK_DETAILS: Record<string, CapexOperationDetail> = {
  'capex-mock-001': {
    id: 'capex-mock-001',
    code: 'CAPEX-ABJ-2026-001',
    name: 'Rehabilitation facade Tour Ivoire',
    description: 'Ravalement et etancheite de la facade principale - Tour Ivoire, Plateau Abidjan',
    category: 'building',
    company_id: 'company-1',
    company_name: 'SCI Tour Ivoire',
    budget_amount: 185000000,
    committed_amount: 175000000,
    spent_amount: 128500000,
    invoiced_amount: 145000000,
    retention_amount: 8750000,
    slippage_days: 12,
    currency: 'XOF',
    status: 'in_progress',
    start_date: '2025-11-15',
    end_date: '2026-06-30',
    contractor: {
      name: 'SOGECI BTP',
      contract_reference: 'CTR-SOGECI-2025-0892',
      contract_amount_ht: 175000000,
      vat_rate: 18,
      amount_ttc: 206500000,
      retention_rate: 5,
      retention_amount: 8750000,
      retention_release_date: '2026-12-31',
    },
    payment_schedule: [
      {
        id: 'pay-001',
        capex_id: 'capex-mock-001',
        label: 'advance',
        amount: 35000000,
        due_date: '2025-11-30',
        actual_date: '2025-11-28',
        status: 'paid',
        invoice_reference: 'FAC-SOGECI-2025-1201',
      },
      {
        id: 'pay-002',
        capex_id: 'capex-mock-001',
        label: 'progress_1',
        amount: 52500000,
        due_date: '2026-01-31',
        actual_date: '2026-02-05',
        status: 'paid',
        invoice_reference: 'FAC-SOGECI-2026-0087',
      },
      {
        id: 'pay-003',
        capex_id: 'capex-mock-001',
        label: 'progress_2',
        amount: 52500000,
        due_date: '2026-03-15',
        actual_date: null,
        status: 'overdue',
        invoice_reference: 'FAC-SOGECI-2026-0234',
      },
      {
        id: 'pay-004',
        capex_id: 'capex-mock-001',
        label: 'final',
        amount: 26250000,
        due_date: '2026-06-30',
        actual_date: null,
        status: 'scheduled',
        invoice_reference: null,
      },
      {
        id: 'pay-005',
        capex_id: 'capex-mock-001',
        label: 'retention',
        amount: 8750000,
        due_date: '2026-12-31',
        actual_date: null,
        status: 'scheduled',
        invoice_reference: null,
      },
    ],
  },
  'capex-mock-002': {
    id: 'capex-mock-002',
    code: 'CAPEX-CY-2026-003',
    name: 'Extension parking Cocody',
    description: 'Construction de 120 places de parking supplementaires - Residence Les Palmiers, Cocody',
    category: 'building',
    company_id: 'company-1',
    company_name: 'SCI Les Palmiers',
    budget_amount: 95000000,
    committed_amount: 92000000,
    spent_amount: 42000000,
    invoiced_amount: 55000000,
    retention_amount: 4600000,
    slippage_days: 0,
    currency: 'XOF',
    status: 'in_progress',
    start_date: '2026-01-10',
    end_date: '2026-08-31',
    contractor: {
      name: 'EGC Construction',
      contract_reference: 'CTR-EGC-2026-0145',
      contract_amount_ht: 92000000,
      vat_rate: 18,
      amount_ttc: 108560000,
      retention_rate: 5,
      retention_amount: 4600000,
      retention_release_date: '2027-02-28',
    },
    payment_schedule: [
      {
        id: 'pay-006',
        capex_id: 'capex-mock-002',
        label: 'advance',
        amount: 18400000,
        due_date: '2026-01-20',
        actual_date: '2026-01-18',
        status: 'paid',
        invoice_reference: 'FAC-EGC-2026-0012',
      },
      {
        id: 'pay-007',
        capex_id: 'capex-mock-002',
        label: 'progress_1',
        amount: 27600000,
        due_date: '2026-03-31',
        actual_date: null,
        status: 'invoiced',
        invoice_reference: 'FAC-EGC-2026-0089',
      },
      {
        id: 'pay-008',
        capex_id: 'capex-mock-002',
        label: 'progress_2',
        amount: 27600000,
        due_date: '2026-06-15',
        actual_date: null,
        status: 'scheduled',
        invoice_reference: null,
      },
      {
        id: 'pay-009',
        capex_id: 'capex-mock-002',
        label: 'final',
        amount: 13800000,
        due_date: '2026-08-31',
        actual_date: null,
        status: 'scheduled',
        invoice_reference: null,
      },
      {
        id: 'pay-010',
        capex_id: 'capex-mock-002',
        label: 'retention',
        amount: 4600000,
        due_date: '2027-02-28',
        actual_date: null,
        status: 'scheduled',
        invoice_reference: null,
      },
    ],
  },
  'capex-mock-003': {
    id: 'capex-mock-003',
    code: 'CAPEX-ABJ-2026-005',
    name: 'Remplacement systeme CVC - Immeuble Plateau',
    description: 'Installation nouveau systeme de climatisation centrale (HVAC) - Immeuble Le Plateau',
    category: 'equipment',
    company_id: 'company-1',
    company_name: 'SCI Le Plateau',
    budget_amount: 68000000,
    committed_amount: 65000000,
    spent_amount: 65000000,
    invoiced_amount: 65000000,
    retention_amount: 3250000,
    slippage_days: 0,
    currency: 'XOF',
    status: 'completed',
    start_date: '2025-09-01',
    end_date: '2026-02-28',
    contractor: {
      name: 'Clim Afrique SARL',
      contract_reference: 'CTR-CLIM-2025-0567',
      contract_amount_ht: 65000000,
      vat_rate: 18,
      amount_ttc: 76700000,
      retention_rate: 5,
      retention_amount: 3250000,
      retention_release_date: '2026-08-31',
    },
    payment_schedule: [
      {
        id: 'pay-011',
        capex_id: 'capex-mock-003',
        label: 'advance',
        amount: 19500000,
        due_date: '2025-09-15',
        actual_date: '2025-09-12',
        status: 'paid',
        invoice_reference: 'FAC-CLIM-2025-0234',
      },
      {
        id: 'pay-012',
        capex_id: 'capex-mock-003',
        label: 'progress_1',
        amount: 22750000,
        due_date: '2025-11-30',
        actual_date: '2025-12-02',
        status: 'paid',
        invoice_reference: 'FAC-CLIM-2025-0312',
      },
      {
        id: 'pay-013',
        capex_id: 'capex-mock-003',
        label: 'final',
        amount: 19500000,
        due_date: '2026-02-28',
        actual_date: '2026-02-27',
        status: 'paid',
        invoice_reference: 'FAC-CLIM-2026-0045',
      },
      {
        id: 'pay-014',
        capex_id: 'capex-mock-003',
        label: 'retention',
        amount: 3250000,
        due_date: '2026-08-31',
        actual_date: null,
        status: 'scheduled',
        invoice_reference: null,
      },
    ],
  },
};

export const capexService = {
  async list(companyId: string): Promise<CapexOperation[]> {
    try {
      const { data, error } = await supabase
        .from('capex_operations')
        .select('*')
        .eq('company_id', companyId)
        .order('start_date', { ascending: false });

      if (error) throw error;
      return data ?? [];
    } catch {
      return [];
    }
  },

  async getById(id: string): Promise<CapexOperation | null> {
    try {
      const { data, error } = await supabase
        .from('capex_operations')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch {
      return null;
    }
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
    try {
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
    } catch {
      return {
        total_budget: 0,
        total_committed: 0,
        total_spent: 0,
        completion_rate: 0,
        by_category: [],
      };
    }
  },

  // --- Payment Schedule ---

  async getPaymentSchedule(capexId: string): Promise<CapexPaymentSchedule[]> {
    await new Promise((resolve) => setTimeout(resolve, 200));
    const detail = Object.values(MOCK_DETAILS).find((d) => d.id === capexId);
    return detail?.payment_schedule ?? [];
  },

  async updatePaymentStatus(
    scheduleId: string,
    status: PaymentStatus,
  ): Promise<CapexPaymentSchedule> {
    await new Promise((resolve) => setTimeout(resolve, 200));
    // Find the payment across all mock details
    for (const detail of Object.values(MOCK_DETAILS)) {
      const payment = detail.payment_schedule.find((p) => p.id === scheduleId);
      if (payment) {
        return {
          ...payment,
          status,
          actual_date: status === 'paid' ? new Date().toISOString().split('T')[0] : payment.actual_date,
        };
      }
    }
    throw new Error('Payment schedule not found');
  },

  // --- Slippage Alerts ---

  async getSlippageAlerts(_companyId: string): Promise<SlippageAlert[]> {
    await new Promise((resolve) => setTimeout(resolve, 200));
    const today = new Date('2026-03-19');

    const alerts: SlippageAlert[] = [];
    for (const detail of Object.values(MOCK_DETAILS)) {
      for (const payment of detail.payment_schedule) {
        if (
          payment.status !== 'paid' &&
          payment.status !== 'scheduled' &&
          new Date(payment.due_date) < today
        ) {
          const dueDate = new Date(payment.due_date);
          const daysOverdue = Math.floor(
            (today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24),
          );
          alerts.push({
            capex_id: detail.id,
            capex_code: detail.code,
            capex_name: detail.name,
            payment_id: payment.id,
            payment_label: payment.label,
            due_date: payment.due_date,
            days_overdue: daysOverdue,
            amount: payment.amount,
            currency: detail.currency,
          });
        }
        // Also include overdue ones
        if (payment.status === 'overdue') {
          const dueDate = new Date(payment.due_date);
          const daysOverdue = Math.floor(
            (today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24),
          );
          if (!alerts.find((a) => a.payment_id === payment.id)) {
            alerts.push({
              capex_id: detail.id,
              capex_code: detail.code,
              capex_name: detail.name,
              payment_id: payment.id,
              payment_label: payment.label,
              due_date: payment.due_date,
              days_overdue: daysOverdue,
              amount: payment.amount,
              currency: detail.currency,
            });
          }
        }
      }
    }
    return alerts;
  },

  // --- Full Detail ---

  async getCapexDetail(capexId: string): Promise<CapexOperationDetail | null> {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return MOCK_DETAILS[capexId] ?? null;
  },

  getAllMockDetailIds(): string[] {
    return Object.keys(MOCK_DETAILS);
  },

  getAllMockDetails(): CapexOperationDetail[] {
    return Object.values(MOCK_DETAILS);
  },
};
