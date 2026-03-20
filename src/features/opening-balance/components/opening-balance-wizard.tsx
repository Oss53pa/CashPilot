import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, ChevronLeft, ChevronRight } from 'lucide-react';
import type { BankAccount } from '@/types/database';
import type { OpeningBalanceEntry, PriorReceivable, PriorPayable } from '../types';
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
import { ReceivablesPortfolio } from './receivables-portfolio';
import { PayablesPortfolio } from './payables-portfolio';

const TOTAL_STEPS = 5;

interface OpeningBalanceWizardProps {
  bankAccounts: BankAccount[];
  initialReceivables?: PriorReceivable[];
  initialPayables?: PriorPayable[];
  onSubmit: (data: {
    fiscalYear: number;
    entries: OpeningBalanceEntry[];
    receivables: PriorReceivable[];
    payables: PriorPayable[];
  }) => void;
  isPending?: boolean;
}

export function OpeningBalanceWizard({
  bankAccounts,
  initialReceivables = [],
  initialPayables = [],
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
  const [receivables, setReceivables] = useState<PriorReceivable[]>(initialReceivables);
  const [payables, setPayables] = useState<PriorPayable[]>(initialPayables);

  function updateBalance(accountId: string, value: number) {
    setBalances((prev) => ({ ...prev, [accountId]: value }));
  }

  function handleConfirm() {
    const entries: OpeningBalanceEntry[] = bankAccounts.map((account) => ({
      account_id: account.id,
      balance: balances[account.id] ?? 0,
      as_of_date: asOfDate,
    }));
    onSubmit({ fiscalYear, entries, receivables, payables });
  }

  const canProceedStep1 = fiscalYear > 0 && asOfDate !== '';
  const totalBalance = Object.values(balances).reduce((s, v) => s + v, 0);
  const totalReceivables = receivables
    .filter((r) => r.status !== 'irrecoverable')
    .reduce((s, r) => s + r.recoverable_amount, 0);
  const totalPayables = payables.reduce((s, p) => s + p.amount_due, 0);

  return (
    <Card className="mx-auto max-w-5xl">
      <CardHeader>
        <CardTitle>{t('wizard.title', 'Opening Balances Setup')}</CardTitle>
        <CardDescription>
          {t('wizard.step', 'Step {{step}} of {{total}}', { step, total: TOTAL_STEPS })}
        </CardDescription>
        <div className="mt-4 flex items-center gap-2">
          {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((s) => (
            <div
              key={s}
              className={`h-2 flex-1 rounded-full ${
                s <= step ? 'bg-primary' : 'bg-muted'
              }`}
            />
          ))}
        </div>
        <div className="mt-2 flex justify-between text-xs text-muted-foreground">
          <span>{t('wizard.step1_label', '1. Fiscal Year')}</span>
          <span>{t('wizard.step2_label', '2. Bank Balances')}</span>
          <span>{t('wizard.step3_label', '3. Receivables')}</span>
          <span>{t('wizard.step4_label', '4. Payables')}</span>
          <span>{t('wizard.step5_label', '5. Review')}</span>
        </div>
      </CardHeader>

      <CardContent>
        {/* Step 1: Fiscal Year */}
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

        {/* Step 2: Bank Balances */}
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

        {/* Step 3: Prior Receivables */}
        {step === 3 && (
          <ReceivablesPortfolio receivables={receivables} onChange={setReceivables} />
        )}

        {/* Step 4: Prior Payables */}
        {step === 4 && (
          <PayablesPortfolio payables={payables} onChange={setPayables} />
        )}

        {/* Step 5: Review & Validate */}
        {step === 5 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">
              {t('wizard.step5_title', 'Review and Confirm')}
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

            {/* Bank Balances Summary */}
            <div>
              <h4 className="mb-2 font-medium">{t('wizard.bank_balances', 'Bank Balances')}</h4>
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
                <p className="font-bold">
                  {t('wizard.total_balances', 'Total Bank Balances')}: {formatCurrency(totalBalance, 'XOF')}
                </p>
              </div>
            </div>

            {/* Receivables Summary */}
            <div className="rounded-md border p-4">
              <p className="font-medium">
                {t('wizard.receivables_summary', 'Prior Receivables')}:{' '}
                <span className="text-green-600">{formatCurrency(totalReceivables, 'XOF')}</span>
                {' '}({receivables.length} {t('wizard.entries', 'entries')},
                {' '}{receivables.filter((r) => r.status === 'irrecoverable').length} {t('wizard.irrecoverable', 'irrecoverable excluded')})
              </p>
            </div>

            {/* Payables Summary */}
            <div className="rounded-md border p-4">
              <p className="font-medium">
                {t('wizard.payables_summary', 'Prior Payables')}:{' '}
                <span className="text-red-600">{formatCurrency(totalPayables, 'XOF')}</span>
                {' '}({payables.length} {t('wizard.entries', 'entries')})
              </p>
            </div>

            {/* Net Position */}
            <div className="rounded-md bg-muted p-4">
              <p className="text-lg font-bold">
                {t('wizard.net_position', 'Net Opening Position')}:{' '}
                {formatCurrency(totalBalance + totalReceivables - totalPayables, 'XOF')}
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

        {step < TOTAL_STEPS ? (
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
