import { useState, useMemo } from 'react';
import {
  Activity, TrendingUp, TrendingDown, Minus, AlertTriangle,
  Search, Users, ArrowUp, ArrowDown,
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Category = 'A' | 'B' | 'C' | 'D';
type Trend = 'up' | 'down' | 'stable';

interface Tenant {
  id: string;
  name: string;
  overallScore: number;
  paymentScore: number;
  riskScore: number;
  trend: Trend;
  category: Category;
  history: { month: string; score: number }[];
  criteria: { label: string; score: number; weight: number }[];
  recommendations: string[];
}

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const tenants: Tenant[] = [
  {
    id: '1', name: 'ZARA CI', overallScore: 91, paymentScore: 95, riskScore: 12, trend: 'up', category: 'A',
    history: [
      { month: 'Oct', score: 84 }, { month: 'Nov', score: 86 }, { month: 'Dec', score: 88 },
      { month: 'Jan', score: 89 }, { month: 'Fev', score: 90 }, { month: 'Mar', score: 91 },
    ],
    criteria: [
      { label: 'Ponctualite paiement', score: 95, weight: 0.35 },
      { label: 'Anciennete bail', score: 90, weight: 0.15 },
      { label: 'Montant loyer / CA estime', score: 88, weight: 0.20 },
      { label: 'Historique litiges', score: 92, weight: 0.15 },
      { label: 'Solidite financiere', score: 89, weight: 0.15 },
    ],
    recommendations: ['Aucune action requise', 'Locataire exemplaire - envisager renouvellement anticipe'],
  },
  {
    id: '2', name: 'CARREFOUR Market', overallScore: 78, paymentScore: 72, riskScore: 28, trend: 'down', category: 'B',
    history: [
      { month: 'Oct', score: 85 }, { month: 'Nov', score: 83 }, { month: 'Dec', score: 82 },
      { month: 'Jan', score: 80 }, { month: 'Fev', score: 79 }, { month: 'Mar', score: 78 },
    ],
    criteria: [
      { label: 'Ponctualite paiement', score: 72, weight: 0.35 },
      { label: 'Anciennete bail', score: 88, weight: 0.15 },
      { label: 'Montant loyer / CA estime', score: 75, weight: 0.20 },
      { label: 'Historique litiges', score: 80, weight: 0.15 },
      { label: 'Solidite financiere', score: 82, weight: 0.15 },
    ],
    recommendations: ['Surveillance renforcee', 'Relance amiable pour retards recurrents', 'Verifier situation financiere groupe'],
  },
  {
    id: '3', name: 'MTN Boutique', overallScore: 65, paymentScore: 58, riskScore: 42, trend: 'down', category: 'C',
    history: [
      { month: 'Oct', score: 78 }, { month: 'Nov', score: 75 }, { month: 'Dec', score: 72 },
      { month: 'Jan', score: 70 }, { month: 'Fev', score: 68 }, { month: 'Mar', score: 65 },
    ],
    criteria: [
      { label: 'Ponctualite paiement', score: 58, weight: 0.35 },
      { label: 'Anciennete bail', score: 70, weight: 0.15 },
      { label: 'Montant loyer / CA estime', score: 65, weight: 0.20 },
      { label: 'Historique litiges', score: 68, weight: 0.15 },
      { label: 'Solidite financiere', score: 72, weight: 0.15 },
    ],
    recommendations: ['Contact preventif urgent', 'Negocier un echeancier', 'Envisager garantie supplementaire'],
  },
  {
    id: '4', name: 'Orange CI', overallScore: 88, paymentScore: 90, riskScore: 15, trend: 'stable', category: 'A',
    history: [
      { month: 'Oct', score: 87 }, { month: 'Nov', score: 88 }, { month: 'Dec', score: 87 },
      { month: 'Jan', score: 88 }, { month: 'Fev', score: 88 }, { month: 'Mar', score: 88 },
    ],
    criteria: [
      { label: 'Ponctualite paiement', score: 90, weight: 0.35 },
      { label: 'Anciennete bail', score: 92, weight: 0.15 },
      { label: 'Montant loyer / CA estime', score: 85, weight: 0.20 },
      { label: 'Historique litiges', score: 88, weight: 0.15 },
      { label: 'Solidite financiere', score: 86, weight: 0.15 },
    ],
    recommendations: ['Aucune action requise', 'Renouvellement envisageable avec revalorisation loyer'],
  },
  {
    id: '5', name: 'Banque Atlantique', overallScore: 94, paymentScore: 98, riskScore: 8, trend: 'up', category: 'A',
    history: [
      { month: 'Oct', score: 91 }, { month: 'Nov', score: 92 }, { month: 'Dec', score: 92 },
      { month: 'Jan', score: 93 }, { month: 'Fev', score: 93 }, { month: 'Mar', score: 94 },
    ],
    criteria: [
      { label: 'Ponctualite paiement', score: 98, weight: 0.35 },
      { label: 'Anciennete bail', score: 95, weight: 0.15 },
      { label: 'Montant loyer / CA estime', score: 90, weight: 0.20 },
      { label: 'Historique litiges', score: 92, weight: 0.15 },
      { label: 'Solidite financiere', score: 94, weight: 0.15 },
    ],
    recommendations: ['Locataire premium', 'Negocier extension du bail'],
  },
  {
    id: '6', name: 'CFAO Motors', overallScore: 82, paymentScore: 80, riskScore: 22, trend: 'stable', category: 'B',
    history: [
      { month: 'Oct', score: 81 }, { month: 'Nov', score: 82 }, { month: 'Dec', score: 81 },
      { month: 'Jan', score: 82 }, { month: 'Fev', score: 82 }, { month: 'Mar', score: 82 },
    ],
    criteria: [
      { label: 'Ponctualite paiement', score: 80, weight: 0.35 },
      { label: 'Anciennete bail', score: 85, weight: 0.15 },
      { label: 'Montant loyer / CA estime', score: 82, weight: 0.20 },
      { label: 'Historique litiges', score: 84, weight: 0.15 },
      { label: 'Solidite financiere', score: 80, weight: 0.15 },
    ],
    recommendations: ['Surveillance standard', 'Suivi trimestriel recommande'],
  },
  {
    id: '7', name: 'Total Energies', overallScore: 86, paymentScore: 88, riskScore: 18, trend: 'up', category: 'A',
    history: [
      { month: 'Oct', score: 82 }, { month: 'Nov', score: 83 }, { month: 'Dec', score: 84 },
      { month: 'Jan', score: 85 }, { month: 'Fev', score: 85 }, { month: 'Mar', score: 86 },
    ],
    criteria: [
      { label: 'Ponctualite paiement', score: 88, weight: 0.35 },
      { label: 'Anciennete bail', score: 82, weight: 0.15 },
      { label: 'Montant loyer / CA estime', score: 85, weight: 0.20 },
      { label: 'Historique litiges', score: 88, weight: 0.15 },
      { label: 'Solidite financiere', score: 86, weight: 0.15 },
    ],
    recommendations: ['Aucune action requise', 'Bon profil payeur'],
  },
  {
    id: '8', name: 'Jumia CI', overallScore: 42, paymentScore: 35, riskScore: 68, trend: 'down', category: 'D',
    history: [
      { month: 'Oct', score: 68 }, { month: 'Nov', score: 62 }, { month: 'Dec', score: 58 },
      { month: 'Jan', score: 52 }, { month: 'Fev', score: 48 }, { month: 'Mar', score: 42 },
    ],
    criteria: [
      { label: 'Ponctualite paiement', score: 35, weight: 0.35 },
      { label: 'Anciennete bail', score: 55, weight: 0.15 },
      { label: 'Montant loyer / CA estime', score: 40, weight: 0.20 },
      { label: 'Historique litiges', score: 45, weight: 0.15 },
      { label: 'Solidite financiere', score: 38, weight: 0.15 },
    ],
    recommendations: ['Mise en demeure recommandee', 'Activer la garantie bancaire', 'Envisager procedure judiciaire si pas de regularisation sous 30 jours'],
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function scoreColor(score: number) {
  if (score >= 80) return 'text-green-600';
  if (score >= 65) return 'text-lime-600';
  if (score >= 50) return 'text-yellow-600';
  if (score >= 35) return 'text-orange-500';
  return 'text-red-600';
}

function progressColor(score: number) {
  if (score >= 80) return '[&>div]:bg-green-600';
  if (score >= 65) return '[&>div]:bg-lime-500';
  if (score >= 50) return '[&>div]:bg-yellow-500';
  if (score >= 35) return '[&>div]:bg-orange-500';
  return '[&>div]:bg-red-600';
}

function categoryColor(cat: Category) {
  const map: Record<Category, string> = { A: 'bg-green-100 text-green-800', B: 'bg-blue-100 text-blue-800', C: 'bg-yellow-100 text-yellow-800', D: 'bg-red-100 text-red-800' };
  return map[cat];
}

const TrendIcon = ({ trend }: { trend: Trend }) => {
  if (trend === 'up') return <ArrowUp className="h-4 w-4 text-green-600" />;
  if (trend === 'down') return <ArrowDown className="h-4 w-4 text-red-500" />;
  return <Minus className="h-4 w-4 text-gray-400" />;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function Scoring() {
  const [search, setSearch] = useState('');
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);

  const filtered = useMemo(() => {
    if (!search) return tenants;
    const q = search.toLowerCase();
    return tenants.filter((t) => t.name.toLowerCase().includes(q));
  }, [search]);

  const avgScore = Math.round(tenants.reduce((s, t) => s + t.overallScore, 0) / tenants.length);
  const atRisk = tenants.filter((t) => t.category === 'C' || t.category === 'D').length;
  const improving = tenants.filter((t) => t.trend === 'up').length;
  const degrading = tenants.filter((t) => t.trend === 'down').length;

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <PageHeader title="Scoring Locataires" description="Evaluation comportementale des locataires par IA" />

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Score moyen</CardTitle>
          </CardHeader>
          <CardContent>
            <span className={`text-2xl font-bold ${scoreColor(avgScore)}`}>{avgScore}/100</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Locataires a risque</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              <span className="text-2xl font-bold text-orange-500">{atRisk}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">En amelioration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <span className="text-2xl font-bold text-green-600">{improving}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">En degradation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-red-500" />
              <span className="text-2xl font-bold text-red-500">{degrading}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher un locataire..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-8"
        />
      </div>

      {/* Scoring Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left px-4 py-3 font-medium">Locataire</th>
                  <th className="text-left px-4 py-3 font-medium">Score global</th>
                  <th className="text-left px-4 py-3 font-medium">Score paiement</th>
                  <th className="text-left px-4 py-3 font-medium">Score risque</th>
                  <th className="text-center px-4 py-3 font-medium">Tendance</th>
                  <th className="text-center px-4 py-3 font-medium">Categorie</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => (
                  <tr
                    key={t.id}
                    className="border-b hover:bg-muted/30 cursor-pointer transition-colors"
                    onClick={() => setSelectedTenant(t)}
                  >
                    <td className="px-4 py-3 font-medium">{t.name}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3 min-w-[180px]">
                        <Progress value={t.overallScore} className={`h-2 flex-1 ${progressColor(t.overallScore)}`} />
                        <span className={`text-sm font-bold w-8 ${scoreColor(t.overallScore)}`}>{t.overallScore}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`font-medium ${scoreColor(t.paymentScore)}`}>{t.paymentScore}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`font-medium ${t.riskScore >= 50 ? 'text-red-600' : t.riskScore >= 30 ? 'text-orange-500' : 'text-green-600'}`}>
                        {t.riskScore}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <TrendIcon trend={t.trend} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${categoryColor(t.category)}`}>
                        {t.category}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!selectedTenant} onOpenChange={(open) => { if (!open) setSelectedTenant(null); }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {selectedTenant && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <Users className="h-5 w-5" />
                  {selectedTenant.name}
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${categoryColor(selectedTenant.category)}`}>
                    Cat. {selectedTenant.category}
                  </span>
                </DialogTitle>
                <DialogDescription>
                  Score global: {selectedTenant.overallScore}/100 — Paiement: {selectedTenant.paymentScore} — Risque: {selectedTenant.riskScore}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-5 mt-2">
                {/* History Chart */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Historique du score (6 mois)</h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={selectedTenant.history} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Line type="monotone" dataKey="score" stroke="#171717" strokeWidth={2} dot={{ r: 3 }} name="Score" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Criteria Breakdown */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Decomposition par critere</h4>
                  <div className="space-y-2">
                    {selectedTenant.criteria.map((c, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <span className="text-sm text-muted-foreground w-48 shrink-0">{c.label} ({Math.round(c.weight * 100)}%)</span>
                        <Progress value={c.score} className={`h-2 flex-1 ${progressColor(c.score)}`} />
                        <span className={`text-sm font-bold w-8 ${scoreColor(c.score)}`}>{c.score}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recommendations */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Recommandations</h4>
                  <div className="space-y-1.5">
                    {selectedTenant.recommendations.map((rec, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm bg-muted/50 rounded px-3 py-2">
                        <Activity className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                        {rec}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
