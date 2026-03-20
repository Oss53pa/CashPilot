import { useTranslation } from 'react-i18next';
import { Lightbulb, TrendingUp, Star } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn, formatCurrency } from '@/lib/utils';
import { useCompanyStore } from '@/stores/company.store';
import { useSurplusDetection, usePlacementSuggestions } from '../hooks/use-investments';

export function InvestmentSuggestion() {
  const { t } = useTranslation();
  const currentCompany = useCompanyStore((s) => s.currentCompany);
  const companyId = currentCompany?.id;

  const { data: surpluses = [], isLoading: surplusLoading } = useSurplusDetection(companyId);
  const { data: suggestions = [], isLoading: suggestionsLoading } = usePlacementSuggestions(companyId);

  const isLoading = surplusLoading || suggestionsLoading;
  const totalExcess = surpluses.reduce((s, d) => s + d.excess_amount, 0);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 2 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  if (surpluses.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            {t('investments.suggestions', 'Investment Suggestions')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {t('investments.noSurplus', 'No surplus detected. All account balances are within thresholds.')}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Surplus Detection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-amber-500" />
            {t('investments.surplusDetected', 'Surplus Detected')}
          </CardTitle>
          <CardDescription>
            {t('investments.surplusDescription', 'The following accounts exceed their maximum threshold.')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('investments.account', 'Account')}</TableHead>
                  <TableHead className="text-right">{t('investments.currentBalance', 'Current Balance')}</TableHead>
                  <TableHead className="text-right">{t('investments.maxThreshold', 'Max Threshold')}</TableHead>
                  <TableHead className="text-right">{t('investments.excessAmount', 'Excess Amount')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {surpluses.map((s) => (
                  <TableRow key={s.account}>
                    <TableCell className="font-medium">{s.account}</TableCell>
                    <TableCell className="text-right">{formatCurrency(s.current_balance, 'XOF')}</TableCell>
                    <TableCell className="text-right">{formatCurrency(s.max_threshold, 'XOF')}</TableCell>
                    <TableCell className="text-right font-bold text-amber-600">
                      {formatCurrency(s.excess_amount, 'XOF')}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="font-bold">
                  <TableCell colSpan={3}>{t('investments.totalExcess', 'Total Excess')}</TableCell>
                  <TableCell className="text-right text-amber-600">
                    {formatCurrency(totalExcess, 'XOF')}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Placement Suggestions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-primary" />
            {t('investments.placementSuggestions', 'Suggested Placements')}
          </CardTitle>
          <CardDescription>
            {t('investments.placementDescription', 'Recommended instruments for the {{amount}} FCFA excess.', {
              amount: formatCurrency(totalExcess, 'XOF'),
            })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('investments.instrument', 'Instrument')}</TableHead>
                  <TableHead className="text-right">{t('investments.rate', 'Rate')}</TableHead>
                  <TableHead>{t('investments.term', 'Term')}</TableHead>
                  <TableHead>{t('investments.recommendation', 'Recommendation')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {suggestions.map((s, idx) => (
                  <TableRow
                    key={idx}
                    className={cn(s.recommended && 'bg-primary/5 dark:bg-primary/10')}
                  >
                    <TableCell className="font-medium">
                      {s.instrument}
                      {s.recommended && (
                        <Star className="ml-1 inline h-4 w-4 text-amber-500 fill-amber-500" />
                      )}
                    </TableCell>
                    <TableCell className="text-right font-bold">{s.rate}%</TableCell>
                    <TableCell>{s.term}</TableCell>
                    <TableCell>
                      {s.recommended ? (
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          Recommended
                        </Badge>
                      ) : (
                        <Badge variant="outline">Available</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
