import { useState, useMemo } from 'react';
import {
  TrendingUp, TrendingDown, Wallet, Target, BarChart3, RefreshCw,
  Download, FileSpreadsheet, FileText,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine,
} from 'recharts';

import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import {
  AnnualForecastTable,
  type TableRow,
  type TableCell,
  type ViewMode,
  type CellStatus,
} from '../components/annual-forecast-table';

// ============================================================================
// MOCK DATA GENERATOR
// ============================================================================

const CURRENT_MONTH = 3; // Mars

function makeCell(month: number, budget: number, forecast: number, realized: number | null, model?: string): TableCell {
  const status: CellStatus = month < CURRENT_MONTH ? 'past_closed' : month === CURRENT_MONTH ? 'current_partial' : 'future_forecast';
  const alert = (() => {
    if (status === 'future_forecast') {
      const pct = Math.abs((forecast - budget) / Math.max(1, Math.abs(budget))) * 100;
      if (pct > 15) return 'critical' as const;
      if (pct > 5) return 'warning' as const;
    }
    return 'ok' as const;
  })();

  return {
    month,
    budget,
    forecast,
    realized,
    status,
    alert_level: alert,
    model: status === 'future_forecast' ? (model || 'SARIMA') : undefined,
    confidence: status === 'future_forecast' ? 0.84 : undefined,
  };
}

function monthlyRow(
  id: string, parentId: string | null, level: 0 | 1 | 2 | 3, type: TableRow['type'],
  label: string, budgets: number[], forecasts: number[], sortOrder: number,
  collapsible = false, defaultCollapsed = true, children?: TableRow[]
): TableRow {
  const cells: TableCell[] = budgets.map((b, i) => {
    const realized = i + 1 < CURRENT_MONTH ? forecasts[i] + Math.round((Math.random() - 0.5) * b * 0.08) : null;
    return makeCell(i + 1, b, forecasts[i], realized);
  });

  return { id, parentId, level, type, label, collapsible, defaultCollapsed, sortOrder, cells, children };
}

// --- Build mock data ---

