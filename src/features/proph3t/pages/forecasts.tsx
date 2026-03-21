import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  TrendingUp, TrendingDown, AlertTriangle, Brain, RefreshCw,
  BarChart3, Target, Activity, Gauge,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { FanChart } from '../components/uncertainty/fan-chart';
import { DensityChart } from '../components/uncertainty/density-chart';
import { UncertaintyDecompositionPanel } from '../components/uncertainty/uncertainty-decomposition';
import { CalibrationChart } from '../components/uncertainty/calibration-chart';
import { ProbabilityQueryWidget } from '../components/uncertainty/probability-query';
import type {
  UncertaintyDistribution,
  CalibrationData,
  UncertaintyDecomposition,
  FanChartPoint,
  ProbabilityQuery,
} from '../components/uncertainty/uncertainty-types';
import * as proph3tService from '../services/proph3t.service';

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

type Horizon = 'J+7' | 'J+30' | 'J+90' | 'J+365';

interface ScenarioCard {
  key: string;
  label: string;
  total: number;
  confidence: number;
  method: string;
  color: string;
  trend: 'up' | 'down' | 'stable';
}

const scenarioCards: Record<Horizon, ScenarioCard[]> = {
  'J+7': [
    { key: 'base', label: 'Scenario de base', total: 245_800_000, confidence: 92, method: 'Holt-Winters', color: '#171717', trend: 'up' },
    { key: 'optimistic', label: 'Scenario optimiste', total: 278_500_000, confidence: 85, method: 'Ensemble', color: '#22c55e', trend: 'up' },
    { key: 'pessimistic', label: 'Scenario pessimiste', total: 198_200_000, confidence: 88, method: 'SARIMA', color: '#ef4444', trend: 'down' },
  ],
  'J+30': [
    { key: 'base', label: 'Scenario de base', total: 1_125_400_000, confidence: 87, method: 'Holt-Winters', color: '#171717', trend: 'up' },
    { key: 'optimistic', label: 'Scenario optimiste', total: 1_340_000_000, confidence: 78, method: 'Ensemble', color: '#22c55e', trend: 'up' },
    { key: 'pessimistic', label: 'Scenario pessimiste', total: 890_600_000, confidence: 82, method: 'SARIMA', color: '#ef4444', trend: 'down' },
  ],
  'J+90': [
    { key: 'base', label: 'Scenario de base', total: 3_450_000_000, confidence: 74, method: 'Prophet', color: '#171717', trend: 'stable' },
    { key: 'optimistic', label: 'Scenario optimiste', total: 4_120_000_000, confidence: 65, method: 'Ensemble', color: '#22c55e', trend: 'up' },
    { key: 'pessimistic', label: 'Scenario pessimiste', total: 2_680_000_000, confidence: 70, method: 'SARIMA', color: '#ef4444', trend: 'down' },
  ],
  'J+365': [
    { key: 'base', label: 'Scenario de base', total: 14_200_000_000, confidence: 58, method: 'Prophet', color: '#171717', trend: 'up' },
    { key: 'optimistic', label: 'Scenario optimiste', total: 17_800_000_000, confidence: 48, method: 'LSTM', color: '#22c55e', trend: 'up' },
    { key: 'pessimistic', label: 'Scenario pessimiste', total: 10_500_000_000, confidence: 52, method: 'SARIMA', color: '#ef4444', trend: 'down' },
  ],
};

function generateChartData(horizon: Horizon) {
  const days: Record<Horizon, number> = { 'J+7': 7, 'J+30': 30, 'J+90': 90, 'J+365': 365 };
  const count = Math.min(days[horizon], 30); // max 30 points
  const step = Math.max(1, Math.floor(days[horizon] / count));
  const base = 35_000_000;
  const data = [];
  for (let i = 0; i <= count; i++) {
    const day = i * step;
    const date = new Date();
    date.setDate(date.getDate() + day);
    const label = date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
    const noise = Math.sin(i * 0.5) * 5_000_000;
    data.push({
      date: label,
      base: Math.round(base + i * 800_000 + noise),
      optimiste: Math.round(base + i * 1_200_000 + noise + 3_000_000),
      pessimiste: Math.round(base + i * 400_000 + noise - 4_000_000),
    });
  }
  return data;
}

interface MockAnomaly {
  id: string;
  severity: 'critical' | 'alert' | 'watch' | 'normal';
  description: string;
  date: string;
  amount: number;
}

