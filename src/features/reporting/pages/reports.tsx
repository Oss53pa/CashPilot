import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Download, FileSpreadsheet, FileText, FileDown } from 'lucide-react';

import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/components/ui/use-toast';
import { exportToExcel, exportToCsv } from '@/lib/export-excel';

import { ReportSelector, type ReportType } from '../components/report-selector';
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

const REPORT_LABELS: Record<ReportType, string> = {
  'cash-position': 'Cash Position',
  'cash-flow': 'Cash Flow Statement',
  'budget-variance': 'Budget Variance',
  'forecast-accuracy': 'Forecast Accuracy',
  aging: 'Aged Receivables',
  'bank-reconciliation': 'Bank Reconciliation',
  collection: 'Collection Report',
  dispute: 'Dispute Report',
  'multi-bank': 'Multi-Bank Position',
  capex: 'CAPEX Report',
  fiscal: 'Fiscal Report',
  'treasury-weekly': '13-Week Treasury Plan',
};

export default function ReportsPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [selectedReport, setSelectedReport] = useState<ReportType | null>(null);

  function handleExportExcel() {
    if (!selectedReport) return;
    // Export a sample/placeholder row — in production this would serialize the report data
    const sampleData = [{ report: REPORT_LABELS[selectedReport], exported_at: new Date().toISOString() }];
    exportToExcel(sampleData, `cashpilot-${selectedReport}`);
    toast({
      title: t('reports.exportSuccess', 'Export successful'),
      description: t('reports.excelDownloaded', 'Excel file downloaded.'),
    });
  }

  function handleExportCsv() {
    if (!selectedReport) return;
    const sampleData = [{ report: REPORT_LABELS[selectedReport], exported_at: new Date().toISOString() }];
    exportToCsv(sampleData, `cashpilot-${selectedReport}`);
    toast({
      title: t('reports.exportSuccess', 'Export successful'),
      description: t('reports.csvDownloaded', 'CSV file downloaded.'),
    });
  }

  function handleExportPdf() {
    toast({
      title: t('reports.comingSoon', 'Coming soon'),
      description: t('reports.pdfComingSoon', 'PDF export will be available in a future release.'),
    });
  }

  const renderReport = () => {
    switch (selectedReport) {
      case 'cash-position':
        return <CashPositionReport />;
      case 'cash-flow':
        return <CashFlowReport />;
      case 'budget-variance':
        return <BudgetVarianceReport />;
      case 'forecast-accuracy':
        return (
          <div className="rounded-lg border p-8 text-center text-muted-foreground">
            {t('reports.forecastAccuracyPlaceholder', 'Forecast Accuracy report coming soon.')}
          </div>
        );
      case 'aging':
        return <AgedReceivablesReport />;
      case 'bank-reconciliation':
        return (
          <div className="rounded-lg border p-8 text-center text-muted-foreground">
            {t('reports.bankReconciliationPlaceholder', 'Bank Reconciliation report coming soon.')}
          </div>
        );
      case 'collection':
        return <CollectionReport />;
      case 'dispute':
        return <DisputeReport />;
      case 'multi-bank':
        return <MultiBankReport />;
      case 'capex':
        return <CapexReport />;
      case 'fiscal':
        return <FiscalReport />;
      case 'treasury-weekly':
        return <TreasuryWeeklyReport />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('reports.title', 'Reports')}
        description={t('reports.description', 'Generate and export financial reports')}
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" disabled={!selectedReport}>
              <Download className="mr-2 h-4 w-4" />
              {t('reports.export', 'Export')}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleExportExcel}>
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              {t('reports.exportExcel', 'Export to Excel (.xlsx)')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExportCsv}>
              <FileDown className="mr-2 h-4 w-4" />
              {t('reports.exportCsv', 'Export to CSV')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExportPdf}>
              <FileText className="mr-2 h-4 w-4" />
              {t('reports.exportPdf', 'Export to PDF (coming soon)')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </PageHeader>

      <ReportSelector selectedReport={selectedReport} onSelectReport={setSelectedReport} />

      {selectedReport && (
        <>
          <Separator />
          {renderReport()}
        </>
      )}
    </div>
  );
}
