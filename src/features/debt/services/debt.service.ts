import { supabase } from '@/config/supabase';
import type { DebtContract, DebtContractFormData, DebtSummary, RepaymentScheduleItem } from '../types';

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
};