const mockAnomalies: MockAnomaly[] = [
  { id: '1', severity: 'critical', description: 'Ecart de +45% sur encaissements ECOBANK vs prevision J+7', date: '18 mars 2026', amount: 12_500_000 },
  { id: '2', severity: 'alert', description: 'Decaissements fournisseurs superieurs de 28% a la moyenne mobile 12 semaines', date: '17 mars 2026', amount: 8_200_000 },
  { id: '3', severity: 'watch', description: 'Regularite des loyers ZARA CI en baisse de 15% sur 4 semaines', date: '16 mars 2026', amount: 3_400_000 },
  { id: '4', severity: 'watch', description: 'Flux sortant inhabituel sur compte SGBCI CAPEX a 23h15', date: '15 mars 2026', amount: 25_000_000 },
  { id: '5', severity: 'normal', description: 'Variation saisonniere detectee sur TVA collectee - conforme historique', date: '14 mars 2026', amount: 0 },
];

const severityConfig: Record<string, { label: string; variant: 'destructive' | 'warning' | 'secondary' | 'outline'; color: string }> = {
  critical: { label: 'Critique', variant: 'destructive', color: 'text-red-600' },
  alert: { label: 'Alerte', variant: 'warning', color: 'text-orange-500' },
  watch: { label: 'Surveillance', variant: 'secondary', color: 'text-yellow-600' },
  normal: { label: 'Normal', variant: 'outline', color: 'text-gray-500' },
};

// ---------------------------------------------------------------------------
// Formatters
// ---------------------------------------------------------------------------