function buildMockData(): TableRow[] {
  // Revenue rows
  const loyersA = monthlyRow('rev-1-a', 'rev-1', 3, 'income', 'ZARA CI', Array(12).fill(2_100_000_00), Array(12).fill(1_974_000_00), 1);
  const loyersB = monthlyRow('rev-1-b', 'rev-1', 3, 'income', 'CARREFOUR Market', Array(12).fill(3_800_000_00), Array(12).fill(3_500_000_00), 2);
  const loyersC = monthlyRow('rev-1-c', 'rev-1', 3, 'income', 'Orange CI', Array(12).fill(4_200_000_00), Array(12).fill(4_200_000_00), 3);
  const loyersD = monthlyRow('rev-1-d', 'rev-1', 3, 'income', 'Banque Atlantique', Array(12).fill(5_500_000_00), Array(12).fill(5_500_000_00), 4);
  const loyersE = monthlyRow('rev-1-e', 'rev-1', 3, 'income', 'MTN Boutique', Array(12).fill(1_800_000_00), Array(12).fill(1_650_000_00), 5);
  const loyersF = monthlyRow('rev-1-f', 'rev-1', 3, 'income', 'Total Energies', Array(12).fill(2_800_000_00), Array(12).fill(2_750_000_00), 6);
  const loyersG = monthlyRow('rev-1-g', 'rev-1', 3, 'income', 'Jumia CI', Array(12).fill(1_500_000_00), Array(12).fill(800_000_00), 7);

  const loyersFixes = monthlyRow('rev-1', 'rev', 1, 'income', 'Loyers fixes',
    Array(12).fill(21_700_000_00), Array(12).fill(20_374_000_00), 1, true, true,
    [loyersA, loyersB, loyersC, loyersD, loyersE, loyersF, loyersG]);

  const chargesLoc = monthlyRow('rev-2', 'rev', 1, 'income', 'Charges locatives',
    Array(12).fill(8_500_000_00), Array(12).fill(8_200_000_00), 2, true, true);

  const revAnnexes = monthlyRow('rev-3', 'rev', 1, 'income', 'Revenus annexes',
    Array(12).fill(2_800_000_00),
    [2_200_000_00, 2_400_000_00, 2_600_000_00, 3_100_000_00, 2_800_000_00, 2_900_000_00, 3_500_000_00, 2_500_000_00, 2_800_000_00, 3_000_000_00, 3_200_000_00, 4_500_000_00],
    3, true, true);

  const prodFinanciers = monthlyRow('rev-4', 'rev', 1, 'income', 'Produits financiers',
    Array(12).fill(275_000_00), Array(12).fill(275_000_00), 4);

  const totalRevBudgets = Array(12).fill(0).map((_, i) => loyersFixes.cells[i].budget + chargesLoc.cells[i].budget + revAnnexes.cells[i].budget + prodFinanciers.cells[i].budget);
  const totalRevForecasts = Array(12).fill(0).map((_, i) => loyersFixes.cells[i].forecast + chargesLoc.cells[i].forecast + revAnnexes.cells[i].forecast + prodFinanciers.cells[i].forecast);

  const revenus = monthlyRow('rev', null, 0, 'income', 'REVENUS TOTAUX', totalRevBudgets, totalRevForecasts, 1, true, false,
    [loyersFixes, chargesLoc, revAnnexes, prodFinanciers]);

  // Expense rows
  const personnel = monthlyRow('chg-1', 'chg', 1, 'expense', 'Personnel', Array(12).fill(12_300_000_00), Array(12).fill(12_300_000_00), 1, true, true);
  const maintenance = monthlyRow('chg-2', 'chg', 1, 'expense', 'Maintenance & Facility', Array(12).fill(4_800_000_00), Array(12).fill(5_100_000_00), 2, true, true);
  const energie = monthlyRow('chg-3', 'chg', 1, 'expense', 'Energie',
    Array(12).fill(3_100_000_00),
    [2_800_000_00, 2_900_000_00, 3_200_000_00, 3_500_000_00, 3_800_000_00, 4_200_000_00, 4_500_000_00, 4_300_000_00, 3_800_000_00, 3_200_000_00, 2_900_000_00, 2_800_000_00],
    3, true, true);
  const securite = monthlyRow('chg-4', 'chg', 1, 'expense', 'Securite & Gardiennage', Array(12).fill(4_200_000_00), Array(12).fill(4_200_000_00), 4);
  const nettoyage = monthlyRow('chg-5', 'chg', 1, 'expense', 'Nettoyage & Hygiene', Array(12).fill(1_800_000_00), Array(12).fill(1_850_000_00), 5);
  const assurances = monthlyRow('chg-6', 'chg', 1, 'expense', 'Assurances', Array(12).fill(2_200_000_00), Array(12).fill(2_200_000_00), 6);
  const honoraires = monthlyRow('chg-7', 'chg', 1, 'expense', 'Honoraires & Prestataires', Array(12).fill(1_500_000_00), Array(12).fill(1_600_000_00), 7);
  const fraisGen = monthlyRow('chg-8', 'chg', 1, 'expense', 'Frais generaux', Array(12).fill(2_100_000_00), Array(12).fill(2_200_000_00), 8);
  const taxes = monthlyRow('chg-9', 'chg', 1, 'expense', 'Taxes exploitation', Array(12).fill(1_200_000_00), Array(12).fill(1_200_000_00), 9);

  const allCharges = [personnel, maintenance, energie, securite, nettoyage, assurances, honoraires, fraisGen, taxes];
  const totalChgBudgets = Array(12).fill(0).map((_, i) => allCharges.reduce((s, c) => s + c.cells[i].budget, 0));
  const totalChgForecasts = Array(12).fill(0).map((_, i) => allCharges.reduce((s, c) => s + c.cells[i].forecast, 0));

  const charges = monthlyRow('chg', null, 0, 'expense', 'CHARGES TOTALES', totalChgBudgets, totalChgForecasts, 2, true, false, allCharges);

  // Resultat d'exploitation
  const resultatBudgets = totalRevBudgets.map((r, i) => r - totalChgBudgets[i]);
  const resultatForecasts = totalRevForecasts.map((r, i) => r - totalChgForecasts[i]);
  const resultat = monthlyRow('resultat', null, 0, 'total', 'RESULTAT D\'EXPLOITATION', resultatBudgets, resultatForecasts, 3);

  // CAPEX
  const capexMaint = monthlyRow('cpx-1', 'cpx', 1, 'capex', 'CAPEX Maintenance',
    [5_000_000_00, 3_000_000_00, 8_000_000_00, 12_000_000_00, 5_000_000_00, 3_000_000_00, 2_000_000_00, 2_000_000_00, 5_000_000_00, 3_000_000_00, 2_000_000_00, 3_000_000_00],
    [4_500_000_00, 2_800_000_00, 7_200_000_00, 12_750_000_00, 5_000_000_00, 3_000_000_00, 2_000_000_00, 2_000_000_00, 5_000_000_00, 3_000_000_00, 2_000_000_00, 3_000_000_00],
    1, true, true);
  const capexAmelio = monthlyRow('cpx-2', 'cpx', 1, 'capex', 'CAPEX Amelioration',
    [0, 0, 0, 15_000_000_00, 15_000_000_00, 12_500_000_00, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 15_000_000_00, 15_000_000_00, 12_500_000_00, 0, 0, 0, 0, 0, 0],
    2, true, true);

  const capexBudgets = Array(12).fill(0).map((_, i) => capexMaint.cells[i].budget + capexAmelio.cells[i].budget);
  const capexForecasts = Array(12).fill(0).map((_, i) => capexMaint.cells[i].forecast + capexAmelio.cells[i].forecast);
  const capex = monthlyRow('cpx', null, 0, 'capex', 'CAPEX', capexBudgets, capexForecasts, 4, true, false, [capexMaint, capexAmelio]);

  // Service de la dette
  const rembCapital = monthlyRow('det-1', 'det', 1, 'debt', 'Remboursement capital', Array(12).fill(4_245_000_00), Array(12).fill(4_245_000_00), 1);
  const interets = monthlyRow('det-2', 'det', 1, 'debt', 'Interets d\'emprunt', Array(12).fill(5_605_000_00), Array(12).fill(5_605_000_00), 2);

  const detteBudgets = Array(12).fill(9_850_000_00);
  const detteForecasts = Array(12).fill(9_850_000_00);
  const dette = monthlyRow('det', null, 0, 'debt', 'SERVICE DE LA DETTE', detteBudgets, detteForecasts, 5, true, false, [rembCapital, interets]);

  // Flux net
  const fluxNetBudgets = resultatBudgets.map((r, i) => r - capexBudgets[i] - detteBudgets[i]);
  const fluxNetForecasts = resultatForecasts.map((r, i) => r - capexForecasts[i] - detteForecasts[i]);
  const fluxNet = monthlyRow('flux-net', null, 0, 'total', 'FLUX NET AVANT TRESORERIE', fluxNetBudgets, fluxNetForecasts, 6);

  // Mouvements de tresorerie
  const tvaNette = monthlyRow('mvt-1', 'mvt', 1, 'treasury', 'TVA nette a reverser', Array(12).fill(3_600_000_00), Array(12).fill(3_400_000_00), 1);
  const isAcomptes = monthlyRow('mvt-2', 'mvt', 1, 'treasury', 'IS et acomptes',
    [0, 0, 8_200_000_00, 0, 0, 8_200_000_00, 0, 0, 8_200_000_00, 0, 0, 8_200_000_00],
    [0, 0, 8_200_000_00, 0, 0, 8_200_000_00, 0, 0, 8_200_000_00, 0, 0, 8_200_000_00],
    2);

  const mvtBudgets = Array(12).fill(0).map((_, i) => tvaNette.cells[i].budget + isAcomptes.cells[i].budget);
  const mvtForecasts = Array(12).fill(0).map((_, i) => tvaNette.cells[i].forecast + isAcomptes.cells[i].forecast);
  const mouvements = monthlyRow('mvt', null, 0, 'treasury', 'MOUVEMENTS DE TRESORERIE', mvtBudgets, mvtForecasts, 7, true, false, [tvaNette, isAcomptes]);

  // Position de tresorerie
  const positionOpenBudget = [130_823_700_00];
  const positionOpenForecast = [130_823_700_00];
  for (let i = 1; i < 12; i++) {
    positionOpenBudget[i] = positionOpenBudget[i - 1] + fluxNetBudgets[i - 1] - mvtBudgets[i - 1];
    positionOpenForecast[i] = positionOpenForecast[i - 1] + fluxNetForecasts[i - 1] - mvtForecasts[i - 1];
  }

  const positionOpen = monthlyRow('pos-open', 'pos', 1, 'position', 'Position d\'ouverture', positionOpenBudget, positionOpenForecast, 1);

  const positionFluxNet = monthlyRow('pos-flux', 'pos', 1, 'position', 'Flux net du mois',
    fluxNetBudgets.map((f, i) => f - mvtBudgets[i]),
    fluxNetForecasts.map((f, i) => f - mvtForecasts[i]),
    2);

  const positionCloseBudgets = positionOpenBudget.map((o, i) => o + fluxNetBudgets[i] - mvtBudgets[i]);
  const positionCloseForecasts = positionOpenForecast.map((o, i) => o + fluxNetForecasts[i] - mvtForecasts[i]);
  const positionClose = monthlyRow('pos-close', 'pos', 1, 'position', 'Position de cloture', positionCloseBudgets, positionCloseForecasts, 3);

  const position = monthlyRow('pos', null, 0, 'position', 'POSITION DE TRESORERIE', positionCloseBudgets, positionCloseForecasts, 8, true, false,
    [positionOpen, positionFluxNet, positionClose]);

  return [revenus, charges, resultat, capex, dette, fluxNet, mouvements, position];
}

