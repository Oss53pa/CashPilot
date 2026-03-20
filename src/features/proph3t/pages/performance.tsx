import { useMemo } from 'react';
import {
  TrendingUp, Brain, Clock, Database, Activity, CheckCircle, AlertTriangle,
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar,
} from 'recharts';

import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

// ---------------------------------------------------------------------------
// Mock Data: KPIs
// ---------------------------------------------------------------------------

const kpis = {
  mapeJ7: 4.2,
  mapeJ30: 7.8,
  mapeJ90: 12.5,
  overallAccuracy: 92.3,
};

// ---------------------------------------------------------------------------
// Mock Data: Accuracy Trend (6 months)
// ---------------------------------------------------------------------------

const accuracyTrend = [
  { month: 'Oct 2025', mape: 9.8, accuracy: 90.2 },
  { month: 'Nov 2025', mape: 8.5, accuracy: 91.5 },
  { month: 'Dec 2025', mape: 8.1, accuracy: 91.9 },
  { month: 'Jan 2026', mape: 7.2, accuracy: 92.8 },
  { month: 'Fev 2026', mape: 6.9, accuracy: 93.1 },
  { month: 'Mar 2026', mape: 6.4, accuracy: 93.6 },
];

// ---------------------------------------------------------------------------
// Mock Data: Model Configuration
// ---------------------------------------------------------------------------

interface ModelConfig {
  id: string;
  name: string;
  type: string;
  category: string;
  lastTrained: string;
  accuracy: number;
  mape: number;
  status: 'active' | 'degraded' | 'inactive';
}

const modelConfigs: ModelConfig[] = [
  { id: '1', name: 'HW-Encaissements', type: 'Holt-Winters', category: 'Encaissements', lastTrained: '18/03/2026', accuracy: 95.8, mape: 4.2, status: 'active' },
  { id: '2', name: 'SARIMA-Decaissements', type: 'SARIMA', category: 'Decaissements', lastTrained: '18/03/2026', accuracy: 93.1, mape: 6.9, status: 'active' },
  { id: '3', name: 'Prophet-Loyers', type: 'Prophet', category: 'Loyers', lastTrained: '17/03/2026', accuracy: 96.2, mape: 3.8, status: 'active' },
  { id: '4', name: 'LSTM-Tresorerie-Nette', type: 'LSTM', category: 'Net Cash', lastTrained: '15/03/2026', accuracy: 89.5, mape: 10.5, status: 'degraded' },
  { id: '5', name: 'Ensemble-Global', type: 'Ensemble', category: 'Global', lastTrained: '18/03/2026', accuracy: 94.7, mape: 5.3, status: 'active' },
  { id: '6', name: 'XGBoost-Scoring', type: 'XGBoost', category: 'Scoring', lastTrained: '16/03/2026', accuracy: 91.2, mape: 8.8, status: 'active' },
  { id: '7', name: 'WMA-Charges', type: 'WMA', category: 'Charges fixes', lastTrained: '18/03/2026', accuracy: 97.1, mape: 2.9, status: 'active' },
  { id: '8', name: 'ARIMA-TVA', type: 'ARIMA', category: 'Fiscal', lastTrained: '10/03/2026', accuracy: 85.3, mape: 14.7, status: 'degraded' },
];

// ---------------------------------------------------------------------------
// Mock Data: Training History
// ---------------------------------------------------------------------------

interface TrainingLog {
  id: string;
  date: string;
  model: string;
  duration: string;
  result: 'success' | 'warning' | 'error';
  message: string;
}

const trainingHistory: TrainingLog[] = [
  { id: '1', date: '18/03/2026 06:00', model: 'HW-Encaissements', duration: '2m 34s', result: 'success', message: 'MAPE ameliore de 4.5% a 4.2%' },
  { id: '2', date: '18/03/2026 06:03', model: 'SARIMA-Decaissements', duration: '3m 12s', result: 'success', message: 'Performance stable (MAPE 6.9%)' },
  { id: '3', date: '18/03/2026 06:07', model: 'Ensemble-Global', duration: '5m 48s', result: 'success', message: 'Combinaison optimale: HW 45% + SARIMA 35% + Prophet 20%' },
  { id: '4', date: '17/03/2026 06:00', model: 'Prophet-Loyers', duration: '4m 15s', result: 'success', message: 'Detection saisonnalite trimestrielle amelioree' },
  { id: '5', date: '16/03/2026 06:00', model: 'XGBoost-Scoring', duration: '8m 22s', result: 'warning', message: 'Feature importance shift detecte: delai_moyen_paiement passe de rang 3 a rang 1' },
  { id: '6', date: '15/03/2026 06:00', model: 'LSTM-Tresorerie-Nette', duration: '12m 05s', result: 'warning', message: 'MAPE degrade de 9.2% a 10.5% — donnees insuffisantes sur periode recente' },
  { id: '7', date: '10/03/2026 06:00', model: 'ARIMA-TVA', duration: '1m 48s', result: 'error', message: 'Convergence echouee — fallback vers WMA. MAPE actuel 14.7%' },
];

// ---------------------------------------------------------------------------
// Mock Data: Method Comparison
// ---------------------------------------------------------------------------

