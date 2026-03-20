import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, ChevronLeft, ChevronRight } from 'lucide-react';
import type { BankAccount } from '@/types/database';
import type { OpeningBalanceEntry } from '../types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { formatCurrency } from '@/lib/utils';

interface OpeningBalanceWizardProps {
  bankAccounts: BankAccount[];
  onSubmit: (data: { fiscalYear: number; entries: OpeningBalanceEntry[] }) => void;
  isPending?: boolean;
}

export function OpeningBalanceWizard({
  bankAccounts,
  onSubmit,
  isPending,
}: OpeningBalanceWizardProps) {
  const { t } = useTranslation('opening-balance');
  const [step, setStep] = useState(1);
  const [fiscalYear, setFiscalYear] = useState(new Date().getFullYear());
  const [asOfDate, setAsOfDate] = useState('');
  const [balances, setBalances] = useState<Record<string, number>>(
    Object.fromEntries(bankAccounts.map((a) => [a.id, 0]))
  );

  function updateBalance(accountId: string, value: number) {
    setBalances((prev) => ({ ...prev, [accountId]: value }));
  }

  function handleConfirm() {
    const entries: OpeningBalanceEntry[] = bankAccounts.map((account) => ({
      account_id: account.id,
      balance: balances[account.id] ?? 0,
      as_of_date: asOfDate,
    }));
    onSubmit({ fiscalYear, entries });
  }

  const canProceedStep1 = fiscalYear > 0 && asOfDate !== '';
  const totalBalance = Object.values(balances).reduce((s, v) => s + v, 0);

  return (
    <Card className="mx-auto max-w-3xl">
      <CardHeader>
        <CardTitle>{t('wizard.title', 'Opening Balances Setup')}</CardTitle>
        <CardDescription>
          {t('wizard.step', 'Step {{step}} of 3', { step })}
        </CardDescription>
        <div className="mt-4 flex items-center gap-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-2 flex-1 rounded-full ${
                s <= step ? 'bg-primary' : 'bg-muted'
              }`}
            />
          ))}
        </div>
      </CardHeader>

      <CardContent>
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">
              {t('wizard.step1_title', 'Select Fiscal Year and Date')}
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fiscal-year">{t('wizard.fiscal_year', 'Fiscal Year')}</Label>
                <Input
                  id="fiscal-year"
                  type="number"
                  min={2000}
                  max={2100}
                  value={fiscalYear}
                  onChange={(e) => setFiscalYear(Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="as-of-date">{t('wizard.as_of_date', 'As of Date')}</Label>
                <Input
                  id="as-of-date"
                  type="date"
                  value={asOfDate}
                  onChange={(e) => setAsOfDate(e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">
              {t('wizard.step2_title', 'Enter Account Balances')}
            </h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('wizard.account', 'Account')}</TableHead>
                  <TableHead>{t('wizard.bank', 'Bank')}</TableHead>
                  <TableHead>{t('wizard.currency', 'Currency')}</TableHead>
                  <TableHead className="text-right">{t('wizard.balance', 'Balance')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bankAccounts.map((account) => (
                  <TableRow key={account.id}>
                    <TableCell className="font-medium">{account.account_name}</TableCell>
                    <TableCell>{account.bank_name}</TableCell>
                    <TableCell>{account.currency}</TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step={0.01}
                        value={balances[account.id] ?? 0}
                        onChange={(e) =>
                          updateBalance(account.id, Number(e.target.value) || 0)
                        }
                        className="h-8 text-right"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">
              {t('wizard.step3_title', 'Review and Confirm')}
            </h3>
            <div className="rounded-md border p-4 space-y-2">
              <p>
                <span className="font-medium">{t('wizard.fiscal_year', 'Fiscal Year')}:</span>{' '}
                {fiscalYear}
              </p>
              <p>
                <span className="font-medium">{t('wizard.as_of_date', 'As of Date')}:</span>{' '}
                {asOfDate}
              </p>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('wizard.account', 'Account')}</TableHead>
                  <TableHead>{t('wizard.currency', 'Currency')}</TableHead>
                  <TableHead className="text-right">{t('wizard.balance', 'Balance')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bankAccounts.map((account) => (
                  <TableRow key={account.id}>
                    <TableCell className="font-medium">
                      {account.bank_name} - {account.account_name}
                    </TableCell>
                    <TableCell>{account.currency}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(balances[account.id] ?? 0, account.currency)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="flex justify-end border-t pt-2">
              <p className="text-lg font-bold">
                {t('wizard.total', 'Total')}: {formatCurrency(totalBalance)}
              </p>
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setStep((s) => s - 1)}
          disabled={step === 1}
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          {t('wizard.back', 'Back')}
        </Button>

        {step < 3 ? (
          <Button
            onClick={() => setStep((s) => s + 1)}
            disabled={step === 1 && !canProceedStep1}
          >
            {t('wizard.next', 'Next')}
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={handleConfirm} disabled={isPending}>
            <Check className="mr-2 h-4 w-4" />
            {isPending
              ? t('wizard.saving', 'Saving...')
              : t('wizard.confirm', 'Confirm & Save')}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
