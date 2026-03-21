import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Download,
  FileSpreadsheet,
  FileText,
  SlidersHorizontal,
  ArrowRight,
} from 'lucide-react';
import { useCompanyStore } from '@/stores/company.store';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import {
  useRollingForecast,
  useRefreshForecast,
  useSimulation,
} from '../hooks/use-rolling-forecast';
import { ForecastContextBar } from '../components/forecast-context-bar';
import { PositionHeader } from '../components/position-header';
import { ForecastGrid } from '../components/forecast-grid';
import { RiskRow } from '../components/risk-row';
import { ForecastChart } from '../components/forecast-chart';
import { SimulationPanel } from '../components/simulation-panel';
import type { Granularity, SimulationParams, RollingForecast as RollingForecastType } from '../types';

export default function RollingForecastPage() {
  const currentCompany = useCompanyStore((s) => s.currentCompany);
  const companyId = currentCompany?.id ?? '';

  const [activeTab, setActiveTab] = useState('tableau');
  const [granularity, setGranularity] = useState<Granularity>('weekly_monthly');
  const [scenario, setScenario] = useState<'base' | 'optimistic' | 'pessimistic'>('base');
  const [showConfidence, setShowConfidence] = useState(false);
  const [simulationOpen, setSimulationOpen] = useState(false);
  const [simulatedData, setSimulatedData] = useState<RollingForecastType | null>(null);

  const { data: forecast, isLoading } = useRollingForecast(companyId, granularity, scenario);
  const refreshMutation = useRefreshForecast(companyId);
  const simulationMutation = useSimulation(companyId);

  const displayData = simulatedData ?? forecast;

  function handleSimulate(params: SimulationParams) {
    simulationMutation.mutate(params, {
      onSuccess: (data) => {
        setSimulatedData(data);
        setSimulationOpen(false);
      },
    });
  }

  if (isLoading || !displayData) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Prévisions 12 Mois Glissants"
          description="Chargement des prévisions..."
        />
        <div className="grid gap-4">
          <div className="h-20 animate-pulse rounded-lg bg-muted" />
          <div className="h-64 animate-pulse rounded-lg bg-muted" />
          <div className="h-64 animate-pulse rounded-lg bg-muted" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Prévisions 12 Mois Glissants"
        description="Vue consolidée de la trésorerie prévisionnelle sur 12 mois avec intervalles de confiance."
      >
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSimulationOpen(true)}
          >
            <SlidersHorizontal className="mr-1 h-3.5 w-3.5" />
            Simulation
          </Button>
          <Button variant="outline" size="sm">
            <FileSpreadsheet className="mr-1 h-3.5 w-3.5" />
            Excel
          </Button>
          <Button variant="outline" size="sm">
            <FileText className="mr-1 h-3.5 w-3.5" />
            PDF
          </Button>
        </div>
      </PageHeader>

      {/* Context Bar */}
      <ForecastContextBar
        scenario={scenario}
        onScenarioChange={setScenario}
        granularity={granularity}
        onGranularityChange={(g) => {
          setGranularity(g);
          setSimulatedData(null);
        }}
        showConfidence={showConfidence}
        onToggleConfidence={() => setShowConfidence((v) => !v)}
        lastUpdated={displayData.last_updated}
        onRefresh={() => {
          setSimulatedData(null);
          refreshMutation.mutate();
        }}
        isRefreshing={refreshMutation.isPending}
        periodStart={displayData.period_start}
        periodEnd={displayData.period_end}
      />

      {/* Simulated indicator */}
      {simulatedData && (
        <div className="flex items-center gap-2 rounded-lg border border-orange-300 bg-orange-50 p-2 text-xs text-orange-700 dark:border-orange-800 dark:bg-orange-950/30 dark:text-orange-400">
          <SlidersHorizontal className="h-3.5 w-3.5" />
          <span>Données simulées affichées.</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-xs"
            onClick={() => setSimulatedData(null)}
          >
            Revenir au scénario de base
          </Button>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="tableau">Tableau</TabsTrigger>
          <TabsTrigger value="plan13">Plan 13 Semaines</TabsTrigger>
          <TabsTrigger value="graphique">Graphique</TabsTrigger>
          <TabsTrigger value="waterfall">Waterfall</TabsTrigger>
        </TabsList>

        {/* Tableau tab */}
        <TabsContent value="tableau" className="mt-4 space-y-3">
          <PositionHeader
            columns={displayData.columns}
            position={displayData.position}
            showConfidence={showConfidence}
          />

          <ForecastGrid
            title="Encaissements"
            columns={displayData.columns}
            rows={displayData.receipts}
            showConfidence={showConfidence}
          />

          <ForecastGrid
            title="Décaissements"
            columns={displayData.columns}
            rows={displayData.disbursements}
            showConfidence={showConfidence}
          />

          <RiskRow riskSummary={displayData.risk_summary} />
        </TabsContent>

        {/* Plan 13 Semaines tab */}
        <TabsContent value="plan13" className="mt-4 space-y-3">
          {granularity === 'plan_13_weeks' ? (
            <>
              <PositionHeader
                columns={displayData.columns}
                position={displayData.position}
                showConfidence={showConfidence}
              />
              <ForecastGrid
                title="Encaissements — Plan 13 semaines"
                columns={displayData.columns}
                rows={displayData.receipts}
                showConfidence={showConfidence}
              />
              <ForecastGrid
                title="Décaissements — Plan 13 semaines"
                columns={displayData.columns}
                rows={displayData.disbursements}
                showConfidence={showConfidence}
              />
            </>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-sm text-muted-foreground mb-3">
                  Basculez la granularité vers "Plan 13 semaines" pour voir la vue hebdomadaire simplifiée.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setGranularity('plan_13_weeks');
                    setSimulatedData(null);
                  }}
                >
                  Passer en Plan 13 semaines
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Graphique tab */}
        <TabsContent value="graphique" className="mt-4">
          <ForecastChart
            columns={displayData.columns}
            position={displayData.position}
          />
        </TabsContent>

        {/* Waterfall tab */}
        <TabsContent value="waterfall" className="mt-4">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Download className="mb-3 h-10 w-10 text-muted-foreground/50" />
              <p className="text-sm font-medium">Waterfall</p>
              <p className="text-xs text-muted-foreground mt-1">
                Vue cascade des flux de trésorerie — bientôt disponible.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Navigation links */}
      <div className="flex flex-wrap gap-3 pt-2">
        <Link to="/forecast" className="group">
          <Button variant="ghost" size="sm" className="text-xs">
            Prévisions (TFT)
            <ArrowRight className="ml-1 h-3 w-3 transition-transform group-hover:translate-x-0.5" />
          </Button>
        </Link>
        <Link to="/forecast/annual" className="group">
          <Button variant="ghost" size="sm" className="text-xs">
            Tableau annuel
            <ArrowRight className="ml-1 h-3 w-3 transition-transform group-hover:translate-x-0.5" />
          </Button>
        </Link>
      </div>

      {/* Simulation panel */}
      <SimulationPanel
        open={simulationOpen}
        onClose={() => setSimulationOpen(false)}
        onApply={handleSimulate}
        isSimulating={simulationMutation.isPending}
      />
    </div>
  );
}
