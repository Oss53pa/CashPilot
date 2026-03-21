import { useState } from 'react';
import {
  Download,
  FileSpreadsheet,
  FileText,
  FileDown,
  ShieldCheck,
} from 'lucide-react';

import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { exportToExcel } from '@/lib/export-excel';

import { useTFT, useCertifyTFT } from '../hooks/use-tft';
import { TFTHeader } from '../components/tft-header';
import { TFTSectionComponent } from '../components/tft-section';
import { TFTReconciliation } from '../components/tft-reconciliation';
import { TFTComplementary } from '../components/tft-complementary';

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function TFTPage() {
  const { toast } = useToast();

  // State
  const [method, setMethod] = useState<'direct' | 'indirect'>('direct');
  const [statementType, setStatementType] = useState<'realized' | 'forecast' | 'hybrid'>('realized');
  const [scope, setScope] = useState<'company' | 'group'>('company');
  const [periodType, setPeriodType] = useState<'monthly' | 'quarterly' | 'annual'>('monthly');

  // Hardcoded period for mock
  const periodStart = '2026-03-01';
  const periodEnd = '2026-03-31';
  const companyId = 'cosmos-yopougon';

  // Query
  const { data: tft, isLoading } = useTFT(companyId, periodStart, periodEnd, method, statementType);
  const certifyMutation = useCertifyTFT();

  // --- Export handlers ---
  function handleExportExcel() {
    if (!tft) return;
    const rows: Record<string, unknown>[] = [];

    // Flatten all sections into rows
    const sections = [tft.sections.exploitation, tft.sections.investment, tft.sections.financing];
    for (const section of sections) {
      for (const item of [...section.receipts, ...section.disbursements]) {
        rows.push({
          section: `${section.code} - ${section.title}`,
          code: item.code,
          libelle: item.label,
          periode_courante: item.sign === '-' ? -item.current_period : item.current_period,
          periode_precedente: item.sign === '-' ? -item.previous_period : item.previous_period,
          ecart: item.variance_amount ?? '',
          ecart_pct: item.variance_pct != null ? `${item.variance_pct}%` : '',
        });
      }
      rows.push({
        section: `${section.code} - ${section.title}`,
        code: '',
        libelle: `FLUX NET (${section.code})`,
        periode_courante: section.net_flow,
        periode_precedente: section.net_flow_previous,
        ecart: '',
        ecart_pct: '',
      });
    }

    exportToExcel(rows, `TFT-${tft.company_name}-${tft.period_start}`);
    toast({ title: 'Export Excel reussi' });
  }

  function handleExportPdf() {
    toast({ title: 'Export PDF', description: 'L\'export PDF sera disponible prochainement.' });
  }

  function handleCertify() {
    if (!tft) return;
    certifyMutation.mutate(
      { tftId: tft.id, userId: 'current-user' },
      {
        onSuccess: () => toast({ title: 'TFT certifie avec succes' }),
        onError: () => toast({ title: 'Erreur de certification', variant: 'destructive' }),
      },
    );
  }

  // --- Loading state ---
  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-6">
        <Skeleton className="h-8 w-96" />
        <Skeleton className="h-4 w-64" />
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      {/* Page header */}
      <PageHeader
        title="Tableau de Flux de Tresorerie"
        description={
          tft
            ? `${tft.company_name} — ${new Date(tft.period_start).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })} — ${tft.currency}`
            : 'Chargement...'
        }
      >
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleCertify} disabled={tft?.is_certified}>
            <ShieldCheck className="mr-2 h-4 w-4" />
            Certifier
          </Button>
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
              <DropdownMenuItem onClick={handleExportPdf}>
                <FileText className="mr-2 h-4 w-4" />
                PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </PageHeader>

      {/* TFT header: controls + KPIs */}
      <TFTHeader
        tft={tft}
        method={method}
        onMethodChange={setMethod}
        statementType={statementType}
        onStatementTypeChange={setStatementType}
        scope={scope}
        onScopeChange={setScope}
        periodType={periodType}
        onPeriodTypeChange={setPeriodType}
      />

      {/* Section A — Exploitation */}
      {tft && <TFTSectionComponent section={tft.sections.exploitation} />}

      {/* Section B — Investissement */}
      {tft && <TFTSectionComponent section={tft.sections.investment} />}

      {/* Section C — Financement */}
      {tft && <TFTSectionComponent section={tft.sections.financing} />}

      {/* Section D — Rapprochement */}
      {tft && <TFTReconciliation reconciliation={tft.reconciliation} />}

      {/* Section E — Complementaire */}
      {tft && <TFTComplementary complementary={tft.complementary} />}

      {/* Footer links */}
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground border-t pt-4">
        <span>Voir aussi :</span>
        <a href="/reports" className="underline hover:text-foreground">Rapports</a>
        <span>|</span>
        <a href="/budget" className="underline hover:text-foreground">Budget</a>
        <span>|</span>
        <a href="/forecast" className="underline hover:text-foreground">Previsions</a>
        <span>|</span>
        <a href="/consolidation" className="underline hover:text-foreground">Consolidation</a>
      </div>
    </div>
  );
}
