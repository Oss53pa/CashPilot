import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Download, FileSpreadsheet, FileText, FileDown,
  Wallet, ArrowLeftRight, BarChart3, Target, Clock,
  CheckCircle2, Receipt, Gavel, Building2, Landmark,
  CalendarDays, ChevronRight,
} from 'lucide-react';

import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { exportToExcel, exportToCsv } from '@/lib/export-excel';
import {
  exportCashPositionPdf,
  exportCashFlowPdf,
  exportBudgetVariancePdf,
  exportAgingPdf,
  exportCapexPdf,
  exportGenericPdf,
} from '@/lib/export-pdf';

import { CashPositionReport } from '../components/reports/cash-position-report';
import { CashFlowReport } from '../components/reports/cash-flow-report';
import { BudgetVarianceReport } from '../components/reports/budget-variance-report';
import { AgedReceivablesReport } from '../components/reports/aged-receivables-report';
import { CollectionReport } from '../components/reports/collection-report';
import { DisputeReport } from '../components/reports/dispute-report';
import { MultiBankReport } from '../components/reports/multi-bank-report';
import { CapexReport } from '../components/reports/capex-report';
import { FiscalReport } from '../components/reports/fiscal-report';
import { TreasuryWeeklyReport } from '../components/reports/treasury-weekly-report';

// ---------------------------------------------------------------------------
// Report definitions grouped by category
// ---------------------------------------------------------------------------

type ReportType =
  | 'cash-position' | 'cash-flow' | 'budget-variance' | 'forecast-accuracy'
  | 'aging' | 'bank-reconciliation' | 'collection' | 'dispute'
  | 'multi-bank' | 'capex' | 'fiscal' | 'treasury-weekly';

interface ReportDef {
  type: ReportType;
  label: string;
  description: string;
  icon: React.ElementType;
}

interface ReportGroup {
  category: string;
  reports: ReportDef[];
}

const REPORT_GROUPS: ReportGroup[] = [
  {
    category: 'Tresorerie',
    reports: [
      { type: 'cash-position', label: 'Position de tresorerie', description: 'Soldes par compte en temps reel', icon: Wallet },
      { type: 'cash-flow', label: 'Flux de tresorerie', description: 'Encaissements et decaissements', icon: ArrowLeftRight },
      { type: 'treasury-weekly', label: 'Plan 13 semaines', description: 'Prevision glissante hebdomadaire', icon: BarChart3 },
    ],
  },
  {
    category: 'Budget & Previsions',
    reports: [
      { type: 'budget-variance', label: 'Ecart budgetaire', description: 'Budget vs realise par categorie', icon: Target },
      { type: 'forecast-accuracy', label: 'Precision des previsions', description: 'Performance du modele previsionnel', icon: Target },
    ],
  },
  {
    category: 'Creances & Recouvrement',
    reports: [
      { type: 'aging', label: 'Balance agee', description: 'Creances par anciennete', icon: Clock },
      { type: 'collection', label: 'Recouvrement', description: 'Taux, DSO, performance par locataire', icon: Receipt },
      { type: 'dispute', label: 'Contentieux', description: 'Dossiers actifs, provisions, audiences', icon: Gavel },
    ],
  },
  {
    category: 'Comptes & Banques',
    reports: [
      { type: 'multi-bank', label: 'Position multi-banques', description: 'Consolidation tous comptes', icon: Building2 },
      { type: 'bank-reconciliation', label: 'Rapprochement bancaire', description: 'Solde banque vs solde livre', icon: CheckCircle2 },
    ],
  },
  {
    category: 'Investissements & Fiscal',
    reports: [
      { type: 'capex', label: 'Suivi CAPEX', description: 'Budget, engage, decaisse par operation', icon: Landmark },
      { type: 'fiscal', label: 'Obligations fiscales', description: 'TVA, IS, calendrier echeances', icon: CalendarDays },
    ],
  },
];

