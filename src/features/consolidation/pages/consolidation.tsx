import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  useGroupView,
  useInterCompanyFlows,
  useConsolidatedBalance,
  useConsolidationConfig,
  useUpdateConsolidationConfig,
  useEliminatedFlows,
} from '../hooks/use-consolidation';
import { GroupSummaryCards } from '../components/group-summary';
import { InterCompanyTable } from '../components/intercompany-table';
import { ConsolidationConfigPanel } from '../components/consolidation-config';
import { EliminationView } from '../components/elimination-view';

export default function ConsolidationPage() {
  // In a real app, tenantId would come from auth context
  const tenantId = undefined as string | undefined;

  const { data: groupSummary, isLoading: groupLoading } = useGroupView(tenantId);
  const { data: interCompanyFlows = [], isLoading: flowsLoading } = useInterCompanyFlows(tenantId);
  const { data: consolidatedBalance = [], isLoading: balanceLoading } = useConsolidatedBalance(tenantId);
  const { data: consolidationConfig, isLoading: configLoading } = useConsolidationConfig(tenantId);
  const { data: eliminatedFlows = [], isLoading: eliminationsLoading } = useEliminatedFlows(tenantId);
  const updateConfig = useUpdateConsolidationConfig();

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

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="config">Configuration</TabsTrigger>
          <TabsTrigger value="eliminations">Eliminations</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
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
        </TabsContent>

        <TabsContent value="config" className="space-y-6">
          <ConsolidationConfigPanel
            config={consolidationConfig}
            isLoading={configLoading}
            onUpdate={(data) => updateConfig.mutate(data)}
          />
        </TabsContent>

        <TabsContent value="eliminations" className="space-y-6">
          <EliminationView
            flows={eliminatedFlows}
            isLoading={eliminationsLoading}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
