import { supabase } from '@/config/supabase';

export interface GroupSummary {
  total_receipts: number;
  total_disbursements: number;
  net_position: number;
  company_count: number;
  companies: {
    id: string;
    name: string;
    currency: string;
    total_balance: number;
  }[];
}

export interface InterCompanyFlow {
  from_company_id: string;
  from_company_name: string;
  to_company_id: string;
  to_company_name: string;
  amount: number;
  currency: string;
}

export interface ConsolidatedBalance {
  currency: string;
  total_balance: number;
  account_count: number;
}

export const consolidationService = {
  async getGroupView(tenantId: string): Promise<GroupSummary> {
    try {
      // Get all companies for this tenant
      const { data: companies, error: compError } = await supabase
        .from('companies')
        .select('id, name, currency')
        .eq('tenant_id', tenantId)
        .eq('is_active', true);

      if (compError) throw compError;

      const companyList = companies ?? [];

      // Get balances for all companies
      const companySummaries = await Promise.all(
        companyList.map(async (company) => {
          const { data: accounts } = await supabase
            .from('bank_accounts')
            .select('current_balance')
            .eq('company_id', company.id)
            .eq('is_active', true);

          const totalBalance = (accounts ?? []).reduce(
            (sum, acc) => sum + acc.current_balance,
            0,
          );

          return {
            id: company.id,
            name: company.name,
            currency: company.currency,
            total_balance: totalBalance,
          };
        }),
      );

      const totalReceipts = companySummaries
        .filter((c) => c.total_balance > 0)
        .reduce((sum, c) => sum + c.total_balance, 0);

      const totalDisbursements = companySummaries
        .filter((c) => c.total_balance < 0)
        .reduce((sum, c) => sum + Math.abs(c.total_balance), 0);

      return {
        total_receipts: totalReceipts,
        total_disbursements: totalDisbursements,
        net_position: totalReceipts - totalDisbursements,
        company_count: companyList.length,
        companies: companySummaries,
      };
    } catch {
      return {
        total_receipts: 0,
        total_disbursements: 0,
        net_position: 0,
        company_count: 0,
        companies: [],
      };
    }
  },

  async getInterCompanyFlows(_tenantId: string): Promise<InterCompanyFlow[]> {
    try {
      const { data, error } = await supabase
        .from('internal_transfers')
        .select(`
          amount,
          currency,
          from_account:bank_accounts!from_account_id(company_id, company:companies!company_id(id, name)),
          to_account:bank_accounts!to_account_id(company_id, company:companies!company_id(id, name))
        `)
        .eq('status', 'executed');

      if (error) throw error;

      return (data ?? [])
        .filter((t: any) => t.from_account?.company_id !== t.to_account?.company_id)
        .map((t: any) => ({
          from_company_id: t.from_account?.company?.id ?? '',
          from_company_name: t.from_account?.company?.name ?? '',
          to_company_id: t.to_account?.company?.id ?? '',
          to_company_name: t.to_account?.company?.name ?? '',
          amount: t.amount,
          currency: t.currency,
        }));
    } catch {
      return [];
    }
  },

  async getConsolidatedBalance(tenantId: string): Promise<ConsolidatedBalance[]> {
    try {
      const { data: companies } = await supabase
        .from('companies')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('is_active', true);

      if (!companies?.length) return [];

      const companyIds = companies.map((c) => c.id);

      const { data: accounts, error } = await supabase
        .from('bank_accounts')
        .select('currency, current_balance')
        .in('company_id', companyIds)
        .eq('is_active', true);

      if (error) throw error;

      const balanceMap = new Map<string, ConsolidatedBalance>();
      for (const acc of accounts ?? []) {
        const existing = balanceMap.get(acc.currency);
        if (existing) {
          existing.total_balance += acc.current_balance;
          existing.account_count += 1;
        } else {
          balanceMap.set(acc.currency, {
            currency: acc.currency,
            total_balance: acc.current_balance,
            account_count: 1,
          });
        }
      }

      return Array.from(balanceMap.values());
    } catch {
      return [];
    }
  },
};