// ============================================================================
// CHART DATA
// ============================================================================

function buildChartData(rows: TableRow[]) {
  const posRow = rows.find(r => r.id === 'pos');
  const closeRow = posRow?.children?.find(r => r.id === 'pos-close');
  if (!closeRow) return [];

  return MONTHS_FULL.map((m, i) => ({
    month: m,
    budget: closeRow.cells[i].budget / 100,
    prevision: closeRow.cells[i].forecast / 100,
    realise: closeRow.cells[i].realized !== null ? closeRow.cells[i].realized! / 100 : undefined,
    seuil: 50_000_000,
  }));
}

const MONTHS_FULL = ['Jan', 'Fev', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aou', 'Sep', 'Oct', 'Nov', 'Dec'];

// ============================================================================
// COMPONENT
// ============================================================================

export default function AnnualForecastPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('budget_forecast');
  const [scenario, setScenario] = useState('base');
  const [showVariance, setShowVariance] = useState(true);
  const [showChart, setShowChart] = useState(true);

  const rows = useMemo(() => buildMockData(), []);
  const chartData = useMemo(() => buildChartData(rows), [rows]);

  // KPI calculations
  const posRow = rows.find(r => r.id === 'pos');
  const closeRow = posRow?.children?.find(r => r.id === 'pos-close');
  const revRow = rows.find(r => r.id === 'rev');

  const currentPosition = closeRow?.cells[CURRENT_MONTH - 1]?.forecast ?? 0;
  const yearEndPosition = closeRow?.cells[11]?.forecast ?? 0;
  const budgetVarRev = revRow ? (() => {
    const totalBudget = revRow.cells.reduce((s, c) => s + c.budget, 0);
    const totalForecast = revRow.cells.reduce((s, c) => s + c.forecast, 0);
    return totalBudget > 0 ? ((totalForecast - totalBudget) / totalBudget * 100) : 0;
  })() : 0;
  const ytdRealization = revRow ? (() => {
    const ytdBudget = revRow.cells.slice(0, CURRENT_MONTH).reduce((s, c) => s + c.budget, 0);
    const ytdRealized = revRow.cells.slice(0, CURRENT_MONTH).reduce((s, c) => s + (c.realized ?? c.forecast), 0);
    return ytdBudget > 0 ? (ytdRealized / ytdBudget * 100) : 0;
  })() : 0;

  function formatM(centimes: number) {
    return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(centimes / 100) + ' FCFA';
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-6">
      {/* Header */}
      <PageHeader title="Prevision Annuelle Consolidee" description="Budget, previsions Proph3t et realise — vue 12 mois">
        <div className="flex items-center gap-2">
          <Select value={scenario} onValueChange={setScenario}>
            <SelectTrigger className="w-[130px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="base">Base</SelectItem>
              <SelectItem value="optimiste">Optimiste</SelectItem>
              <SelectItem value="pessimiste">Pessimiste</SelectItem>
            </SelectContent>
          </Select>

          <Select value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
            <SelectTrigger className="w-[180px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="budget_forecast">Budget + Prevision</SelectItem>
              <SelectItem value="budget_forecast_realized">Budget + Prevision + Realise</SelectItem>
              <SelectItem value="budget_only">Budget seul</SelectItem>
              <SelectItem value="forecast_only">Prevision seule</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setShowChart(!showChart)}>
            <BarChart3 className="h-3.5 w-3.5 mr-1" />
            {showChart ? 'Masquer graphique' : 'Afficher graphique'}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 text-xs">
                <Download className="h-3.5 w-3.5 mr-1" />
                Exporter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem><FileSpreadsheet className="mr-2 h-4 w-4" />Excel</DropdownMenuItem>
              <DropdownMenuItem><FileText className="mr-2 h-4 w-4" />PDF</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </PageHeader>

      {/* KPI Cards */}
      <div className="grid gap-3 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-medium text-muted-foreground">Position actuelle</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-muted-foreground" />
              <span className="text-lg font-bold">{formatM(currentPosition)}</span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5">Au {new Date().toLocaleDateString('fr-FR')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-medium text-muted-foreground">Prevision fin d'annee</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              <span className="text-lg font-bold">{formatM(yearEndPosition)}</span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5">Scenario {scenario}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-medium text-muted-foreground">Ecart revenus / budget</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {budgetVarRev < 0 ? <TrendingDown className="h-4 w-4 text-red-500" /> : <TrendingUp className="h-4 w-4 text-green-600" />}
              <span className={`text-lg font-bold ${budgetVarRev < -5 ? 'text-red-600' : budgetVarRev < 0 ? 'text-orange-500' : 'text-green-600'}`}>
                {budgetVarRev > 0 ? '+' : ''}{budgetVarRev.toFixed(1)}%
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5">Prevision vs budget annuel</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs font-medium text-muted-foreground">Taux de realisation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              <span className={`text-lg font-bold ${ytdRealization >= 90 ? 'text-green-600' : ytdRealization >= 80 ? 'text-orange-500' : 'text-red-600'}`}>
                {ytdRealization.toFixed(1)}%
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5">YTD Jan → {MONTHS_FULL[CURRENT_MONTH - 1]}</p>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      {showChart && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Position de tresorerie previsionnelle</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v: number) => `${(v / 1_000_000).toFixed(0)}M`} />
                <Tooltip formatter={(v: number) => `${new Intl.NumberFormat('fr-FR').format(v)} FCFA`} />
                <Legend />
                <ReferenceLine y={50_000_000} stroke="#ef4444" strokeDasharray="5 5" label={{ value: 'Seuil', fill: '#ef4444', fontSize: 10 }} />
                <Area type="monotone" dataKey="budget" stroke="#a3a3a3" fill="#a3a3a3" fillOpacity={0.08} strokeDasharray="5 5" strokeWidth={1.5} name="Budget" />
                <Area type="monotone" dataKey="prevision" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} strokeWidth={2} name="Prevision" />
                {chartData.some(d => d.realise !== undefined) && (
                  <Area type="monotone" dataKey="realise" stroke="#171717" fill="#171717" fillOpacity={0.15} strokeWidth={2} name="Realise" />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Freshness indicator */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Badge variant="outline" className="text-[10px] gap-1">
          <RefreshCw className="h-3 w-3" />
          Derniere mise a jour : Aujourd'hui 06:42
        </Badge>
        <Badge variant="outline" className="text-[10px]">
          Exercice 2026
        </Badge>
        <Badge variant="outline" className="text-[10px]">
          Cosmos Yopougon SA
        </Badge>
        <div className="flex-1" />
        <button
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => setShowVariance(!showVariance)}
        >
          {showVariance ? 'Masquer ecarts' : 'Afficher ecarts'}
        </button>
      </div>

      {/* Annual Forecast Table */}
      <AnnualForecastTable
        rows={rows}
        currentMonth={CURRENT_MONTH}
        viewMode={viewMode}
        showVariance={showVariance}
        highlightThreshold={5}
      />
    </div>
  );
}
