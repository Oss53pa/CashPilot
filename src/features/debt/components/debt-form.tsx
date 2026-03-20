import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { debtContractSchema, type DebtContractFormData, type DebtContract } from '../types';

const CURRENCIES = ['XOF', 'XAF', 'USD', 'EUR', 'GBP', 'GHS', 'NGN', 'KES', 'MAD', 'TND', 'EGP'];

const DEBT_TYPES = [
  { value: 'term_loan', label: 'Term Loan' },
  { value: 'credit_facility', label: 'Credit Facility' },
  { value: 'bond', label: 'Bond' },
  { value: 'leasing', label: 'Leasing' },
  { value: 'syndicated_loan', label: 'Syndicated Loan' },
  { value: 'other', label: 'Other' },
] as const;

const PAYMENT_FREQUENCIES = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'semi_annual', label: 'Semi-Annual' },
  { value: 'annual', label: 'Annual' },
  { value: 'bullet', label: 'Bullet (At Maturity)' },
] as const;

interface DebtFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: DebtContractFormData) => void;
  defaultValues?: DebtContract | null;
  loading?: boolean;
}

export function DebtForm({
  open,
  onOpenChange,
  onSubmit,
  defaultValues,
  loading = false,
}: DebtFormProps) {
  const { t } = useTranslation();

  const form = useForm<DebtContractFormData>({
    resolver: zodResolver(debtContractSchema),
    defaultValues: {
      lender: '',
      contract_reference: '',
      type: 'term_loan',
      principal_amount: 0,
      outstanding_amount: 0,
      interest_rate: 0,
      currency: 'XOF',
      start_date: '',
      maturity_date: '',
      payment_frequency: 'monthly',
      covenants: null,
    },
  });

  useEffect(() => {
    if (defaultValues) {
      form.reset({
        lender: defaultValues.lender,
        contract_reference: defaultValues.contract_reference,
        type: defaultValues.type,
        principal_amount: defaultValues.principal_amount,
        outstanding_amount: defaultValues.outstanding_amount,
        interest_rate: defaultValues.interest_rate,
        currency: defaultValues.currency,
        start_date: defaultValues.start_date,
        maturity_date: defaultValues.maturity_date,
        payment_frequency: defaultValues.payment_frequency,
        covenants: defaultValues.covenants,
      });
    } else {
      form.reset({
        lender: '',
        contract_reference: '',
        type: 'term_loan',
        principal_amount: 0,
        outstanding_amount: 0,
        interest_rate: 0,
        currency: 'XOF',
        start_date: '',
        maturity_date: '',
        payment_frequency: 'monthly',
        covenants: null,
      });
    }
  }, [defaultValues, form]);

  const handleSubmit = (data: DebtContractFormData) => {
    onSubmit(data);
  };

  const isEditing = !!defaultValues;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing
              ? t('debt.editContract', 'Edit Debt Contract')
              : t('debt.addContract', 'Add Debt Contract')}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="lender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('debt.lender', 'Lender')}</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. BOAD, IFC" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contract_reference"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('debt.contractReference', 'Contract Reference')}</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. LOAN-2026-001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('debt.type', 'Debt Type')}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {DEBT_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="payment_frequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('debt.paymentFrequency', 'Payment Frequency')}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PAYMENT_FREQUENCIES.map((freq) => (
                          <SelectItem key={freq.value} value={freq.value}>
                            {freq.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="principal_amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('debt.principalAmount', 'Principal Amount')}</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="outstanding_amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('debt.outstandingAmount', 'Outstanding Amount')}</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('debt.currency', 'Currency')}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CURRENCIES.map((currency) => (
                          <SelectItem key={currency} value={currency}>
                            {currency}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="interest_rate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('debt.interestRate', 'Interest Rate (%)')}</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('debt.startDate', 'Start Date')}</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="maturity_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('debt.maturityDate', 'Maturity Date')}</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="covenants"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('debt.covenants', 'Covenants')}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter covenant details..."
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {t('common.cancel', 'Cancel')}
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? t('common.save', 'Save') : t('common.create', 'Create')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