const methodComparison = [
  { method: 'Deterministe (WMA)', mapeJ7: 5.1, mapeJ30: 9.2, mapeJ90: 18.5 },
  { method: 'Statistique (SARIMA)', mapeJ7: 4.8, mapeJ30: 7.8, mapeJ90: 13.2 },
  { method: 'ML (Prophet/LSTM)', mapeJ7: 4.0, mapeJ30: 6.5, mapeJ90: 11.8 },
  { method: 'Ensemble', mapeJ7: 3.6, mapeJ30: 5.3, mapeJ90: 9.4 },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mapeColor(mape: number): string {
  if (mape <= 5) return 'text-green-600';
  if (mape <= 10) return 'text-yellow-600';
  return 'text-red-600';
}

function statusBadge(status: ModelConfig['status']) {
  if (status === 'active') return <Badge variant="success">Actif</Badge>;
  if (status === 'degraded') return <Badge variant="warning">Degrade</Badge>;
  return <Badge variant="secondary">Inactif</Badge>;
}

function resultIcon(result: TrainingLog['result']) {
  if (result === 'success') return <CheckCircle className="h-4 w-4 text-green-600" />;
  if (result === 'warning') return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
  return <AlertTriangle className="h-4 w-4 text-red-600" />;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function Performance() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <PageHeader title="Performance Moteur" description="Precision des modeles et sante du moteur IA Proph3t" />

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">MAPE J+7</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <span className={`text-2xl font-bold ${mapeColor(kpis.mapeJ7)}`}>{kpis.mapeJ7}%</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Erreur moyenne a 7 jours</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">MAPE J+30</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-yellow-600" />
              <span className={`text-2xl font-bold ${mapeColor(kpis.mapeJ30)}`}>{kpis.mapeJ30}%</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Erreur moyenne a 30 jours</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">MAPE J+90</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-red-500" />
              <span className={`text-2xl font-bold ${mapeColor(kpis.mapeJ90)}`}>{kpis.mapeJ90}%</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Erreur moyenne a 90 jours</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Precision globale</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-green-600" />
              <span className="text-2xl font-bold text-green-600">{kpis.overallAccuracy}%</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Toutes categories confondues</p>
          </CardContent>
        </Card>
      </div>

      {/* Accuracy Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Evolution de la precision (6 mois)</CardTitle>
          <CardDescription>MAPE et precision globale du moteur previsionnel</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={accuracyTrend} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="accuracy" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} name="Precision (%)" />
              <Line type="monotone" dataKey="mape" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} name="MAPE (%)" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Model Configuration Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Configuration des modeles</CardTitle>
          <CardDescription>{modelConfigs.length} modeles configures — {modelConfigs.filter(m => m.status === 'active').length} actifs</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left px-4 py-3 font-medium">Modele</th>
                  <th className="text-left px-4 py-3 font-medium">Type</th>
                  <th className="text-left px-4 py-3 font-medium">Categorie</th>
                  <th className="text-left px-4 py-3 font-medium">Dernier entrainement</th>
                  <th className="text-left px-4 py-3 font-medium">Precision</th>
                  <th className="text-center px-4 py-3 font-medium">MAPE</th>
                  <th className="text-center px-4 py-3 font-medium">Statut</th>
                </tr>
              </thead>
              <tbody>
                {modelConfigs.map((m) => (
                  <tr key={m.id} className="border-b hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium">{m.name}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline">{m.type}</Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{m.category}</td>
                    <td className="px-4 py-3 text-muted-foreground">{m.lastTrained}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 min-w-[140px]">
                        <Progress value={m.accuracy} className={`h-2 flex-1 ${m.accuracy >= 90 ? '[&>div]:bg-green-600' : m.accuracy >= 80 ? '[&>div]:bg-yellow-500' : '[&>div]:bg-red-500'}`} />
                        <span className="text-xs font-bold w-10">{m.accuracy}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`font-bold ${mapeColor(m.mape)}`}>{m.mape}%</span>
                    </td>
                    <td className="px-4 py-3 text-center">{statusBadge(m.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Training History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Historique d'entrainement</CardTitle>
          <CardDescription>Derniers cycles d'entrainement des modeles</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {trainingHistory.map((log) => (
              <div key={log.id} className="flex items-center gap-3 rounded-lg border px-4 py-2.5 hover:bg-muted/30 transition-colors">
                {resultIcon(log.result)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{log.model}</span>
                    <span className="text-xs text-muted-foreground">{log.duration}</span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{log.message}</p>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">{log.date}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Method Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Comparaison par methode de prevision</CardTitle>
          <CardDescription>MAPE par horizon et type de modele</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={methodComparison} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="method" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} label={{ value: 'MAPE (%)', angle: -90, position: 'insideLeft', style: { fontSize: 11 } }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="mapeJ7" fill="#22c55e" name="MAPE J+7" radius={[2, 2, 0, 0]} />
              <Bar dataKey="mapeJ30" fill="#f59e0b" name="MAPE J+30" radius={[2, 2, 0, 0]} />
              <Bar dataKey="mapeJ90" fill="#ef4444" name="MAPE J+90" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
