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

export interface ConsolidationConfig {
  included_companies: { id: string; name: string; included: boolean }[];
  consolidation_currency: string;
  elimination_method: 'full' | 'proportional';
  intercompany_pairs: { from_company_id: string; from_company_name: string; to_company_id: string; to_company_name: string }[];
}

export interface EliminatedFlow {
  id: string;
  from_company: string;
  to_company: string;
  amount: number;
  nature: string;
  elimination_status: 'eliminated' | 'pending' | 'partial';
}

export interface ConsolidatedReport {
  period: string;
  currency: string;
  revenue: number;
  cost_of_sales: number;
  gross_margin: number;
  operating_expenses: number;
  operating_income: number;
  financial_result: number;
  net_income: number;
  eliminations_total: number;
}

export const consolidationService = {
  async getGroupView(tenantId: string): Promise<GroupSummary> {
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
  },

  async getInterCompanyFlows(_tenantId: string): Promise<InterCompanyFlow[]> {
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
  },

  // Consolidation Config
  async getConsolidationConfig(tenantId: string): Promise<ConsolidationConfig> {
    const { data, error } = await supabase
      .from('consolidation_config')
      .select('*')
      .eq('tenant_id', tenantId)
      .single();

    if (error && error.code === 'PGRST116') {
      // No config yet — return empty
      return {
        included_companies: [],
        consolidation_currency: 'XOF',
        elimination_method: 'full',
        intercompany_pairs: [],
      };
    }
    if (error) throw error;
    return data as ConsolidationConfig;
  },

  async updateConsolidationConfig(tenantId: string, updates: Partial<ConsolidationConfig>): Promise<ConsolidationConfig> {
    const { data, error } = await supabase
      .from('consolidation_config')
      .upsert({ tenant_id: tenantId, ...updates }, { onConflict: 'tenant_id' })
      .select()
      .single();

    if (error) throw error;
    return data as ConsolidationConfig;
  },

  // Eliminated Flows
  async getEliminatedFlows(tenantId: string): Promise<EliminatedFlow[]> {
    const { data, error } = await supabase
      .from('intercompany_flows')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('amount', { ascending: false });

    if (error) throw error;
    return (data ?? []) as EliminatedFlow[];
  },

  // Consolidated Report
  async getConsolidatedReport(tenantId: string, period: string): Promise<ConsolidatedReport> {
    const { data, error } = await supabase
      .from('consolidated_reports')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('period', period)
      .single();

    if (error && error.code === 'PGRST116') {
      return {
        period,
        currency: 'XOF',
        revenue: 0,
        cost_of_sales: 0,
        gross_margin: 0,
        operating_expenses: 0,
        operating_income: 0,
        financial_result: 0,
        net_income: 0,
        eliminations_total: 0,
      };
    }
    if (error) throw error;
    return data as ConsolidatedReport;
  },

  async getConsolidatedBalance(tenantId: string): Promise<ConsolidatedBalance[]> {
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
  },
};
