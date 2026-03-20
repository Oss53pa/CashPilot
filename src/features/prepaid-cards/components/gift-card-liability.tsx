import { useTranslation } from 'react-i18next';
import { CreditCard, AlertCircle } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/utils';
import { useCompanyStore } from '@/stores/company.store';
import { useGiftCardLiability } from '../hooks/use-prepaid-cards';

export function GiftCardLiabilityCard() {
  const { t } = useTranslation();
  const currentCompany = useCompanyStore((s) => s.currentCompany);
  const companyId = currentCompany?.id;

  const { data: liability, isLoading } = useGiftCardLiability(companyId);

  if (isLoading) {
    return <Skeleton className="h-48 w-full" />;
  }

  if (!liability) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          {t('prepaidCards.giftLiability', 'Gift Card Liability')}
        </CardTitle>
        <CardDescription>
          {t('prepaidCards.giftLiabilityDescription', 'Outstanding gift card liability impacts net treasury.')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">
              {t('prepaidCards.totalIssued', 'Total Issued')}
            </p>
            <p className="text-xl font-bold">{formatCurrency(liability.total_issued, 'XOF')}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">
              {t('prepaidCards.totalUsed', 'Total Used')}
            </p>
            <p className="text-xl font-bold text-green-600">{formatCurrency(liability.total_used, 'XOF')}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">
              {t('prepaidCards.totalExpired', 'Total Expired')}
            </p>
            <p className="text-xl font-bold text-muted-foreground">{formatCurrency(liability.total_expired, 'XOF')}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">
              {t('prepaidCards.outstandingLiability', 'Outstanding Liability')}
            </p>
            <p className="text-xl font-bold text-red-600">{formatCurrency(liability.outstanding_liability, 'XOF')}</p>
          </div>
        </div>
        <div className="mt-4 flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/30">
          <AlertCircle className="mt-0.5 h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <p className="text-sm text-amber-800 dark:text-amber-200">
            {t(
              'prepaidCards.liabilityNote',
              'Outstanding liability (Issued - Used - Expired = {{amount}}) is deducted from net treasury position.',
              { amount: formatCurrency(liability.outstanding_liability, 'XOF') }
            )}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
