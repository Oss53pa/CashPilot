import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useGroupView, useInterCompanyFlows, useConsolidatedBalance } from '../hooks/use-consolidation';
import { GroupSummaryCards } from '../components/group-summary';
import { InterCompanyTable } from '../components/intercompany-table';

export default function ConsolidationPage() {
  // In a real app, tenantId would come from auth context
  const tenantId = undefined as string | undefined;

  const { data: groupSummary, isLoading: groupLoading } = useGroupView(tenantId);
  const { data: interCompanyFlows = [], isLoading: flowsLoading } = useInterCompanyFlows(tenantId);
  const { data: consolidatedBalance = [], isLoading: balanceLoading } = useConsolidatedBalance(tenantId);

  const balanceChartData = consolidatedBalance.map((b) => ({
    currency: b.currency,
    balance: b.total_balance,
    accounts: b.account_count,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Consolidation Groupe"
        description="Consolidated view across all group entities"
      />

      <GroupSummaryCards
        summary={groupSummary}
        isLoading={groupLoading}
      />

      <InterCompanyTable flows={interCompanyFlows} isLoading={flowsLoading} />

      <Card>
        <CardHeader>
          <CardTitle>Consolidated Balance by Currency</CardTitle>
        </CardHeader>
        <CardContent>
          {balanceLoading ? (
            <div className="h-64 animate-pulse rounded bg-muted" />
          ) : balanceChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={balanceChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="currency" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="balance" fill="#404040" name="Balance" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              No balance data available.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