const ALL_REPORTS = REPORT_GROUPS.flatMap(g => g.reports);

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ReportsPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [selectedReport, setSelectedReport] = useState<ReportType>('cash-position');

  const currentReport = ALL_REPORTS.find(r => r.type === selectedReport)!;

  // --- Export handlers ---
  function handleExportExcel() {
    const sampleData = [{ report: currentReport.label, exported_at: new Date().toISOString() }];
    exportToExcel(sampleData, `cashpilot-${selectedReport}`);
    toast({ title: 'Export Excel reussi' });
  }

  function handleExportCsv() {
    const sampleData = [{ report: currentReport.label, exported_at: new Date().toISOString() }];
    exportToCsv(sampleData, `cashpilot-${selectedReport}`);
    toast({ title: 'Export CSV reussi' });
  }

  function handleExportPdf() {
    try {
      switch (selectedReport) {
        case 'cash-position':
          exportCashPositionPdf({ company_name: 'CashPilot', accounts: [], total_balance: 0 });
          break;
        case 'cash-flow':
          exportCashFlowPdf({ company_name: 'CashPilot', flows: [], total_receipts: 0, total_disbursements: 0, net_flow: 0 });
          break;
        case 'budget-variance':
          exportBudgetVariancePdf({ company_name: 'CashPilot', lines: [] });
          break;
        case 'aging':
          exportAgingPdf({ company_name: 'CashPilot', counterparties: [] });
          break;
        case 'capex':
          exportCapexPdf({ company_name: 'CashPilot', operations: [] });
          break;
        default:
          exportGenericPdf(currentReport.label, 'CashPilot', ['Colonne'], []);
      }
      toast({ title: 'Export PDF reussi' });
    } catch (err) {
      toast({ title: 'Erreur export', description: String(err), variant: 'destructive' });
    }
  }

  // --- Render report ---
  function renderReport() {
    switch (selectedReport) {
      case 'cash-position': return <CashPositionReport />;
      case 'cash-flow': return <CashFlowReport />;
      case 'budget-variance': return <BudgetVarianceReport />;
      case 'aging': return <AgedReceivablesReport />;
      case 'collection': return <CollectionReport />;
      case 'dispute': return <DisputeReport />;
      case 'multi-bank': return <MultiBankReport />;
      case 'capex': return <CapexReport />;
      case 'fiscal': return <FiscalReport />;
      case 'treasury-weekly': return <TreasuryWeeklyReport />;
      case 'forecast-accuracy':
      case 'bank-reconciliation':
        return (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Target className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="text-sm text-muted-foreground">Ce rapport sera disponible prochainement.</p>
          </div>
        );
      default: return null;
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-0 p-0">
      {/* Header */}
      <div className="px-6 pt-6 pb-4">
        <PageHeader
          title={t('reports.title', 'Rapports')}
          description={t('reports.description', 'Generez et exportez vos rapports financiers')}
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Exporter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExportExcel}>
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Excel (.xlsx)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportCsv}>
                <FileDown className="mr-2 h-4 w-4" />
                CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportPdf}>
                <FileText className="mr-2 h-4 w-4" />
                PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </PageHeader>
      </div>

      {/* Main layout: sidebar nav + content */}
      <div className="flex flex-1 min-h-0 border-t">
        {/* Left sidebar - report navigation */}
        <aside className="w-72 border-r bg-muted/30 shrink-0 hidden md:block">
          <ScrollArea className="h-[calc(100vh-160px)]">
            <nav className="p-3 space-y-4">
              {REPORT_GROUPS.map((group) => (
                <div key={group.category}>
                  <p className="px-3 mb-1.5 text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60">
                    {group.category}
                  </p>
                  <div className="space-y-0.5">
                    {group.reports.map((report) => {
                      const Icon = report.icon;
                      const isActive = selectedReport === report.type;
                      return (
                        <button
                          key={report.type}
                          onClick={() => setSelectedReport(report.type)}
                          className={cn(
                            'w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors',
                            'hover:bg-accent hover:text-accent-foreground',
                            isActive
                              ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                              : 'text-muted-foreground'
                          )}
                        >
                          <Icon className="h-4 w-4 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className={cn('text-sm font-medium truncate', isActive && 'text-primary-foreground')}>
                              {report.label}
                            </p>
                            {!isActive && (
                              <p className="text-[11px] text-muted-foreground/70 truncate">
                                {report.description}
                              </p>
                            )}
                          </div>
                          {isActive && <ChevronRight className="h-4 w-4 shrink-0 opacity-60" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>
          </ScrollArea>
        </aside>

        {/* Mobile: horizontal tabs */}
        <div className="md:hidden border-b overflow-x-auto">
          <div className="flex p-2 gap-1.5">
            {ALL_REPORTS.map((report) => (
              <button
                key={report.type}
                onClick={() => setSelectedReport(report.type)}
                className={cn(
                  'shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap',
                  selectedReport === report.type
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-accent'
                )}
              >
                {report.label}
              </button>
            ))}
          </div>
        </div>

        {/* Right content area */}
        <main className="flex-1 overflow-y-auto">
          {/* Report title bar */}
          <div className="sticky top-0 z-10 bg-background border-b px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {(() => { const Icon = currentReport.icon; return <Icon className="h-5 w-5 text-muted-foreground" />; })()}
              <div>
                <h2 className="text-base font-semibold">{currentReport.label}</h2>
                <p className="text-xs text-muted-foreground">{currentReport.description}</p>
              </div>
            </div>
            <Badge variant="outline" className="text-xs">
              {new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
            </Badge>
          </div>

          {/* Report content */}
          <div className="p-6">
            {renderReport()}
          </div>
        </main>
      </div>
    </div>
  );
}
