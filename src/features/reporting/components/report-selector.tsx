import { useTranslation } from 'react-i18next';
import {
  Wallet,
  ArrowLeftRight,
  BarChart3,
  Target,
  Clock,
  CheckCircle2,
  Receipt,
  Gavel,
  Building2,
  Landmark,
  CalendarDays,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export type ReportType =
  | 'cash-position'
  | 'cash-flow'
  | 'budget-variance'
  | 'forecast-accuracy'
  | 'aging'
  | 'bank-reconciliation'
  | 'collection'
  | 'dispute'
  | 'multi-bank'
  | 'capex'
  | 'fiscal'
  | 'treasury-weekly';

interface ReportOption {
  type: ReportType;
  titleKey: string;
  titleDefault: string;
  descriptionKey: string;
  descriptionDefault: string;
  icon: React.ReactNode;
}

const reportOptions: ReportOption[] = [
  {
    type: 'cash-position',
    titleKey: 'reports.cashPosition',
    titleDefault: 'Cash Position',
    descriptionKey: 'reports.cashPositionDesc',
    descriptionDefault: 'Current cash balances across all accounts',
    icon: <Wallet className="h-8 w-8" />,
  },
  {
    type: 'cash-flow',
    titleKey: 'reports.cashFlow',
    titleDefault: 'Cash Flow Statement',
    descriptionKey: 'reports.cashFlowDesc',
    descriptionDefault: 'Receipts and disbursements breakdown',
    icon: <ArrowLeftRight className="h-8 w-8" />,
  },
  {
    type: 'budget-variance',
    titleKey: 'reports.budgetVariance',
    titleDefault: 'Budget Variance',
    descriptionKey: 'reports.budgetVarianceDesc',
    descriptionDefault: 'Budget vs actual with variance analysis',
    icon: <BarChart3 className="h-8 w-8" />,
  },
  {
    type: 'forecast-accuracy',
    titleKey: 'reports.forecastAccuracy',
    titleDefault: 'Forecast Accuracy',
    descriptionKey: 'reports.forecastAccuracyDesc',
    descriptionDefault: 'How well forecasts matched actual results',
    icon: <Target className="h-8 w-8" />,
  },
  {
    type: 'aging',
    titleKey: 'reports.aging',
    titleDefault: 'Aged Receivables',
    descriptionKey: 'reports.agingDesc',
    descriptionDefault: 'Receivables aging by counterparty with pie chart',
    icon: <Clock className="h-8 w-8" />,
  },
  {
    type: 'bank-reconciliation',
    titleKey: 'reports.bankReconciliation',
    titleDefault: 'Bank Reconciliation',
    descriptionKey: 'reports.bankReconciliationDesc',
    descriptionDefault: 'Bank vs book balance reconciliation',
    icon: <CheckCircle2 className="h-8 w-8" />,
  },
  {
    type: 'collection',
    titleKey: 'reports.collection',
    titleDefault: 'Collection Report',
    descriptionKey: 'reports.collectionDesc',
    descriptionDefault: 'Recovery rates, DSO, and collection performance by counterparty',
    icon: <Receipt className="h-8 w-8" />,
  },
  {
    type: 'dispute',
    titleKey: 'reports.dispute',
    titleDefault: 'Dispute Report',
    descriptionKey: 'reports.disputeDesc',
    descriptionDefault: 'Active litigation, provisions, and hearing schedule',
    icon: <Gavel className="h-8 w-8" />,
  },
  {
    type: 'multi-bank',
    titleKey: 'reports.multiBank',
    titleDefault: 'Multi-Bank Position',
    descriptionKey: 'reports.multiBankDesc',
    descriptionDefault: 'Consolidated position across all banks and accounts',
    icon: <Building2 className="h-8 w-8" />,
  },
  {
    type: 'capex',
    titleKey: 'reports.capex',
    titleDefault: 'CAPEX Report',
    descriptionKey: 'reports.capexDesc',
    descriptionDefault: 'Capital expenditure tracking with progress bars',
    icon: <Landmark className="h-8 w-8" />,
  },
  {
    type: 'fiscal',
    titleKey: 'reports.fiscal',
    titleDefault: 'Fiscal Report',
    descriptionKey: 'reports.fiscalDesc',
    descriptionDefault: 'Tax obligations, payments, and upcoming calendar',
    icon: <CalendarDays className="h-8 w-8" />,
  },
  {
    type: 'treasury-weekly',
    titleKey: 'reports.treasuryWeekly',
    titleDefault: '13-Week Treasury Plan',
    descriptionKey: 'reports.treasuryWeeklyDesc',
    descriptionDefault: '13-week cash forecast with threshold monitoring',
    icon: <BarChart3 className="h-8 w-8" />,
  },
];

interface ReportSelectorProps {
  selectedReport: ReportType | null;
  onSelectReport: (report: ReportType) => void;
}

export function ReportSelector({ selectedReport, onSelectReport }: ReportSelectorProps) {
  const { t } = useTranslation();

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {reportOptions.map((option) => (
        <Card
          key={option.type}
          className={`cursor-pointer transition-colors hover:border-primary ${
            selectedReport === option.type ? 'border-primary bg-primary/5' : ''
          }`}
          onClick={() => onSelectReport(option.type)}
        >
          <CardHeader className="flex flex-row items-center gap-4 pb-2">
            <div className="text-muted-foreground">{option.icon}</div>
            <CardTitle className="text-base">
              {t(option.titleKey, option.titleDefault)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {t(option.descriptionKey, option.descriptionDefault)}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