function formatFCFA(amount: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'decimal', maximumFractionDigits: 0 }).format(amount) + ' FCFA';
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function Forecasts() {
  const [horizon, setHorizon] = useState<Horizon>('J+30');
  const [mainTab, setMainTab] = useState<string>('previsions');

  // Uncertainty state
  const [fanChartData, setFanChartData] = useState<FanChartPoint[]>([]);
  const [uncertaintyDist, setUncertaintyDist] = useState<UncertaintyDistribution | null>(null);
  const [calibration, setCalibration] = useState<CalibrationData | null>(null);
  const [decomposition, setDecomposition] = useState<UncertaintyDecomposition[]>([]);

  const cards = scenarioCards[horizon];
  const chartData = useMemo(() => generateChartData(horizon), [horizon]);

  // Load uncertainty data when tab is selected
  useEffect(() => {
    if (mainTab === 'incertitude') {
      proph3tService.getFanChartData('mock-company').then(setFanChartData);
      proph3tService.getUncertaintyDistribution('mock-company', 'fc-001').then(setUncertaintyDist);
      proph3tService.getCalibrationData('mock-company').then(setCalibration);
      proph3tService.getUncertaintyDecomposition('mock-company').then(setDecomposition);
    }
  }, [mainTab]);

  const handleProbabilityQuery = useCallback(async (date: string, threshold: number) => {
    return proph3tService.queryProbability('mock-company', date, threshold);
  }, []);

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <PageHeader title="Previsions IA" description="Previsions multi-modeles avec intervalles de confiance">
        <Button variant="outline" size="sm">
          <RefreshCw className="mr-2 h-4 w-4" />
          Recalculer
        </Button>
      </PageHeader>

      {/* Main Tabs: Previsions | Incertitude */}
      <Tabs value={mainTab} onValueChange={setMainTab}>
        <TabsList>
          <TabsTrigger value="previsions">Previsions</TabsTrigger>
          <TabsTrigger value="incertitude" className="flex items-center gap-1.5">
            <Gauge className="h-3.5 w-3.5" />
            Incertitude
          </TabsTrigger>
        </TabsList>

        {/* ================================================================ */}
        {/* TAB: Previsions (original content) */}
        {/* ================================================================ */}
        <TabsContent value="previsions" className="mt-4 space-y-6">
          {/* Horizon Tabs */}
          <Tabs value={horizon} onValueChange={(v) => setHorizon(v as Horizon)}>
            <TabsList>
              <TabsTrigger value="J+7">J+7</TabsTrigger>
              <TabsTrigger value="J+30">J+30</TabsTrigger>
              <TabsTrigger value="J+90">J+90</TabsTrigger>
              <TabsTrigger value="J+365">J+365</TabsTrigger>
            </TabsList>

            <TabsContent value={horizon} className="mt-4 space-y-6">
              {/* 3 Scenario Cards */}
              <div className="grid gap-4 md:grid-cols-3">
                {cards.map((sc) => {
                  const TrendIcon = sc.trend === 'up' ? TrendingUp : sc.trend === 'down' ? TrendingDown : Activity;
                  return (
                    <Card key={sc.key} className="relative overflow-hidden">
                      <div className="absolute top-0 left-0 h-1 w-full" style={{ backgroundColor: sc.color }} />
                      <CardHeader className="pb-2">
                        <CardDescription className="flex items-center gap-2">
                          <Target className="h-4 w-4" />
                          {sc.label}
                        </CardDescription>
                        <CardTitle className="text-2xl">{formatFCFA(sc.total)}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-1.5">
                            <BarChart3 className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Confiance:</span>
                            <Badge variant={sc.confidence >= 80 ? 'success' : sc.confidence >= 60 ? 'warning' : 'secondary'}>
                              {sc.confidence}%
                            </Badge>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Brain className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">{sc.method}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 mt-2 text-xs">
                          <TrendIcon className={`h-3.5 w-3.5 ${sc.trend === 'up' ? 'text-green-600' : sc.trend === 'down' ? 'text-red-500' : 'text-gray-500'}`} />
                          <span className={sc.trend === 'up' ? 'text-green-600' : sc.trend === 'down' ? 'text-red-500' : 'text-gray-500'}>
                            {sc.trend === 'up' ? 'Tendance haussiere' : sc.trend === 'down' ? 'Tendance baissiere' : 'Stable'}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Area Chart -- 3 scenarios overlaid */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Prevision de tresorerie — {horizon}</CardTitle>
                  <CardDescription>Montants cumules par scenario (FCFA)</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={380}>
                    <AreaChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="date" className="text-xs" tick={{ fontSize: 11 }} />
                      <YAxis className="text-xs" tick={{ fontSize: 11 }} tickFormatter={(v: number) => `${(v / 1_000_000).toFixed(0)}M`} />
                      <Tooltip formatter={(value: number) => formatFCFA(value)} />
                      <Legend />
                      <Area type="monotone" dataKey="optimiste" stroke="#22c55e" fill="#22c55e" fillOpacity={0.08} strokeWidth={2} name="Optimiste" />
                      <Area type="monotone" dataKey="base" stroke="#171717" fill="#171717" fillOpacity={0.12} strokeWidth={2} name="Base" />
                      <Area type="monotone" dataKey="pessimiste" stroke="#ef4444" fill="#ef4444" fillOpacity={0.08} strokeWidth={2} strokeDasharray="5 5" name="Pessimiste" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Anomaly Detection Section */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-orange-500" />
                    <CardTitle className="text-base">Anomalies detectees</CardTitle>
                  </div>
                  <CardDescription>{mockAnomalies.length} anomalies detectees par le moteur IA</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {mockAnomalies.map((a) => {
                      const cfg = severityConfig[a.severity];
                      return (
                        <div
                          key={a.id}
                          className="flex items-start gap-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                        >
                          <Badge variant={cfg.variant} className="mt-0.5 shrink-0">{cfg.label}</Badge>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm">{a.description}</p>
                            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                              <span>{a.date}</span>
                              {a.amount > 0 && <span className="font-medium">{formatFCFA(a.amount)}</span>}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* ================================================================ */}
        {/* TAB: Incertitude (Extension 5) */}
        {/* ================================================================ */}
        <TabsContent value="incertitude" className="mt-4 space-y-6">
          {/* Fan Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Prevision en eventail (Fan Chart)</CardTitle>
              <CardDescription>
                Prevision centrale avec intervalles credibles a 80% et 95% — l'eventail s'elargit avec l'horizon
              </CardDescription>
            </CardHeader>
            <CardContent>
              {fanChartData.length > 0 ? (
                <FanChart data={fanChartData} threshold={50_000_000} />
              ) : (
                <div className="flex items-center justify-center h-[400px] text-muted-foreground">
                  Chargement...
                </div>
              )}
            </CardContent>
          </Card>

          {/* Density Chart */}
          {uncertaintyDist && (
            <DensityChart
              distribution={uncertaintyDist}
              threshold={50_000_000}
            />
          )}

          {/* Uncertainty Decomposition */}
          {decomposition.length > 0 && (
            <UncertaintyDecompositionPanel data={decomposition} />
          )}

          {/* Calibration Chart */}
          {calibration && (
            <CalibrationChart data={calibration} />
          )}

          {/* Probability Query */}
          <ProbabilityQueryWidget onQuery={handleProbabilityQuery} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
