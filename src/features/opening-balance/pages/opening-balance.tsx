import { useTranslation } from 'react-i18next';
import { useCompanyStore } from '@/stores/company.store';
import { PageHeader } from '@/components/shared/page-header';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  useOpeningBalances,
  useBankAccountsForBalance,
  useSaveOpeningBalances,
} from '../hooks/use-opening-balance';
import { OpeningBalanceWizard } from '../components/opening-balance-wizard';

export default function OpeningBalancePage() {
  const { t } = useTranslation('opening-balance');
  const currentCompany = useCompanyStore((s) => s.currentCompany);
  const companyId = currentCompany?.id ?? '';

  const { data: existingBalances = [], isLoading: balancesLoading } =
    useOpeningBalances(companyId);
  const { data: bankAccounts = [], isLoading: accountsLoading } =
    useBankAccountsForBalance(companyId);
  const saveBalances = useSaveOpeningBalances(companyId);

  const isLoading = balancesLoading || accountsLoading;
  const hasExistingBalances = existingBalances.length > 0;

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('title', 'Opening Balances')}
        description={t(
          'description',
          'Set initial balances for all bank accounts at the start of the fiscal year.'
        )}
      />

      {hasExistingBalances && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">
            {t('current_balances', 'Current Opening Balances')}
          </h2>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('table.account', 'Account')}</TableHead>
                  <TableHead>{t('table.currency', 'Currency')}</TableHead>
                  <TableHead className="text-right">
                    {t('table.balance', 'Balance')}
                  </TableHead>
                  <TableHead>{t('table.as_of', 'As of Date')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {existingBalances.map((entry: Record<string, unknown>) => (
                  <TableRow key={entry.id as string}>
                    <TableCell className="font-medium">
                      {(entry.bank_accounts as Record<string, string>)?.bank_name} -{' '}
                      {(entry.bank_accounts as Record<string, string>)?.account_name}
                    </TableCell>
                    <TableCell>
                      {(entry.bank_accounts as Record<string, string>)?.currency}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(
                        entry.balance as number,
                        (entry.bank_accounts as Record<string, string>)?.currency
                      )}
                    </TableCell>
                    <TableCell>{formatDate(entry.as_of_date as string)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">
          {hasExistingBalances
            ? t('update_balances', 'Update Opening Balances')
            : t('set_balances', 'Set Opening Balances')}
        </h2>
        <OpeningBalanceWizard
          bankAccounts={bankAccounts}
          onSubmit={({ fiscalYear, entries }) =>
            saveBalances.mutate({ fiscalYear, entries })
          }
          isPending={saveBalances.isPending}
        />
      </div>
    </div>
  );
}
