import { useTranslation } from 'react-i18next';
import { TrendingUp, Clock, PieChart as PieChartIcon, DollarSign } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { CurrencyDisplay } from '@/components/shared/currency-display';
import { CategoryPieChart } from '@/components/charts/category-pie-chart';
import type { PortfolioSummary } from '../types';

interface InvestmentDashboardProps {
  summary: PortfolioSummary | undefined;
  isLoading: boolean;
}

export function InvestmentDashboard({ summary, isLoading }: InvestmentDashboardProps) {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-20" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!summary) return null;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('investments.totalInvested', 'Total Invested')}
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <CurrencyDisplay amount={summary.total_invested} currency="XOF" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('investments.weightedAvgRate', 'Weighted Avg Rate')}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.weighted_avg_rate}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('investments.maturingWithin30Days', 'Maturing in 30 Days')}
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.maturing_within_30_days}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('investments.portfolioByType', 'Portfolio by Type')}
            </CardTitle>
            <PieChartIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.by_type.length} types</div>
          </CardContent>
        </Card>
      </div>

      {summary.by_type.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('investments.portfolioDistribution', 'Portfolio Distribution')}</CardTitle>
          </CardHeader>
          <CardContent>
            <CategoryPieChart data={summary.by_type} height={300} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
