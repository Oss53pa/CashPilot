import { supabase } from '@/config/supabase';
import type { DebtContract, DebtContractFormData, DebtSummary, RepaymentScheduleItem, FinancingPlan } from '../types';

export const debtService = {
  async list(companyId: string): Promise<DebtContract[]> {
    const { data, error } = await supabase
      .from('debt_contracts')
      .select('*')
      .eq('company_id', companyId)
      .order('maturity_date');

    if (error) throw error;
    return data ?? [];
  },

  async getById(id: string): Promise<DebtContract> {
    const { data, error } = await supabase
      .from('debt_contracts')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async create(companyId: string, formData: DebtContractFormData): Promise<DebtContract> {
    const { data, error } = await supabase
      .from('debt_contracts')
      .insert({
        ...formData,
        company_id: companyId,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, formData: Partial<DebtContractFormData>): Promise<DebtContract> {
    const { data, error } = await supabase
      .from('debt_contracts')
      .update(formData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('debt_contracts')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async getDebtSummary(companyId: string): Promise<DebtSummary> {
    const { data, error } = await supabase
      .from('debt_contracts')
      .select('*')
      .eq('company_id', companyId);

    if (error) throw error;

    const contracts = data ?? [];
    const totalDebt = contracts.reduce((sum, c) => sum + c.principal_amount, 0);
    const totalOutstanding = contracts.reduce((sum, c) => sum + c.outstanding_amount, 0);

    const weightedAvgRate =
      totalOutstanding > 0
        ? contracts.reduce((sum, c) => sum + c.interest_rate * c.outstanding_amount, 0) / totalOutstanding
        : 0;

    // Find the next payment due (closest maturity in the future)
    const now = new Date();
    const futureContracts = contracts
      .filter((c) => new Date(c.maturity_date) >= now)
      .sort((a, b) => new Date(a.maturity_date).getTime() - new Date(b.maturity_date).getTime());

    return {
      total_debt: totalDebt,
      total_outstanding: totalOutstanding,
      weighted_avg_rate: Math.round(weightedAvgRate * 100) / 100,
      next_payment_due: futureContracts.length > 0 ? futureContracts[0].maturity_date : null,
    };
  },

  async getRepaymentSchedule(contractId: string): Promise<RepaymentScheduleItem[]> {
    // Generate a simplified repayment schedule based on contract terms
    const contract = await debtService.getById(contractId);

    const frequencyMonths: Record<string, number> = {
      monthly: 1,
      quarterly: 3,
      semi_annual: 6,
      annual: 12,
      bullet: 0,
    };

    const months = frequencyMonths[contract.payment_frequency] || 0;

    if (months === 0) {
      // Bullet payment - single repayment at maturity
      return [
        {
          date: contract.maturity_date,
          principal_portion: contract.outstanding_amount,
          interest_portion:
            (contract.outstanding_amount * contract.interest_rate) / 100,
          total:
            contract.outstanding_amount +
            (contract.outstanding_amount * contract.interest_rate) / 100,
          remaining_balance: 0,
        },
      ];
    }

    const schedule: RepaymentScheduleItem[] = [];
    const start = new Date(contract.start_date);
    const maturity = new Date(contract.maturity_date);
    const totalMonths = Math.max(
      1,
      (maturity.getFullYear() - start.getFullYear()) * 12 +
        (maturity.getMonth() - start.getMonth()),
    );
    const numberOfPayments = Math.ceil(totalMonths / months);
    const principalPerPayment = contract.outstanding_amount / numberOfPayments;
    let remainingBalance = contract.outstanding_amount;

    for (let i = 0; i < numberOfPayments; i++) {
      const paymentDate = new Date(start);
      paymentDate.setMonth(paymentDate.getMonth() + months * (i + 1));

      const interestPortion = (remainingBalance * contract.interest_rate) / 100 / (12 / months);
      const principalPortion = Math.min(principalPerPayment, remainingBalance);
      remainingBalance = Math.max(0, remainingBalance - principalPortion);

      schedule.push({
        date: paymentDate.toISOString().split('T')[0],
        principal_portion: Math.round(principalPortion * 100) / 100,
        interest_portion: Math.round(interestPortion * 100) / 100,
        total: Math.round((principalPortion + interestPortion) * 100) / 100,
        remaining_balance: Math.round(remainingBalance * 100) / 100,
      });
    }

    return schedule;
  },

  async getFinancingPlan(_companyId: string): Promise<FinancingPlan> {
    // Mock data in FCFA (2026-2028)
    return {
      years: [
        {
          year: 2026,
          needs: {
            capex: 450000000,
            loan_repayments: 180000000,
            working_capital: 75000000,
            total: 705000000,
          },
          resources: {
            operating_cash_flow: 520000000,
            available_cash: 150000000,
            maturing_investments: 80000000,
            credit_lines: 200000000,
            total: 950000000,
          },
          balance: 245000000,
        },
        {
          year: 2027,
          needs: {
            capex: 320000000,
            loan_repayments: 195000000,
            working_capital: 90000000,
            total: 605000000,
          },
          resources: {
            operating_cash_flow: 580000000,
            available_cash: 100000000,
            maturing_investments: 50000000,
            credit_lines: 150000000,
            total: 880000000,
          },
          balance: 275000000,
        },
        {
          year: 2028,
          needs: {
            capex: 680000000,
            loan_repayments: 210000000,
            working_capital: 120000000,
            total: 1010000000,
          },
          resources: {
            operating_cash_flow: 620000000,
            available_cash: 80000000,
            maturing_investments: 30000000,
            credit_lines: 100000000,
            total: 830000000,
          },
          balance: -180000000,
        },
      ],
    };
  },
};
